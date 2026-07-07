"""Scope-aware issue clustering and publisher-normalized briefing selection."""

from __future__ import annotations

import hashlib
import re
from collections import Counter, defaultdict

from features.common.market_calendar import doc_analysis_priority, infer_doc_market
from features.common.research_library.indexing.research_index import cosine, embed_text
from features.common.utils import normalize
from features.daily_briefing.selection import briefing_doc_score, market_connection_score


FOREIGN_CORE = frozenset({"Reuters", "WSJ", "Financial Times", "Bloomberg"})
FOREIGN_SUPPORT = frozenset({"CNBC", "MarketWatch", "Barron's", "Dow Jones"})
DOMESTIC_PUBLISHERS = frozenset({"연합인포맥스", "한국경제", "연합뉴스", "매일경제"})

SOURCE_PROFILES = {
    "Reuters": {"authority": 10.0, "region": "foreign", "us": 10.0, "kr": 7.0},
    "WSJ": {"authority": 10.0, "region": "foreign", "us": 10.0, "kr": 6.5},
    "Financial Times": {"authority": 10.0, "region": "foreign", "us": 9.5, "kr": 7.0},
    "Bloomberg": {"authority": 10.0, "region": "foreign", "us": 9.5, "kr": 7.0},
    "Dow Jones": {"authority": 9.0, "region": "foreign", "us": 9.0, "kr": 5.5},
    "CNBC": {"authority": 8.0, "region": "foreign", "us": 8.0, "kr": 5.0},
    "MarketWatch": {"authority": 7.0, "region": "foreign", "us": 7.0, "kr": 4.5},
    "Barron's": {"authority": 8.0, "region": "foreign", "us": 8.0, "kr": 4.5},
    "연합인포맥스": {"authority": 8.5, "region": "domestic", "us": 3.2, "kr": 10.0},
    "연합뉴스": {"authority": 8.5, "region": "domestic", "us": 2.8, "kr": 8.5},
    "한국경제": {"authority": 7.5, "region": "domestic", "us": 2.7, "kr": 8.0},
    "매일경제": {"authority": 7.5, "region": "domestic", "us": 2.7, "kr": 8.0},
}

CONCEPT_ALIASES = {
    "fed": ("fed", "federal reserve", "연준"),
    "rates": ("rate", "rates", "yield", "treasury", "bond", "금리", "국채", "채권", "점도표"),
    "nvidia": ("nvidia", "엔비디아"),
    "ai_chips": ("ai chip", "accelerator", "gpu", "data-center spending", "forecast", "outlook", "ai 수요", "수요 지속", "반도체"),
    "oil": ("oil", "crude", "유가", "원유"),
    "middle_east": ("middle east", "regional conflict", "supply disruption", "supply risk", "중동", "공급 우려"),
    "korea_chips": ("korea chip", "korean memory", "한국 반도체", "반도체 수출", "메모리 수출"),
    "exports": ("export", "shipment", "수출", "무역수지"),
    "kr_fx": ("won", "원화", "원달러", "원·달러", "환율"),
    "foreign_flow": ("foreign selling", "foreign buying", "외국인", "순매도", "순매수", "선물 매도"),
    "banks": ("bank", "banks", "lender", "은행", "금융주"),
    "bank_capital": ("bank capital", "capital requirement", "capital plan", "자본규제", "은행 규제"),
    "china_property": ("china", "beijing", "중국"),
    "property_support": ("property support", "housing market", "stimulus", "부동산 부양", "경기부양"),
    "apple": ("apple", "애플"),
    "earnings": ("earnings", "results", "guidance", "sales", "services growth", "실적", "가이던스", "매출"),
    "korea_auto": ("korean automaker", "korean carmaker", "한국 자동차", "현대차", "자동차 업계", "자동차"),
    "tariff": ("tariff", "trade barrier", "관세"),
    "biotech": ("biotech", "drugmaker", "바이오", "신약"),
    "clinical_trial": ("trial", "study", "endpoint", "임상", "평가지표"),
}

