"""Step 1 P0-P4 tests for scope and issue selection."""

import json
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_calendar import briefing_market_windows, doc_market_bucket, infer_doc_market, infer_doc_markets
from features.daily_briefing.issue_selection import (
    build_issue_coverage,
    canonical_publisher,
    cluster_documents,
    pairwise_cluster_metrics,
    select_diverse_documents,
    source_profile,
)


FIXTURES = Path(__file__).resolve().parent / "fixtures"
WINDOWS = briefing_market_windows("2026-06-10")


def _doc(doc_id, title, source, market="", **extra):
    doc = {
        "id": doc_id,
        "title": title,
        "summary": extra.pop("summary", title),
        "content": extra.pop("content", title * 8),
        "source": source,
        "sourceWeight": 9,
        "date": extra.pop("date", "2026-06-10"),
        "marketSessionDate": extra.pop("marketSessionDate", "2026-06-10"),
        "path": f"fixture/{doc_id}.md",
        "url": f"https://example.test/{doc_id}",
        "companies": ([{"name": "Fixture", "ticker": doc_id.upper(), "market": market}] if market else []),
        "sectors": extra.pop("sectors", []),
        "impactTags": extra.pop("impactTags", []),
        "marketRelevance": extra.pop("marketRelevance", 60),
        "wordCount": extra.pop("wordCount", 160),
        "collectionStatus": extra.pop("collectionStatus", "summary_only"),
    }
    doc.update(extra)
    return doc


def test_market_inference_uses_content_not_korean_publisher_name():
    wall_street = _doc(
        "us-close",
        "뉴욕증시 나스닥 하락, 연준 금리 경로 주목",
        "연합인포맥스",
        market="US",
        marketSessionDate=WINDOWS["usRegularSessionDate"],
    )
    assert infer_doc_market(wall_street) == "US"
    assert infer_doc_markets(wall_street) == ["US"]
    assert doc_market_bucket(wall_street, WINDOWS) == "US 전일 정규장"

    global_story = _doc("global", "국제 원자재 공급망 뉴스", "한국경제")
    global_story["companies"] = []
    assert infer_doc_market(global_story) == "GLOBAL"
    assert infer_doc_markets(global_story) == ["GLOBAL"]
    assert doc_market_bucket(global_story, WINDOWS) != "KR 당일 개장/장중"


def test_market_tags_allow_us_kr_global_overlap_and_unknown():
    cross_market = _doc(
        "cross",
        "Nasdaq rally lifts Korea chip exporters as KOSPI opens higher",
        "Reuters",
        market="",
        companies=[],
        summary="US AI chip gains and Korean semiconductor exporters both matter.",
        content="Nasdaq and KOSPI react to global semiconductor supply chain and dollar moves.",
    )
    assert infer_doc_markets(cross_market) == ["US", "KR", "GLOBAL"]
    assert infer_doc_market(cross_market) == "BOTH"

    unknown = _doc("unknown", "Thin headline", "Unknown", market="", companies=[], summary="", content="")
    assert infer_doc_markets(unknown) == ["UNKNOWN"]


def test_source_profiles_are_market_specific_and_content_gated():
    reuters = _doc("r", "Nasdaq closes higher", "Reuters", market="US")
    domestic = _doc("k", "뉴욕증시 마감", "한국경제", market="US")
    assert source_profile(reuters, "US")["marketExpertise"] > source_profile(domestic, "US")["marketExpertise"]

    kr_specialist = _doc("kr", "코스피 외국인 순매수", "연합인포맥스", market="KR")
    assert source_profile(kr_specialist, "KR")["marketExpertise"] == 10.0

    headline = _doc("h", "Thin headline", "WSJ", market="US", wordCount=10, collectionStatus="summary_only")
    assert source_profile(headline, "US")["bodyAvailability"] == "summary_only"
    assert source_profile(headline, "US")["contentGate"] < 1.0


def test_us_issue_representative_prefers_foreign_core_source_over_domestic_source():
    common = {
        "market": "US",
        "marketSessionDate": WINDOWS["usRegularSessionDate"],
        "summary": "Federal Reserve holds rates and Nasdaq rises",
        "content": "Federal Reserve holds rates and Nasdaq rises after the decision " * 12,
        "impactTags": ["금리"],
        "wordCount": 160,
        "collectionStatus": "summary_only",
    }
    reuters = _doc("foreign", "Federal Reserve holds rates and Nasdaq rises", "Reuters", **common)
    yonhap = _doc("domestic", "Federal Reserve holds rates and Nasdaq rises", "연합뉴스", **common)
    issue = build_issue_coverage([yonhap, reuters], "US", WINDOWS)[0]
    assert [doc["source"] for doc in issue["representativeDocs"]] == ["Reuters", "연합뉴스"]
    assert issue["foreignCorePublisherCount"] == 1


