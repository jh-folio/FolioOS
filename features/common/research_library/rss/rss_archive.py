#!/usr/bin/env python3
"""Folio OS Evidence Intake — CLI entrypoint and orchestration.

This module is intentionally thin: it wires together the intake layers
(fetch → parser → article → relevance → normalizer → policy → writer/store)
and owns only run-level orchestration (concurrency, dedupe bookkeeping, the
``.state.json`` report). All reusable logic lives in the sibling modules.
"""
import argparse
import concurrent.futures
import datetime as dt
import os
import sys
from pathlib import Path

from features.common.research_library.rss.article import collect_article_body
from features.common.research_library.rss.collectors import (
    collect_official_items,
    load_simple_yaml,
)
from features.common.research_library.rss.feed_config import load_rss_feeds
from features.common.research_library.rss.fetch import fetch_xml
from features.common.research_library.rss.normalizer import rss_item_to_evidence
from features.common.research_library.rss.parser import KST, parse_feed
from features.common.research_library.rss.policy import (
    calculate_relevance_score,
    normalize_url,
    should_store_full_text,
)
from features.common.research_library.rss.relevance import canonical_media, should_archive_item
from features.common.research_library.rss.store import save_evidence_item
from features.common.research_library.rss.writer import (
    TS_DISPLAY_FORMAT,
    existing_file_needs_enrichment,
    load_archive_index,
    upgrade_existing_files,
    validate_manifest,
    write_markdown,
    write_markdown_to_path,
    write_state,
)

PROJECT_ROOT_MARKERS = (".git", "AGENTS.md", "CLAUDE.md")
RSS_MAX_ITEM_AGE_DAYS = int(os.environ.get("RSS_MAX_ITEM_AGE_DAYS", "14") or "14")


def find_project_root(start=None):
    start_path = Path(start or __file__).resolve()
    current = start_path if start_path.is_dir() else start_path.parent
    for candidate in (current, *current.parents):
        if any((candidate / marker).exists() for marker in PROJECT_ROOT_MARKERS):
            return candidate
    return Path(__file__).resolve().parents[4]


def configure_output_encoding():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


def fetch_feed_items(feed):
    """Fetch + parse a single feed into raw items (one collector unit of work)."""
    return feed, parse_feed(fetch_xml(feed["url"]))


def _coerce_utc_datetime(value):
    if isinstance(value, dt.datetime):
        parsed = value
    elif isinstance(value, str) and value.strip():
        try:
            parsed = dt.datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def item_within_recency_window(item, *, collected_at_utc=None, max_age_days=None):
    """Keep dated feed items recent while preserving undated items for manual review."""
    published_at = _coerce_utc_datetime((item or {}).get("published_at_utc"))
    if not published_at:
        return True
    collected_at = _coerce_utc_datetime(collected_at_utc) or dt.datetime.now(dt.timezone.utc)
    days = RSS_MAX_ITEM_AGE_DAYS if max_age_days is None else max_age_days
    if days <= 0:
        return True
    return published_at >= collected_at - dt.timedelta(days=days)


def build_manifest_item(task):
    """Enrich one accepted raw item into a manifest entry with its EvidenceItem."""
    feed, item, existing_path = task
    body = collect_article_body(item["link"], item["description"])
    media = canonical_media(feed["media"], item.get("link", ""), item.get("title", ""))
    combined = {**item, **body, "media": media, "existing_path": str(existing_path) if existing_path else ""}
    combined["normalized_url"] = normalize_url(combined.get("link", ""))
    combined["relevance_score"] = calculate_relevance_score(combined)
    combined["evidence"] = rss_item_to_evidence(item=combined, source=media, feed=feed)
    return combined


def _rel_path(path, project_root):
    return str(path.relative_to(project_root)) if path.is_relative_to(project_root) else str(path)


def _record_rejection(samples, title, url, source, score):
    if len(samples) < 20:
        samples.append({"title": (title or "")[:160], "url": url or "", "source": source or "", "relevance_score": score})