EVENT_CONCEPTS = frozenset({
    "rates", "ai_chips", "middle_east", "exports", "foreign_flow", "bank_capital",
    "property_support", "earnings", "tariff", "clinical_trial",
})


def _text(doc):
    return normalize(" ".join([
        str(doc.get("title") or ""),
        str(doc.get("summary") or ""),
        str(doc.get("content") or "")[:1200],
    ])).lower()


def _doc_key(doc):
    return str(doc.get("url") or doc.get("path") or doc.get("id") or doc.get("title") or "")


def body_availability(doc):
    status = str(doc.get("collectionStatus") or doc.get("collection_status") or "").lower()
    words = int(doc.get("wordCount") or 0)
    if status == "full_text" and words >= 120:
        return "full"
    if status in {"summary_only", "full_text"} or words >= 60:
        return "summary_only"
    return "headline_only"


def canonical_publisher(doc):
    source = str(doc.get("source") or "Unknown")
    text = _text(doc)
    if source != "Reuters" and re.search(r"\(로이터\)|\breuters?\b|로이터통신", text, re.I):
        return "Reuters"
    if source != "연합뉴스" and re.search(r"\(연합뉴스\)|연합뉴스 제공|yna\.co\.kr", text, re.I):
        return "연합뉴스"
    return source


def source_profile(doc, target_market):
    publisher = canonical_publisher(doc)
    profile = SOURCE_PROFILES.get(publisher, {})
    fallback = min(float(doc.get("sourceWeight") or 5), 10.0)
    authority = float(profile.get("authority", fallback))
    expertise = float(profile.get(str(target_market or "").lower(), fallback))
    availability = body_availability(doc)
    content_gate = {"full": 1.0, "summary_only": 0.78, "headline_only": 0.38}[availability]
    return {
        "publisher": publisher,
        "authority": authority,
        "marketExpertise": expertise,
        "region": profile.get("region", "unknown"),
        "coreForeign": publisher in FOREIGN_CORE,
        "bodyAvailability": availability,
        "contentGate": content_gate,
    }


def concepts_for_doc(doc):
    text = _text(doc)
    concepts = {name for name, aliases in CONCEPT_ALIASES.items() if any(alias in text for alias in aliases)}
    for company in doc.get("companies", []) or []:
        ticker = str(company.get("ticker") or "").upper().strip()
        name = normalize(str(company.get("name") or "")).lower()
        if ticker:
            concepts.add(f"ticker:{ticker}")
        if name:
            concepts.add(f"company:{name}")
    return concepts


def _event_date(doc):
    return str(doc.get("marketSessionDate") or doc.get("date") or "unknown")[:10]


def _tokens(text):
    return {
        token for token in re.findall(r"[a-z0-9가-힣]{2,}", normalize(text).lower())
        if token not in {"the", "and", "after", "with", "from", "대한", "관련", "전망", "시장"}
    }


def _similarity(a, b):
    a_concepts = concepts_for_doc(a)
    b_concepts = concepts_for_doc(b)
    shared = a_concepts & b_concepts
    shared_events = shared & EVENT_CONCEPTS
    shared_subjects = shared - EVENT_CONCEPTS
    if _event_date(a) != _event_date(b) and "unknown" not in {_event_date(a), _event_date(b)}:
        return 0.0
    if shared_events and shared_subjects:
        return min(0.98, 0.72 + 0.08 * len(shared))
    at = _tokens(a.get("title") or "")
    bt = _tokens(b.get("title") or "")
    jaccard = len(at & bt) / max(1, len(at | bt))
    embedding = cosine(embed_text(" ".join(sorted(at))), embed_text(" ".join(sorted(bt))))
    if jaccard >= 0.62 and embedding >= 0.68:
        return min(0.9, (jaccard + embedding) / 2)
    return 0.0