def test_syndicated_copy_is_attributed_to_wire_publisher():
    copied = _doc("copy", "연준 금리 동결", "Portal News", content="(로이터) 연준이 금리를 동결했다")
    assert canonical_publisher(copied) == "Reuters"


def test_cluster_fixture_passes_conservative_merge_gate():
    items = json.loads((FIXTURES / "issue_cluster_labels.json").read_text(encoding="utf-8"))
    docs = [
        {
            **item,
            "summary": item["title"],
            "content": item["title"] * 3,
            "date": "2026-06-19",
            "path": f"fixture/{item['id']}.md",
            "url": "",
            "companies": [],
            "sectors": [],
            "impactTags": [],
            "wordCount": 80,
            "source": item["publisher"],
        }
        for item in items
    ]
    predicted = {}
    for cluster in cluster_documents(docs):
        for doc in cluster["docs"]:
            predicted[doc["id"]] = cluster["issueId"]
    metrics = pairwise_cluster_metrics(items, predicted)
    assert metrics["precision"] >= 0.95, metrics
    assert metrics["recall"] >= 0.85, metrics


def test_one_publisher_has_one_vote_per_issue_and_syndication_does_not_expand_breadth():
    docs = [
        _doc("r1", "Fed holds rates after meeting", "Reuters", market="US", impactTags=["금리"]),
        _doc("r2", "Federal Reserve keeps rates unchanged", "Reuters", market="US", impactTags=["금리"]),
        _doc("copy", "Fed rate decision", "Portal News", market="US", content="Reuters reported the Fed rate decision", impactTags=["금리"]),
        _doc("w1", "Fed pause shifts bond market", "WSJ", market="US", impactTags=["금리"]),
    ]
    issues = build_issue_coverage(docs, "US", WINDOWS)
    top = max(issues, key=lambda issue: issue["publisherCount"])
    assert top["publisherCount"] == 2
    assert {doc["source"] for doc in top["representativeDocs"]} <= {"Reuters", "WSJ"}
    assert top["syndicatedCopies"] >= 1


def test_market_impact_unavailable_is_explicit_not_zero():
    doc = _doc("quiet", "Apple earnings report", "Reuters", market="US")
    doc["impactTags"] = []
    doc["sectors"] = []
    doc["marketRelevance"] = 20
    doc["title"] = "Apple earnings report"
    doc["summary"] = "Apple earnings report"
    issue = build_issue_coverage([doc], "US", WINDOWS)[0]
    assert issue["marketImpactStatus"] == "unavailable"
    assert issue["marketImpactScore"] is None
    assert issue["issueScore"] > 0
    assert issue["warnings"]


def test_korea_foreign_coverage_gets_international_salience():
    docs = [
        _doc("kr1", "한국 반도체 수출 증가", "연합뉴스", market="KR", impactTags=["수급"]),
        _doc("kr2", "Korea chip exports accelerate", "Reuters", market="KR", impactTags=["수급"]),
        _doc("kr3", "Korean memory shipments rise", "Financial Times", market="KR", impactTags=["수급"]),
    ]
    issue = build_issue_coverage(docs, "KR", WINDOWS)[0]
    assert issue["foreignCorePublisherCount"] == 2
    assert issue["crossRegionStatus"] == "cross_confirmed"
    assert issue["internationalSalience"] > 0


def test_diverse_selection_applies_soft_publisher_cap():
    docs = []
    for index in range(8):
        docs.append(_doc(f"r{index}", f"Reuters distinct event {index}", "Reuters", market="US"))
    for publisher, prefix in [("WSJ", "w"), ("Bloomberg", "b"), ("Financial Times", "f"), ("CNBC", "c")]:
        docs.append(_doc(prefix, f"{publisher} distinct market event", publisher, market="US"))
    issues = build_issue_coverage(docs, "US", WINDOWS, limit=20)
    selected, warnings = select_diverse_documents(issues, WINDOWS, limit=8, per_publisher=3, minimum_publishers=4)
    counts = Counter(canonical_publisher(doc) for doc in selected)
    assert counts["Reuters"] <= 3
    assert len(counts) >= 4
    assert not any("below target" in warning for warning in warnings)


def _run_all():
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"\n{len(tests)}/{len(tests)} tests passed")
    return True


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