def _parse_args():
    parser = argparse.ArgumentParser(description="Folio OS Evidence Intake: collect RSS/official evidence to Markdown.")
    parser.add_argument("--archive-dir", default=None, help="Archive directory (defaults to project_root/research-inbox/rss).")
    parser.add_argument("--dry-run", action="store_true", help="Validate CLI setup without fetching or writing files.")
    parser.add_argument("--save-full-text", action="store_true", help="Save extracted full text in Markdown for local/private archives.")
    parser.add_argument("--public-mode", action="store_true", help="Do not save article full text, even if --save-full-text is provided.")
    parser.add_argument("--retry-failed", action="store_true", help="Retry existing fetch_failed archive items.")
    parser.add_argument("--retry-summary-only", action="store_true", help="Retry existing summary_only, needs_manual_save, or legacy_rss archive items.")
    parser.add_argument("--rss-config", default=None, help="RSS feed config path (defaults to config/rss_feeds.yaml).")
    parser.add_argument("--min-relevance-score", type=float, default=1.0, help="Minimum relevance score for archiving an item.")
    parser.add_argument("--collectors", default="rss", help="Comma-separated collectors to run: rss,official.")
    parser.add_argument("--evidence-config", default=None, help="Evidence source config path (defaults to config/evidence_sources.yaml).")
    parser.add_argument("--upgrade-existing", type=int, default=int(os.environ.get("RSS_UPGRADE_EXISTING_LIMIT", "50")),
                        help="Upgrade up to N existing legacy RSS markdown files to the new status-aware format.")
    parser.add_argument("--feed-workers", type=int, default=int(os.environ.get("RSS_FEED_WORKERS", "6")),
                        help="Number of RSS feeds to fetch concurrently.")
    parser.add_argument("--article-workers", type=int, default=int(os.environ.get("RSS_ARTICLE_WORKERS", "6")),
                        help="Number of article pages to enrich concurrently.")
    return parser.parse_args()


def _collect_rss(feeds, args):
    """Fetch all feeds concurrently. Returns (feed_results, fetch_errors)."""
    feed_results, fetch_errors = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.feed_workers)) as pool:
        future_map = {pool.submit(fetch_feed_items, feed): feed for feed in feeds}
        for future in concurrent.futures.as_completed(future_map):
            feed = future_map[future]
            try:
                feed_results.append(future.result())
            except Exception as exc:  # noqa: BLE001 - feed failure must not abort the run
                message = f"Feed failed ({feed['media']}): {feed['url']} - {exc}"
                fetch_errors.append(message)
                print(message, file=sys.stderr)
    return feed_results, fetch_errors