def cluster_documents(docs):
    docs = [
        {**doc, "bodyAvailability": body_availability(doc)}
        for doc in docs or [] if isinstance(doc, dict)
    ]
    parent = list(range(len(docs)))
    confidence = defaultdict(list)

    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left, right, score):
        lroot, rroot = find(left), find(right)
        if lroot == rroot:
            return
        parent[rroot] = lroot
        confidence[lroot].append(score)
        confidence[lroot].extend(confidence.pop(rroot, []))

    for left in range(len(docs)):
        for right in range(left + 1, len(docs)):
            score = _similarity(docs[left], docs[right])
            if score >= 0.72:
                union(left, right, score)

    grouped = defaultdict(list)
    for index, doc in enumerate(docs):
        grouped[find(index)].append(doc)

    clusters = []
    for root, members in grouped.items():
        keys = sorted(_doc_key(doc) for doc in members)
        issue_id = hashlib.sha1("|".join(keys).encode("utf-8")).hexdigest()[:16]
        scores = confidence.get(find(root), [])
        cluster_confidence = sum(scores) / len(scores) if scores else 1.0
        clusters.append({
            "issueId": issue_id,
            "clusterConfidence": round(cluster_confidence, 4),
            "docs": members,
        })
    return clusters


def _priority_score(doc, target_market, market_windows):
    profile = source_profile(doc, target_market)
    session = {"primary": 10.0, "secondary": 7.0, "off_session_news": 6.0, "background": 3.0}.get(
        doc_analysis_priority(doc, market_windows), 3.0
    )
    return (
        briefing_doc_score(doc, market_windows)
        + profile["authority"] * 2.0
        + profile["marketExpertise"] * 2.0
        + session
    ) * profile["contentGate"]


def evaluate_issue_cluster(cluster, target_market, market_windows, publisher_issue_shares=None):
    docs = cluster.get("docs", [])
    by_publisher = defaultdict(list)
    for doc in docs:
        by_publisher[canonical_publisher(doc)].append(doc)
    representatives = []
    for publisher_docs in by_publisher.values():
        representatives.append(max(publisher_docs, key=lambda d: _priority_score(d, target_market, market_windows)))
    representatives.sort(key=lambda d: _priority_score(d, target_market, market_windows), reverse=True)

    profiles = [source_profile(doc, target_market) for doc in representatives]
    publisher_count = len(profiles)
    article_counts = Counter(canonical_publisher(doc) for doc in docs)
    total_articles = max(1, sum(article_counts.values()))
    concentration = sum((count / total_articles) ** 2 for count in article_counts.values())
    authority_sum = sum(profile["authority"] for profile in profiles)
    breadth = min(1.0, authority_sum / 35.0)
    expertise = sum(profile["marketExpertise"] for profile in profiles) / max(1, publisher_count)
    foreign_core_count = sum(1 for profile in profiles if profile["coreForeign"])
    domestic_count = sum(1 for profile in profiles if profile["region"] == "domestic")
    market_impact_raw = max((market_connection_score(doc) for doc in docs), default=0.0)
    impact_status = "measured" if market_impact_raw > 0 else "unavailable"
    market_impact_score = min(100.0, market_impact_raw * 2.5) if market_impact_raw > 0 else None
    cross_region = "domestic_only"
    cross_bonus = 0.0
    if str(target_market).upper() == "KR" and foreign_core_count >= 2:
        cross_region, cross_bonus = "cross_confirmed", 10.0
    elif str(target_market).upper() == "KR" and foreign_core_count >= 1 and market_impact_score is not None:
        cross_region, cross_bonus = "market_confirmed_international", 7.0
    elif foreign_core_count and domestic_count:
        cross_region, cross_bonus = "cross_region_covered", 4.0
    elif foreign_core_count:
        cross_region = "foreign_only"

    bias_penalty = 0.0
    for publisher in by_publisher:
        share = float((publisher_issue_shares or {}).get(publisher, 0.0) or 0.0)
        bias_penalty += max(0.0, share - 0.25) * 8.0
    syndication_count = sum(max(0, len(rows) - 1) for rows in by_publisher.values())
    content_gate = max((profile["contentGate"] for profile in profiles), default=0.38)
    impact_component = (market_impact_score or 0.0) * 0.24 if market_impact_score is not None else 0.0
    base_without_impact = (
        breadth * 30.0
        + min(publisher_count, 5) / 5.0 * 16.0
        + expertise * 1.4
        + cross_bonus
        - concentration * 10.0
        - min(syndication_count, 5) * 1.5
        - bias_penalty
    )
    issue_score = impact_component + base_without_impact
    if content_gate < 0.5 and market_impact_score is None:
        issue_score *= 0.55

    market = str(target_market).upper()
    warnings = []
    if impact_status == "unavailable":
        warnings.append("market impact data unavailable; ranked by breadth and authority")
    return {
        "issueId": cluster.get("issueId"),
        "market": market,
        "publisherCount": publisher_count,
        "weightedPublisherBreadth": round(breadth, 4),
        "foreignCorePublisherCount": foreign_core_count,
        "domesticPublisherCount": domestic_count,
        "sourceConcentration": round(concentration, 4),
        "clusterConfidence": cluster.get("clusterConfidence", 1.0),
        "syndicatedCopies": syndication_count,
        "bodyAvailabilityMix": dict(Counter(profile["bodyAvailability"] for profile in profiles)),
        "crossRegionStatus": cross_region,
        "internationalSalience": round(cross_bonus, 1),
        "marketImpactStatus": impact_status,
        "marketImpactScore": round(market_impact_score, 1) if market_impact_score is not None else None,
        "issueScore": round(max(0.0, issue_score), 2),
        "representativeDocs": representatives,
        "docs": docs,
        "warnings": warnings,
    }


