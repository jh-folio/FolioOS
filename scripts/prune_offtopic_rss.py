"""수집 게이트가 지금이라면 받지 않았을 RSS 자료를 걷어낸다. 기본은 dry-run이다.

종합 헤드라인 피드를 받던 시절의 자료가 그대로 남아 있다. 실측으로 Handelsblatt
1,274건 중 politik 423 · karriere 68 · video 31 · meinung 57이고, 쾰른 아이스크림
창업자 기사가 유럽 브리핑 자료 풀에 들어와 있었다. 피드를 섹션 피드로 바꿨고 섞여
오는 매체에는 `url_sections` 규칙을 붙였지만, **그건 앞으로 들어올 것에만 적용된다**.

기준은 하나다 — `url_section_allowed()`. 수집 단계가 쓰는 바로 그 함수이고, 그
매체의 **활성 피드 중 하나라도** 받아들이면 남긴다. 즉 "지금 다시 수집한다면 이
파일이 들어왔겠는가"를 그대로 묻는다. 기준을 여기 따로 적으면 설정을 고칠 때마다
조용히 어긋나므로, 판단은 전부 `config/rss_feeds.yaml`에서 온다.

건드리지 않는 것:

* 설정에 피드가 없는 매체(구독을 내린 Reuters 등). 그건 다른 결정이고 훨씬 무겁다.
* `url_sections` 규칙이 없는 피드의 자료. 규칙이 없으면 게이트도 아무것도 하지 않는다.
* URL에 섹션이 없는 자료. 게이트와 같은 이유로 남긴다(구조 신호가 없다고 버리지 않는다).
* 언어 키워드 게이트. 한국어·영어로만 쓰여 있어 독일어·이탈리아어 기사에 소급하면
  읽지 못하는 언어를 무관하다고 판정한다. 섹션은 매체가 스스로 붙인 분류라 다르다.

**지우는 것은 파일뿐이다.** `retention.py`와 같은 계약이다 — `rss_feed_items`는
`refresh_rss_feed_cache()`가, `documents`/`chunks`/FTS/`file_manifest`는
`build_index(incremental=True)`가 걷어낸다. 같은 일을 하는 삭제 SQL을 여기 쓰면
인덱서가 바뀔 때마다 어긋난다. 어느 쪽도 손대지 않는 `evidence_items`만
`prune_orphan_evidence()`로 함께 정리한다.

    py -3 scripts/prune_offtopic_rss.py                  # dry-run
    py -3 scripts/prune_offtopic_rss.py --media Handelsblatt
    py -3 scripts/prune_offtopic_rss.py --apply          # 실제 삭제
    py -3 scripts/prune_offtopic_rss.py --apply --trash data/pruned-rss   # 지우지 말고 옮긴다
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.atomic_replace import write_bytes_atomic
from features.common.config_bootstrap import resolve_config
from features.common.research_library.indexing.service import (
    parse_frontmatter,
    parse_rssarchive_markdown,
)
from features.common.research_library.rss.feed_config import load_rss_feeds
from features.common.research_library.rss.relevance import url_section_allowed
from features.common.workspace import data_dir, research_inbox_dir


def feeds_by_media(config_path: Path | None = None) -> dict[str, list[dict]]:
    """활성 피드를 매체 이름으로 묶는다. 한 매체가 섹션 피드를 여럿 가질 수 있다."""
    grouped: dict[str, list[dict]] = defaultdict(list)
    for feed in load_rss_feeds(config_path or resolve_config("rss_feeds.yaml")):
        if feed.get("enabled") is False:
            continue
        grouped[str(feed.get("media") or "").strip()].append(feed)
    return dict(grouped)


def restricted_media(grouped: dict[str, list[dict]]) -> dict[str, list[str]]:
    """섹션 규칙이 걸린 매체와 그 매체가 지금 받는 섹션.

    규칙 없는 피드가 하나라도 있으면 그 매체는 제한이 없다 — 그 피드가 무엇이든
    받아들이기 때문이다. 화면에 보여줄 용도이며 판정 자체는 게이트 함수가 한다.
    """
    rows: dict[str, list[str]] = {}
    for media, feeds in grouped.items():
        if any(not (feed.get("url_sections") or {}) for feed in feeds):
            continue
        sections: list[str] = []
        for feed in feeds:
            for name in (feed.get("url_sections") or {}).get("allow") or []:
                if name not in sections:
                    sections.append(name)
        rows[media] = sections
    return rows


def _read_meta(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8", errors="replace")
    meta, _ = parse_frontmatter(raw)
    if not meta:
        meta, _ = parse_rssarchive_markdown(raw)
    return meta or {}


def _section(url: str) -> str:
    segments = [part for part in urlsplit(str(url or "")).path.split("/") if part]
    return segments[0].lower() if segments else "(없음)"


def survives(url: str, feeds: list[dict]) -> bool:
    """그 매체의 활성 피드 중 하나라도 받아들이면 남긴다."""
    return any(url_section_allowed(url, feed) for feed in feeds)


def scan(rss_dir: Path, grouped: dict[str, list[dict]], only_media: str = "") -> dict:
    restricted = restricted_media(grouped)
    doomed: list[Path] = []
    per_media: Counter = Counter()
    per_section: dict[str, Counter] = defaultdict(Counter)
    kept_restricted = 0
    unreadable = 0
    for path in sorted(rss_dir.glob("*.md")):
        try:
            meta = _read_meta(path)
        except OSError:
            unreadable += 1
            continue
        media = str(meta.get("source") or "").strip()
        if media not in restricted:
            continue
        if only_media and media != only_media:
            continue
        url = str(meta.get("url") or "")
        if survives(url, grouped[media]):
            kept_restricted += 1
            continue
        doomed.append(path)
        per_media[media] += 1
        per_section[media][_section(url)] += 1
    return {
        "rssDir": str(rss_dir),
        "restrictedMedia": restricted,
        "candidates": len(doomed),
        "keptInRestrictedMedia": kept_restricted,
        "unreadable": unreadable,
        "byMedia": per_media.most_common(),
        "bySection": {media: counts.most_common() for media, counts in per_section.items()},
        "paths": doomed,
    }


def remove(paths: list[Path], rss_dir: Path, trash: Path | None) -> dict:
    """파일만 처리한다. RSS 폴더 밖은 어떤 이유로도 건드리지 않는다(§6 절대 규칙 2)."""
    root = rss_dir.resolve()
    if trash:
        trash.mkdir(parents=True, exist_ok=True)
    done = 0
    freed = 0
    failed = 0
    for path in paths:
        try:
            if path.resolve().parent != root:
                continue
            size = path.stat().st_size
            if trash:
                shutil.move(str(path), str(trash / path.name))
            else:
                path.unlink()
        except OSError:
            failed += 1
            continue
        done += 1
        freed += size
    return {"removed": done, "freedBytes": freed, "failed": failed}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rss-dir", default=str(research_inbox_dir() / "rss"))
    parser.add_argument("--apply", action="store_true", help="실제로 처리한다. 기본은 dry-run.")
    parser.add_argument("--trash", default="", help="지우는 대신 이 폴더로 옮긴다(되돌릴 수 있다)")
    parser.add_argument("--media", default="", help="이 매체만 본다")
    parser.add_argument("--out", default="")
    args = parser.parse_args()

    rss_dir = Path(args.rss_dir)
    if not rss_dir.is_dir():
        print(f"RSS 폴더가 없습니다: {rss_dir}")
        return 1

    grouped = feeds_by_media()
    report = scan(rss_dir, grouped, only_media=args.media.strip())
    paths = report.pop("paths")
    report["mode"] = "apply" if args.apply else "dry-run"

    print(f"폴더: {report['rssDir']}")
    print("섹션 규칙이 걸린 매체:")
    for media, sections in report["restrictedMedia"].items():
        print(f"    {media:26} 수집 섹션 {', '.join(sections) or '(없음)'}")
    print(f"\n대상 {report['candidates']}건 · 규칙 안에서 남는 것 {report['keptInRestrictedMedia']}건")
    for media, count in report["byMedia"]:
        print(f"\n  {media}  {count}건")
        for section, n in report["bySection"][media]:
            print(f"      {section:26} {n:5}")

    if args.apply and paths:
        trash = Path(args.trash) if args.trash else None
        result = remove(paths, rss_dir, trash)
        report.update(result)
        where = f"{trash}로 옮김" if trash else "삭제"
        print(f"\n{where}: {result['removed']}건 · {result['freedBytes']/1_048_576:.1f}MB · 실패 {result['failed']}")
        from features.common.research_library.rss.retention import prune_orphan_evidence

        orphans = prune_orphan_evidence()
        report["evidenceRowsPruned"] = orphans
        print(f"고아 evidence 행 정리: {orphans}건")
        print("색인을 다시 만들어야 화면과 브리핑에 반영됩니다: RSS 수집 또는 /api/index")
    elif not args.apply:
        print("\n(dry-run — 아무것도 지우지 않았습니다. --apply로 실행합니다)")

    if args.out:
        write_bytes_atomic(Path(args.out), json.dumps(report, ensure_ascii=False, indent=2).encode("utf-8"))
        print("보고서:", args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
