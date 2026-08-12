"""저장된 브리핑을 세션 키로 옮긴다. 기본은 dry-run이며 아무것도 쓰지 않는다.

저장 키가 발행일에서 세션일로 넘어갔다(`{세션일}.{시장}.json`). 새로 만드는 보고서는
이미 그 규칙을 쓰고, dual-read가 옛 파일도 찾아 주므로 이관 없이도 화면은 정상이다.
이관은 흩어진 이름을 정리하는 일이다.

**옮기기는 원본을 지우지 않는다.** 새 이름으로 복사하고 매니페스트에 남긴다. 삭제는
별도 승인 대상이며 이 스크립트가 하지 않는다.

세션은 파일명이 아니라 **내용**에서 읽는다. `effective_session_date()`가 "세션 창이 저장된
`sessionDate`를 이긴다"는 기존 읽기 규칙을 쓰므로, 창을 못 받고 만들어진 옛 보고서에
발행일이 `sessionDate`로 박혀 있어도 실제로 다루는 세션으로 분류된다.

    py -3 scripts/migrate_briefing_session_keys.py                     # dry-run
    py -3 scripts/migrate_briefing_session_keys.py --briefings-dir ... # 다른 워크스페이스
    py -3 scripts/migrate_briefing_session_keys.py --apply             # 실제 복사
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.atomic_replace import write_bytes_atomic
from features.common.workspace import data_dir
from features.daily_briefing.schema import SINGLE_MARKET_SCOPES
from features.daily_briefing.service import effective_session_date

SCOPED_RE = re.compile(
    r"^(?P<date>\d{4}-\d{2}-\d{2})\.(?P<market>" + "|".join(SINGLE_MARKET_SCOPES) + r")\.json$"
)
LEGACY_RE = re.compile(r"^(?P<date>\d{4}-\d{2}-\d{2})\.json$")
# 보고서와 함께 움직여야 하는 사이드카. 이름이 갈리면 저장은 됐는데 화면이 못 찾는다.
SIDECAR_SUFFIXES = (".visuals.json.gz", ".visuals.json")


def _fingerprint(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def _rows(briefings_dir: Path) -> list[dict]:
    rows: list[dict] = []
    for path in sorted(briefings_dir.glob("*.json")):
        legacy = LEGACY_RE.match(path.name)
        if legacy:
            rows.append({
                "source": path.name,
                "classification": "legacy_date_only",
                # 날짜만 있는 파일은 여러 시장을 담고 있어 자동으로 나눌 수 없다.
                # 잘못 나누면 한 시장 세션으로 오분류된다. 읽기 전용으로 남긴다.
                "reason": "multi-market legacy report; not safely splittable",
                "target": "",
                "fingerprint": _fingerprint(path),
            })
            continue
        scoped = SCOPED_RE.match(path.name)
        if not scoped:
            continue
        market = scoped.group("market")
        try:
            report = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            rows.append({
                "source": path.name, "classification": "unreadable",
                "reason": f"{type(exc).__name__}", "target": "", "fingerprint": "",
            })
            continue
        session = effective_session_date(report, market)
        row = {
            "source": path.name,
            "market": market,
            "storedDate": scoped.group("date"),
            "sessionDate": session,
            "generatedAt": str(report.get("generatedAt") or ""),
            "fingerprint": _fingerprint(path),
        }
        if not session:
            row.update({"classification": "no_session", "target": "",
                        "reason": "effective session could not be resolved"})
        elif session == scoped.group("date"):
            row.update({"classification": "already_session_keyed", "target": path.name})
        else:
            row.update({"classification": "move", "target": f"{session}.{market}.json"})
        rows.append(row)
    return rows


def _resolve_collisions(rows: list[dict]) -> list[dict]:
    """같은 세션으로 가는 파일이 둘이면 `generatedAt` 최신이 authority다.

    패자는 옮기지 않고 그대로 둔다. 합치지 않는다 — 두 보고서는 서로 다른 자료로 만들어진
    다른 판본이고, 섞으면 어느 쪽도 아닌 것이 된다.
    """
    by_target: dict[str, list[dict]] = {}
    for row in rows:
        if row.get("classification") in {"move", "already_session_keyed"} and row.get("target"):
            by_target.setdefault(row["target"], []).append(row)
    for target, group in by_target.items():
        if len(group) < 2:
            continue
        winner = max(group, key=lambda item: (item.get("generatedAt") or "", item["source"]))
        for row in group:
            if row is winner:
                row["collision"] = f"authority for {target}"
                continue
            row["classification"] = "collision_skipped"
            row["collision"] = f"loses to {winner['source']} (later generatedAt)"
            row["target"] = ""
    return rows


def _sidecars(briefings_dir: Path, rows: list[dict]) -> list[dict]:
    moves = []
    for row in rows:
        if row.get("classification") != "move":
            continue
        stem = f"{row['storedDate']}.{row['market']}"
        target_stem = f"{row['sessionDate']}.{row['market']}"
        for suffix in SIDECAR_SUFFIXES:
            source = briefings_dir / f"{stem}{suffix}"
            if source.exists():
                moves.append({
                    "source": source.name,
                    "target": f"{target_stem}{suffix}",
                    "classification": "move",
                    "fingerprint": _fingerprint(source),
                })
    return moves


def _classify_targets(briefings_dir: Path, rows: list[dict], sidecars: list[dict]) -> dict:
    """목적지가 이미 차 있는 이동을 **연쇄**와 **진짜 충돌**로 가른다.

    미국장 발행일은 세션일보다 한 거래일 앞서므로, 연속한 날짜의 보고서가 나란히 한 칸씩
    당겨진다: `07-01.us -> 06-30.us`인데 그 `06-30.us`도 `06-29.us`로 옮겨간다. 목적지가
    차 있다는 것만 보면 충돌처럼 보이지만 그 파일은 스스로 비켜난다.

    **원본을 지우지 않는 복사 방식으로는 연쇄를 실행할 수 없다.** 비켜나야 할 파일이 그대로
    있으므로 새 내용이 그 위를 덮게 된다. 그래서 연쇄가 하나라도 있으면 apply를 막고,
    실행 방식을 정하는 것은 사람에게 남긴다.
    """
    moves = [row for row in [*rows, *sidecars] if row.get("classification") == "move" and row.get("target")]
    sources = {row["source"] for row in moves}
    chained, conflicts = [], []
    for row in moves:
        if not (briefings_dir / row["target"]).exists():
            continue
        (chained if row["target"] in sources else conflicts).append(
            {"source": row["source"], "target": row["target"]}
        )
    return {"chained": chained, "conflicts": conflicts}


def build_manifest(briefings_dir: Path) -> dict:
    rows = _resolve_collisions(_rows(briefings_dir))
    sidecars = _sidecars(briefings_dir, rows)
    targets = _classify_targets(briefings_dir, rows, sidecars)
    counts: dict[str, int] = {}
    for row in rows:
        counts[row["classification"]] = counts.get(row["classification"], 0) + 1
    return {
        "briefingsDir": str(briefings_dir),
        "reports": rows,
        "sidecars": sidecars,
        "counts": counts,
        "sidecarMoves": len(sidecars),
        "chainedMoves": targets["chained"],
        "targetConflicts": targets["conflicts"],
        # 연쇄가 있으면 복사 방식으로는 옮길 수 없다. 실행 방식을 정하는 것은 사람 몫이다.
        "applySafe": not targets["chained"] and not targets["conflicts"],
    }


def apply_manifest(briefings_dir: Path, manifest: dict) -> list[str]:
    """새 이름으로 **복사**한다. 원본은 남긴다.

    목적지가 이미 있으면 건너뛴다 — 덮어쓰면 이관이 데이터를 지우는 일이 된다.
    """
    applied = []
    for row in [*manifest["reports"], *manifest["sidecars"]]:
        if row.get("classification") != "move" or not row.get("target"):
            continue
        source = briefings_dir / row["source"]
        target = briefings_dir / row["target"]
        if target.exists():
            row["result"] = "skipped_target_exists"
            continue
        write_bytes_atomic(target, source.read_bytes())
        row["result"] = "copied"
        applied.append(f"{row['source']} -> {row['target']}")
    return applied


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--briefings-dir", default=str(data_dir() / "briefings"))
    parser.add_argument("--apply", action="store_true", help="실제로 복사한다. 기본은 dry-run.")
    parser.add_argument("--out", default="", help="매니페스트를 저장할 경로")
    args = parser.parse_args()

    briefings_dir = Path(args.briefings_dir)
    if not briefings_dir.is_dir():
        print(f"브리핑 폴더가 없습니다: {briefings_dir}")
        return 1

    manifest = build_manifest(briefings_dir)
    manifest["mode"] = "apply" if args.apply else "dry-run"
    if args.apply and not manifest["applySafe"]:
        # 연쇄를 복사로 실행하면 비켜나야 할 파일 위에 새 내용을 덮는다. 막는다.
        print("연쇄 이동이 있어 복사 방식으로 옮길 수 없습니다. dry-run 결과를 보고 방식을 정하세요.")
        print(f"  연쇄 {len(manifest['chainedMoves'])}건 · 진짜 충돌 {len(manifest['targetConflicts'])}건")
        return 2
    if args.apply:
        manifest["applied"] = apply_manifest(briefings_dir, manifest)

    print(f"폴더: {manifest['briefingsDir']}")
    print(f"모드: {manifest['mode']}")
    for name, count in sorted(manifest["counts"].items()):
        print(f"  {name:24} {count}")
    print(f"  {'sidecar moves':24} {manifest['sidecarMoves']}")
    print(f"  {'chained moves':24} {len(manifest['chainedMoves'])}")
    print(f"  {'target conflicts':24} {len(manifest['targetConflicts'])}")
    print(f"  {'apply safe':24} {manifest['applySafe']}")
    for row in manifest["reports"]:
        if row["classification"] == "move":
            print(f"    이동  {row['source']:28} -> {row['target']}")
        elif row["classification"] == "collision_skipped":
            print(f"    충돌  {row['source']:28} -- {row['collision']}")
    if args.out:
        write_bytes_atomic(Path(args.out), json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8"))
        print(f"매니페스트: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