def publisher_issue_concentration(docs):
    """Estimate each publisher's dominant-topic share in the available window."""
    totals = Counter()
    concept_counts = defaultdict(Counter)
    for doc in docs or []:
        publisher = canonical_publisher(doc)
        concepts = concepts_for_doc(doc) & EVENT_CONCEPTS
        if not concepts:
            continue
        totals[publisher] += 1
        for concept in concepts:
            concept_counts[publisher][concept] += 1
    result = {}
    for publisher, total in totals.items():
        # Do not infer a stable editorial tendency from a tiny sample.
        result[publisher] = max(concept_counts[publisher].values()) / total if total >= 5 else 0.0
    return result


def build_issue_coverage(docs, target_market, market_windows, limit=10, publisher_issue_shares=None):
    scoped = [doc for doc in docs or [] if infer_doc_market(doc) in {str(target_market).upper(), "BOTH", "GLOBAL"}]
    if publisher_issue_shares is None:
        publisher_issue_shares = publisher_issue_concentration(scoped)
    evaluated = [
        evaluate_issue_cluster(cluster, target_market, market_windows, publisher_issue_shares)
        for cluster in cluster_documents(scoped)
    ]
    evaluated.sort(key=lambda issue: (issue["issueScore"], issue["publisherCount"]), reverse=True)
    return evaluated[:limit]


def documents_for_scope(docs, market_scope):
    scope = str(market_scope or "both").lower()
    if scope == "both":
        return list(docs or [])
    target = scope.upper()
    return [doc for doc in docs or [] if infer_doc_market(doc) in {target, "BOTH", "GLOBAL"}]


def session_modes_from_windows(market_windows):
    mode = str((market_windows or {}).get("analysisMode") or "")
    if mode == "weekday_kr_open":
        return {"us": "us_close", "kr": "kr_intraday"}
    if mode == "us_holiday_kr_open":
        return {"us": "us_holiday", "kr": "kr_intraday"}
    if mode == "kr_holiday":
        return {"us": "us_close", "kr": "kr_holiday"}
    if mode == "both_holiday":
        return {"us": "us_holiday", "kr": "kr_holiday"}
    if mode == "weekend":
        return {"us": "us_off_session", "kr": "kr_off_session"}
    return {"us": "us_close", "kr": "kr_off_session"}