def main():
    configure_output_encoding()
    args = _parse_args()

    project_root = find_project_root()
    archive_dir = Path(args.archive_dir) if args.archive_dir else project_root / "research-inbox" / "rss"
    evidence_db = project_root / "data" / "research-index.sqlite3"
    rss_config = Path(args.rss_config) if args.rss_config else project_root / "config" / "rss_feeds.yaml"
    evidence_config = Path(args.evidence_config) if args.evidence_config else project_root / "config" / "evidence_sources.yaml"
    selected_collectors = {x.strip().lower() for x in str(args.collectors or "rss").split(",") if x.strip()}
    feeds = load_rss_feeds(rss_config) if "rss" in selected_collectors else []
    store_full_text = should_store_full_text(args.save_full_text, args.public_mode)

    if args.dry_run:
        print(
            f"Dry run OK. RSS archive folder: {archive_dir}. "
            f"Collectors: {','.join(sorted(selected_collectors))}. Feeds: {len(feeds)} from {rss_config}."
        )
        return 0

    archive_dir.mkdir(parents=True, exist_ok=True)

    existing_links, existing_filenames, link_paths = load_archive_index(archive_dir)
    upgraded = upgrade_existing_files(archive_dir, args.upgrade_existing)
    created = enriched = rejected = skipped_duplicate = skipped_existing_no_retry = 0
    status_counts: dict = {}
    rejected_samples: list = []
    manifest: list = []

    # --- RSS collector -----------------------------------------------------
    feed_results, fetch_errors = ([], [])
    if "rss" in selected_collectors:
        feed_results, fetch_errors = _collect_rss(feeds, args)

    article_tasks = []
    collected_at_utc = dt.datetime.now(dt.timezone.utc)
    for feed, items in feed_results:
        for item in items:
            score = calculate_relevance_score(item)
            item["relevance_score"] = score
            if not item_within_recency_window(item, collected_at_utc=collected_at_utc):
                rejected += 1
                _record_rejection(rejected_samples, item.get("title"), item.get("link"), feed.get("media"), score)
                continue
            if not should_archive_item(item["title"], item["description"], item["link"]) or score < args.min_relevance_score:
                rejected += 1
                _record_rejection(rejected_samples, item.get("title"), item.get("link"), feed.get("media"), score)
                continue
            item_key = normalize_url(item["link"]) or item["link"]
            existing_path = link_paths.get(item_key)
            if existing_path and not existing_file_needs_enrichment(
                existing_path, retry_failed=args.retry_failed, retry_summary_only=args.retry_summary_only
            ):
                skipped_existing_no_retry += 1
                continue
            article_tasks.append((feed, item, existing_path))

    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.article_workers)) as pool:
        futures = [pool.submit(build_manifest_item, task) for task in article_tasks]
        for future in concurrent.futures.as_completed(futures):
            try:
                manifest.append(future.result())
            except Exception as exc:  # noqa: BLE001 - one article failure must not abort the run
                print(f"Article enrichment failed: {exc}", file=sys.stderr)

    report = validate_manifest(manifest)

    for item in manifest:
        if not item.get("accepted"):
            continue
        status_counts[item["status"]] = status_counts.get(item["status"], 0) + 1
        existing_path = Path(item["existing_path"]) if item.get("existing_path") else None
        if existing_path and existing_path.exists():
            write_markdown_to_path(
                existing_path, item["media"], item["title"], item["description"], item["published_at_utc"],
                item["link"], item["status"], item.get("summary", ""), item.get("full_text", ""), item.get("error", ""),
                store_full_text=store_full_text, evidence=item.get("evidence") or None,
            )
            enriched += 1
            if item.get("evidence"):
                save_evidence_item(evidence_db, item["evidence"], _rel_path(existing_path, project_root))
            print(f"Updated: {existing_path.name} [{item['status']}]")
            continue
        item_key = item.get("normalized_url") or normalize_url(item["link"]) or item["link"]
        if item_key in existing_links:
            skipped_duplicate += 1
            continue
        path = write_markdown(
            archive_dir, item["media"], item["title"], item["description"], item["published_at_utc"],
            item["link"], item["status"], item.get("summary", ""), item.get("full_text", ""), item.get("error", ""),
            existing_filenames, normalized_url=item.get("normalized_url", ""),
            store_full_text=store_full_text, evidence=item.get("evidence") or None,
        )
        if path:
            created += 1
            existing_links.add(item_key)
            if item.get("evidence"):
                save_evidence_item(evidence_db, item["evidence"], _rel_path(path, project_root))
            print(f"Saved: {path.name} [{item['status']}]")

    # --- Official collector (stub; no fake data) ---------------------------
    official_usage: dict = {}
    if "official" in selected_collectors:
        official_items, official_usage = collect_official_items(load_simple_yaml(evidence_config))
        for evidence in official_items:
            save_evidence_item(evidence_db, evidence, evidence.get("markdown_path", ""))

    state = {
        "last_run_kst": dt.datetime.now(tz=KST).strftime(TS_DISPLAY_FORMAT),
        "created": created,
        "enriched": enriched,
        "updated": enriched,
        "skipped_duplicate": skipped_duplicate,
        "skipped_existing_no_retry": skipped_existing_no_retry,
        "rejected": rejected,
        "rejected_samples": rejected_samples,
        "manifest": {"accepted": report["accepted"], "rejected": report["rejected"], "issues": report["issues"][:20]},
        "status_counts": status_counts,
        "collector_counts": {
            "rss": sum(1 for item in manifest if item.get("accepted")),
            "official": int(official_usage.get("items") or 0) if official_usage else 0,
        },
        "fetch_errors": fetch_errors[:50],
        "source_coverage": {"configured_feeds": len(feeds), "successful_feeds": len(feed_results)},
        "official_source_counts": official_usage,
    }
    write_state(archive_dir, state)
    print(f"Done. Created {created} file(s). Updated {enriched} file(s). Upgraded {upgraded} legacy file(s). Status: {status_counts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
