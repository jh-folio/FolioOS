"""저장된 RSS 기사의 시장 태그를 다시 계산한다. 기본은 dry-run이며 아무것도 쓰지 않는다.

회사 매칭이 흔한 명사 하나에 걸리던 시절(`private`·`research`·`business`·`innovation`)
독일어·이탈리아어 기사에 미국 대형주가 붙었고, `infer_doc_markets`가 그 종목의 시장을
읽으므로 기사까지 `US`로 찍혔다 — Handelsblatt 1,260건 중 1,247건이 그랬다.

매처는 고쳤지만 **태그는 파일 front matter에 이미 박혀 있고** 추론이 저장값을 먼저 읽는다
(`infer_doc_markets`의 첫 사다리). 그래서 기존 자료는 다시 계산해 주지 않으면 그대로다.

계산은 수집 경로와 **같은 규칙**을 쓴다(`writer.py`):

    markets_with_feed_fallback(infer_doc_markets({title, summary, content, url, source}),
                               feed_market_for_media(media))

`markets`만 고쳐 쓴다. 다른 front matter 항목과 본문은 건드리지 않는다. 쓰기는 원자적이며
바꿀 것이 없는 파일은 열지도 않는다.

    py -3 scripts/retag_rss_markets.py              # dry-run
    py -3 scripts/retag_rss_markets.py --apply      # 실제 반영
    py -3 scripts/retag_rss_markets.py --limit 500  # 표본만
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.atomic_replace import write_bytes_atomic
from features.common.market_calendar import infer_doc_markets
from features.common.research_library.indexing.service import parse_frontmatter
from features.common.research_library.rss.feed_config import feed_market_for_media
from features.common.research_library.rss.normalizer import markets_with_feed_fallback
from features.common.workspace import research_inbox_dir

MARKETS_LINE_RE = re.compile(r"^markets:.*$", re.MULTILINE)


def recomputed_markets(meta: dict, body: str) -> list[str]:
    """수집 경로와 같은 입력으로 다시 계산한다.

    저장된 `markets`를 넘기지 않는 것이 핵심이다. 넘기면 추론이 그 값을 그대로 돌려주고
    (사다리 1단계) 아무것도 바뀌지 않는다.
    """
    return markets_with_feed_fallback(
        infer_doc_markets({
            "title": meta.get("title") or "",
            "summary": meta.get("summary") or meta.get("description") or "",
            "content": body or "",
            "url": meta.get("url") or "",
            "source": meta.get("source") or "",
        }),
        feed_market_for_media(meta.get("source") or ""),
    )


def resolved_markets(meta: dict, body: str, stored: list[str]) -> list[str]:
    """다시 계산한 값을 쓰되, **구체적인 태그를 `UNKNOWN`으로 덮지 않는다.**

    `UNKNOWN`은 "이 기사는 어느 시장도 아니다"가 아니라 "우리 표가 못 읽었다"이다. 실측으로
    Reuters `summary_only` 121건이 그렇게 걸렸다 — "American Airlines shakes up leadership",
    "Fitch keeps United States at 'AA+'"처럼 명백한 미국 기사인데, `company_master.json`에
    American Airlines가 없고 `US_TOKENS`에 `united states`·`u.s.`가 없어 신호가 잡히지 않는다.
    표의 한계를 자료의 결론으로 바꾸면 그 기사들이 모든 브리핑에서 사라진다.

    예외는 `GLOBAL` 단독이다. 그건 시장이 아니라 네 시장 브리핑이 모두 근거로 쓴다는
    통행권이고, 신호가 하나도 없는 자료가 그걸 가진 유일한 이유가 피드 선언이었다
    (§`markets_with_feed_fallback`). 그 경우만 `UNKNOWN`으로 내린다.
    """
    after = [m.upper() for m in recomputed_markets(meta, body)]
    if after == ["UNKNOWN"] and stored and stored != ["GLOBAL"]:
        return list(stored)
    return after


def _stored_markets(meta: dict) -> list[str]:
    raw = meta.get("markets")
    if isinstance(raw, list):
        return [str(v).strip().upper() for v in raw if str(v or "").strip()]
    text = str(raw or "").strip().strip("[]")
    return [part.strip().strip('"').upper() for part in text.split(",") if part.strip()]


def _rewrite(path: Path, markets: list[str]) -> bool:
    """front matter의 `markets` 한 줄만 바꿔 쓴다."""
    raw = path.read_text(encoding="utf-8")
    head, sep, rest = raw.partition("\n---")
    if not sep:
        return False
    line = "markets: [" + ", ".join(f'"{m}"' for m in markets) + "]"
    if MARKETS_LINE_RE.search(head):
        head = MARKETS_LINE_RE.sub(line, head, count=1)
    else:
        head = head.rstrip("\n") + "\n" + line
    write_bytes_atomic(path, (head + sep + rest).encode("utf-8"))
    return True


def run(rss_dir: Path, *, apply: bool, limit: int) -> dict:
    files = sorted(rss_dir.glob("*.md"))
    if limit:
        files = files[:limit]
    changes: Counter = Counter()
    sources: Counter = Counter()
    unreadable = 0
    applied = 0
    skipped_no_tag = 0
    for path in files:
        try:
            raw = path.read_text(encoding="utf-8")
            meta, body = parse_frontmatter(raw)
        except (OSError, ValueError):
            unreadable += 1
            continue
        if not meta or meta.get("markets") is None:
            # 옛 줄 형식 파일에는 시장 태그가 아예 없다(전체 26,503건 중 9,365건). 그런
            # 문서는 색인이 읽을 때마다 본문에서 계산하므로, 매처를 고친 지금 재색인만
            # 하면 따라온다 — 파일을 건드릴 이유가 없다.
            skipped_no_tag += 1
            continue
        before = _stored_markets(meta)
        after = resolved_markets(meta, body, before)
        if before == after:
            continue
        changes[f"{','.join(before) or '-'} -> {','.join(after) or '-'}"] += 1
        sources[str(meta.get("source") or "?")] += 1
        if apply and _rewrite(path, after):
            applied += 1
    return {
        "rssDir": str(rss_dir),
        "files": len(files),
        "changed": sum(changes.values()),
        "applied": applied,
        "unreadable": unreadable,
        "skippedNoTag": skipped_no_tag,
        "transitions": changes.most_common(15),
        "sources": sources.most_common(12),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rss-dir", default=str(research_inbox_dir() / "rss"))
    parser.add_argument("--apply", action="store_true", help="실제로 파일을 고친다. 기본은 dry-run.")
    parser.add_argument("--limit", type=int, default=0, help="앞에서 N개만 본다(표본 확인용)")
    parser.add_argument("--out", default="")
    args = parser.parse_args()

    rss_dir = Path(args.rss_dir)
    if not rss_dir.is_dir():
        print(f"RSS 폴더가 없습니다: {rss_dir}")
        return 1

    report = run(rss_dir, apply=args.apply, limit=args.limit)
    report["mode"] = "apply" if args.apply else "dry-run"
    print(f"폴더: {report['rssDir']}")
    print(f"모드: {report['mode']}  파일 {report['files']}  태그 없음 {report['skippedNoTag']}  바뀔 것 {report['changed']}  적용 {report['applied']}")
    print("전환 상위:")
    for label, count in report["transitions"]:
        print(f"    {label:34} {count:6}")
    print("매체 상위:")
    for media, count in report["sources"]:
        print(f"    {media:28} {count:6}")
    if args.out:
        write_bytes_atomic(Path(args.out), json.dumps(report, ensure_ascii=False, indent=2).encode("utf-8"))
        print("보고서:", args.out)
    if args.apply:
        print("\n색인을 다시 만들어야 화면에 반영됩니다: RSS 수집 또는 /api/index")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
