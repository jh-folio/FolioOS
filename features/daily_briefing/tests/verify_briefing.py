"""실제 데이터로 브리핑 생성 경로를 검증하는 스크립트(기본은 비저장 dry-run).

실제 인덱스를 읽어 브리핑을 생성하고 메타데이터와 Markdown 섹션을 점검한다.
기본값은 `persist=False`라서 `data/briefings/`와 시장 메모리 DB를 건드리지 않는다.

    # 규칙 기반 fallback dry-run (기본, LLM/네트워크/키 불필요)
    py -3 -m features.daily_briefing.tests.verify_briefing

    # LLM 경로까지 검증(키/네트워크/비용 발생) — 여전히 저장은 안 함
    py -3 -m features.daily_briefing.tests.verify_briefing --llm

    # 실제 서버처럼 저장까지 수행(데이터/메모리 기록됨)
    py -3 -m features.daily_briefing.tests.verify_briefing --llm --persist
"""
import os
import sys
import json

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

MARKET_SECTIONS = {
    "us": [
        "# US Market Briefing", "## 0. 오늘의 미국장 성격", "## 1. 미국장 시장 흐름",
        "## 2. 미국장을 움직인 핵심 변수", "## 3. 미국장을 주도한 기업 ①",
        "## 4. 미국장을 주도한 기업 ②", "## 5. 일반 투자자 관점",
        "## 6. 다음 미국장 체크포인트", "## 오늘의 결론",
    ],
    "kr": [
        "# Korea Market Briefing", "## 0. 오늘의 한국장 성격", "## 1. 한국장 시장 흐름",
        "## 2. 한국장을 움직인 핵심 변수", "## 3. 한국장을 주도한 기업 ①",
        "## 4. 한국장을 주도한 기업 ②", "## 5. 일반 투자자 관점",
        "## 6. 다음 한국장 체크포인트", "## 오늘의 결론",
    ],
}


def main(argv):
    use_llm = "--llm" in argv
    persist = "--persist" in argv
    market_scope = next((a.split("=", 1)[1] for a in argv if a.startswith("--scope=")), "both")
    date = next((a for a in argv if a.count("-") == 2 and a[0].isdigit()), None)

    import app
    from features.common.utils import kst_date
    date = date or kst_date()

    bdir = os.path.join(_ROOT, "data", "briefings")
    before = set(os.listdir(bdir)) if os.path.isdir(bdir) else set()

    briefing = app.build_briefing(
        date=date,
        llm_override=(None if use_llm else False),
        persist=persist,
        market_scope=market_scope,
    )

    after = set(os.listdir(bdir)) if os.path.isdir(bdir) else set()
    new_files = sorted(after - before)

    gen = briefing.get("generation", {})
    stats = briefing.get("stats", {})
    drivers = briefing.get("marketDrivers", [])
    md = briefing.get("markdown", "")

    print(f"=== 브리핑 검증 (date={date}, scope={market_scope}, llm={'on' if use_llm else 'off'}, persist={persist}) ===")
    print(f"generation.mode        : {gen.get('mode')}")
    print(f"generation.status      : {gen.get('status')}")
    print(f"generation.sourceCount : {gen.get('sourceCount')}")
    print(f"stats.documents        : {stats.get('documents')}")
    print(f"stats.driverCount      : {stats.get('driverCount')}")
    print(f"stats.topDrivers       : {stats.get('topDrivers')}")
    print(f"stats.sourceCount      : {stats.get('sourceCount')}")
    print(f"stats.issueCount       : {stats.get('issueCount')}")
    print(f"marketDrivers          : {len(drivers)}개")
    for d in drivers:
        print(f"  - {d.get('driver')} | score={d.get('score')} | docs={d.get('docCount')} | markets={d.get('markets')}")

    print("\n--- Markdown 섹션 점검 ---")
    scopes = ["us", "kr"] if market_scope == "both" else [market_scope]
    sections = [section for scope in scopes for section in MARKET_SECTIONS.get(scope, [])]
    missing = [h for h in sections if h not in md]
    for h in sections:
        print(f"  [{'O' if h in md else 'X'}] {h}")

    from collections import Counter
    source_counts = Counter(source.get("source", "Unknown") for source in briefing.get("sources", []))
    print("\n--- 출처 분포 ---")
    print(f"  {dict(source_counts)}")

    print("\n--- 데이터 오염 점검 ---")
    print(f"  새로 쓰인 브리핑 파일: {new_files or '없음'}")

    ok = not missing
    print(f"\n{'VERIFY_OK' if ok else 'VERIFY_FAIL (누락 섹션: ' + ', '.join(missing) + ')'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