def derive_link_status(us_issues, kr_issues):
    us_concepts = set()
    kr_concepts = set()
    for issue in us_issues or []:
        for doc in issue.get("docs", []):
            us_concepts.update(concepts_for_doc(doc))
    for issue in kr_issues or []:
        for doc in issue.get("docs", []):
            kr_concepts.update(concepts_for_doc(doc))
    shared = us_concepts & kr_concepts
    if not us_issues or not kr_issues:
        return "insufficient_evidence"
    if len(shared) >= 2:
        return "connected"
    if shared:
        return "selectively_connected"
    return "independent"


def select_diverse_documents(issues, market_windows, limit=24, per_publisher=4, minimum_publishers=5):
    candidates = []
    seen = set()
    for issue in issues or []:
        for doc in issue.get("representativeDocs", [])[:3]:
            key = _doc_key(doc)
            if key and key not in seen:
                seen.add(key)
                candidates.append((issue.get("issueScore", 0.0), doc))
    candidates.sort(key=lambda item: (item[0], briefing_doc_score(item[1], market_windows)), reverse=True)
    selected, deferred = [], []
    counts = Counter()
    for _, doc in candidates:
        publisher = canonical_publisher(doc)
        if counts[publisher] >= per_publisher:
            deferred.append(doc)
            continue
        selected.append(doc)
        counts[publisher] += 1
        if len(selected) >= limit:
            break
    relaxed = False
    if len(selected) < min(limit, len(candidates)):
        relaxed = True
        for doc in deferred:
            if len(selected) >= limit:
                break
            selected.append(doc)
    warnings = []
    if relaxed:
        warnings.append("publisher soft cap relaxed because evidence lanes lacked enough documents")
    if len(counts) < minimum_publishers:
        warnings.append(f"source diversity below target: {len(counts)}/{minimum_publishers} publishers")
    return selected, warnings


def diversify_ranked_documents(docs, limit=24, per_publisher=4, minimum_publishers=5):
    """Apply a soft publisher cap to an already relevance-ranked document list."""
    selected, deferred, seen = [], [], set()
    counts = Counter()
    for doc in docs or []:
        key = _doc_key(doc)
        if not key or key in seen:
            continue
        seen.add(key)
        publisher = canonical_publisher(doc)
        if counts[publisher] >= per_publisher:
            deferred.append(doc)
            continue
        selected.append(doc)
        counts[publisher] += 1
        if len(selected) >= limit:
            break
    relaxed = False
    if len(selected) < min(limit, len(seen)):
        relaxed = True
        for doc in deferred:
            if len(selected) >= limit:
                break
            selected.append(doc)
    warnings = []
    if relaxed:
        warnings.append("publisher soft cap relaxed because the selected evidence pool was too small")
    final_publishers = {canonical_publisher(doc) for doc in selected}
    if len(final_publishers) < minimum_publishers:
        warnings.append(f"source diversity below target: {len(final_publishers)}/{minimum_publishers} publishers")
    return selected, warnings


def public_issue_coverage(issues):
    """Remove article payloads before persisting issue diagnostics."""
    fields = (
        "issueId", "market", "publisherCount", "weightedPublisherBreadth",
        "foreignCorePublisherCount", "domesticPublisherCount", "sourceConcentration",
        "clusterConfidence", "syndicatedCopies", "bodyAvailabilityMix",
        "crossRegionStatus", "marketImpactStatus", "marketImpactScore", "issueScore", "warnings",
        "internationalSalience",
    )
    return [{field: issue.get(field) for field in fields} for issue in issues or []]


def pairwise_cluster_metrics(items, predicted_cluster_by_id):
    tp = fp = fn = 0
    for left in range(len(items)):
        for right in range(left + 1, len(items)):
            expected_same = items[left].get("expectedCluster") == items[right].get("expectedCluster")
            predicted_same = predicted_cluster_by_id.get(items[left].get("id")) == predicted_cluster_by_id.get(items[right].get("id"))
            if predicted_same and expected_same:
                tp += 1
            elif predicted_same and not expected_same:
                fp += 1
            elif expected_same and not predicted_same:
                fn += 1
    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    return {"precision": round(precision, 4), "recall": round(recall, 4), "tp": tp, "fp": fp, "fn": fn}
