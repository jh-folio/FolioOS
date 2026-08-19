"""KOSPI200 구성종목 파일에 한글 정식명을 별칭으로 채운다.

`config/kospi200_constituents.json`은 이름이 전부 영문이다(위키백과 KOSPI 200 표기).
그래서 한국장 브리핑이 본문에 `LG전자`라고 쓰면 후보에 오르지 못하고, 주도 기업 차트가
빈자리로 나간다.

한글 이름은 DART 상장 종목 목록(`data/dart-cache/corp_codes.json`)에 있지만 그 파일은
**배포에 없다** — 21.6MB이고 `DART_API_KEY`가 있어야 받아진다. 게다가 그것을 받아오는
경로는 기업분석에만 있어서, 브리핑만 발행하는 워크스페이스에는 영원히 생기지 않는다.
그래서 199곳어치 한글명이라는 **작은 파생 결과만 뽑아 설정에 커밋한다**. 키 없이 새로
설치한 사용자도 그대로 쓴다.

`_constituent_entries()`가 이미 행의 `aliases`를 읽으므로 런타임 코드는 바뀌지 않는다.
표시 이름은 영문 `label`로 남고(라틴 문자라 `display`가 그대로다) 한글은 검색어로만 붙는다.

    py -3 scripts/add_kospi200_korean_names.py            # dry-run
    py -3 scripts/add_kospi200_korean_names.py --apply
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.atomic_replace import write_bytes_atomic
from features.common.workspace import config_dir, data_dir

CONSTITUENTS = "kospi200_constituents.json"


def korean_names_by_code(corp_codes_path: Path) -> dict[str, str]:
    """DART 상장 종목의 종목코드 → 한글 정식명."""
    payload = json.loads(corp_codes_path.read_text(encoding="utf-8"))
    rows = payload.get("data") if isinstance(payload, dict) and "data" in payload else payload
    names: dict[str, str] = {}
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        code = str(row.get("stock_code") or "").strip()
        name = str(row.get("corp_name") or "").strip()
        # 상장 종목만. 비상장 법인 11만여 개는 종목코드가 없다.
        if len(code) == 6 and code.isdigit() and name:
            names.setdefault(code, name)
    return names


def enrich(payload: dict, names: dict[str, str]) -> tuple[dict, int, list[str]]:
    """행마다 한글명을 `aliases`에 넣는다. 이미 있으면 건드리지 않는다."""
    added = 0
    missing = []
    for row in payload.get("companies") or []:
        ticker = str(row.get("ticker") or "").strip()
        korean = names.get(ticker, "")
        if not korean:
            missing.append(f"{ticker} {row.get('label')}")
            continue
        aliases = [str(a) for a in (row.get("aliases") or []) if str(a).strip()]
        if korean in aliases:
            continue
        aliases.append(korean)
        row["aliases"] = aliases
        added += 1
    return payload, added, missing


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="실제로 쓴다. 기본은 dry-run.")
    parser.add_argument("--corp-codes", default=str(data_dir() / "dart-cache" / "corp_codes.json"))
    parser.add_argument("--out", default=str(config_dir() / CONSTITUENTS))
    args = parser.parse_args()

    corp_codes = Path(args.corp_codes)
    if not corp_codes.exists():
        print(f"DART 캐시가 없습니다: {corp_codes}")
        print("DART_API_KEY를 넣고 기업분석을 한 번 돌리면 생깁니다. 커밋된 결과가 이미 있으면 다시 만들 필요는 없습니다.")
        return 1

    target = Path(args.out)
    payload = json.loads(target.read_text(encoding="utf-8"))
    payload, added, missing = enrich(payload, korean_names_by_code(corp_codes))
    print(f"대상: {target}")
    print(f"한글명을 채운 종목 {added}곳 · 못 찾은 종목 {len(missing)}곳")
    for row in missing[:10]:
        print("    못 찾음:", row)
    if args.apply and added:
        write_bytes_atomic(target, (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
        print("반영했습니다. defaults/config 에도 같은 내용을 복사해야 배포에 실립니다.")
    elif not args.apply:
        print("(dry-run — 아무것도 쓰지 않았습니다. --apply로 실행합니다)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
