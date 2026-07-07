from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RSS_DIR = ROOT / "research-inbox" / "rss"
PLAN_PATH = ROOT / "data" / "rss-duplicate-cleanup-plan.json"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.research_library.indexing.service import parse_rssarchive_markdown
from features.common.research_library.rss.policy import normalize_url

STATUS_RANK = {
    "full_text": 5,
    "summary_only": 4,
    "needs_manual_save": 3,
    "fetch_failed": 2,
    "legacy": 1,
    "legacy_rss": 1,
}


def _legacy_url(raw: str) -> str:
    patterns = (
        r"^-\s+URL:\s*(https?://\S+)\s*$",
        r"Original link:\s*(https?://\S+)",
    )
    for pattern in patterns:
        match = re.search(pattern, raw, re.M)
        if match:
            return match.group(1).strip()
    return ""


def rss_file_key(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="replace")
    meta, _body = parse_rssarchive_markdown(raw)
    meta = meta or {}
    url = (
        str(meta.get("normalizedUrl") or "").strip()
        or normalize_url(str(meta.get("url") or "").strip())
        or normalize_url(_legacy_url(raw))
    )
    return url


def rss_file_status(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="replace")
    meta, _body = parse_rssarchive_markdown(raw)
    status = str((meta or {}).get("collectionStatus") or "").strip().lower()
    if status:
        return status
    if re.search(r"^collection_status\s*:", raw, re.M):
        return "summary_only"
    return "legacy"


def file_score(path: Path) -> tuple[int, float]:
    status = rss_file_status(path)
    return (STATUS_RANK.get(status, 0), path.stat().st_mtime)


def build_plan(rss_dir: Path) -> dict:
    groups: dict[str, list[Path]] = {}
    skipped = []
    for path in sorted(rss_dir.glob("*.md")):
        try:
            key = rss_file_key(path)
        except Exception as exc:
            skipped.append({"path": str(path), "reason": str(exc)})
            continue
        if not key:
            skipped.append({"path": str(path), "reason": "missing_url"})
            continue
        groups.setdefault(key, []).append(path)

    duplicate_groups = []
    delete_paths = []
    for key, paths in groups.items():
        if len(paths) < 2:
            continue
        keep = max(paths, key=file_score)
        deletes = [path for path in paths if path != keep]
        delete_paths.extend(deletes)
        duplicate_groups.append({
            "key": key,
            "keep": str(keep),
            "keepStatus": rss_file_status(keep),
            "delete": [{"path": str(path), "status": rss_file_status(path)} for path in sorted(deletes)],
        })

    duplicate_groups.sort(key=lambda item: len(item["delete"]), reverse=True)
    return {
        "rssDir": str(rss_dir),
        "totalFiles": len(list(rss_dir.glob("*.md"))),
        "duplicateGroups": len(duplicate_groups),
        "deleteCount": len(delete_paths),
        "groups": duplicate_groups,
        "skipped": skipped,
    }


def write_plan(plan: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")


def apply_plan(plan: dict) -> int:
    deleted = 0
    for group in plan.get("groups", []):
        for item in group.get("delete", []):
            path = Path(item.get("path") or "")
            if path.exists() and path.is_file() and path.suffix.lower() == ".md":
                path.unlink()
                deleted += 1
    return deleted


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run or apply RSS duplicate archive cleanup by normalized URL.")
    parser.add_argument("--rss-dir", default=str(RSS_DIR))
    parser.add_argument("--plan", default=str(PLAN_PATH))
    parser.add_argument("--apply", action="store_true", help="Delete duplicate files from the generated plan.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--sample", type=int, default=20, help="Number of duplicate groups to print.")
    args = parser.parse_args()

    rss_dir = Path(args.rss_dir)
    plan_path = Path(args.plan)
    plan = build_plan(rss_dir)
    write_plan(plan, plan_path)

    print(f"RSS dir: {plan['rssDir']}")
    print(f"Total files: {plan['totalFiles']}")
    print(f"Duplicate groups: {plan['duplicateGroups']}")
    print(f"Files marked for deletion: {plan['deleteCount']}")
    print(f"Plan written: {plan_path}")
    print("")
    for group in plan["groups"][: max(0, args.sample)]:
        print(f"[KEEP] {group['keep']} ({group['keepStatus']})")
        for item in group["delete"][:6]:
            print(f"  [DELETE] {item['path']} ({item['status']})")
        if len(group["delete"]) > 6:
            print(f"  ... {len(group['delete']) - 6} more")
    if args.apply:
        if not args.yes:
            raise SystemExit("--apply requires --yes")
        deleted = apply_plan(plan)
        print(f"Deleted files: {deleted}")
    else:
        print("")
        print("Dry run only. Re-run with --apply --yes after user approval to delete files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
