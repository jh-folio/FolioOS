from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path


def _write(path: Path, report_id: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"id": report_id, "date": "2026-07-17"}), encoding="utf-8")


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--attempt-dir", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = _arguments()
    source_root = args.source_root.resolve()
    attempt_dir = args.attempt_dir.resolve()
    attempt_dir.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(source_root))

    from features.agent_mode.report_delete import DeleteRequest, execute_report_delete, recover_report_deletes
    from features.company_analysis import service as company_service
    from features.daily_briefing import archive as briefing_archive
    from features.daily_briefing import service as briefing_service
    from features.topic_report import service as topic_service

    temp_root = attempt_dir / "temp-data"
    shutil.rmtree(temp_root, ignore_errors=True)
    temp_root.mkdir()
    original_briefings = briefing_service.BRIEFINGS_DIR
    original_archive = briefing_archive._ARCHIVE_INDEX
    original_company = company_service.ANALYSIS_REPORTS_DIR
    original_topic = topic_service.REPORTS_DIR
    results: dict[str, bool] = {}
    try:
        fault_root = temp_root / "fault"
        _write(fault_root / "restart.json", "restart")
        interrupted = False
        try:
            execute_report_delete(DeleteRequest(
                root=fault_root,
                identity="company:restart",
                primary_names=("restart.json",),
                target_names=("restart.json",),
                fault_stage="renamed",
            ))
        except RuntimeError:
            interrupted = True
        results["restartRecovered"] = interrupted and recover_report_deletes(fault_root) == ("company:restart",)

        forged_root = temp_root / "forged"
        _write(forged_root / "unrelated.json", "unrelated")
        forged_identity = "company:forged"
        forged_digest = hashlib.sha256(forged_identity.encode("utf-8")).hexdigest()[:16]
        forged_journal = forged_root / f".report-delete-{forged_digest}.json"
        forged_journal.write_text(json.dumps({
            "identity": forged_identity,
            "stage": "deleting",
            "entries": [{
                "original": "unrelated.json",
                "temporary": f".report-delete-{forged_digest}.0.deleting",
            }],
        }), encoding="utf-8")
        rejected = recover_report_deletes(forged_root) == ()
        results["forgedJournalRejected"] = (
            rejected
            and (forged_root / "unrelated.json").exists()
            and forged_journal.exists()
        )

        briefing_root = temp_root / "briefings"
        for name in (
            "2026-07-17.us.json",
            "2026-07-17.kr.json",
            "2026-07-17.us.visuals.json",
            "2026-07-17.link.json",
            "2026-07-170.us.json",
        ):
            _write(briefing_root / name, name)
        index = briefing_archive.BriefingArchiveIndex(briefing_root, ttl_seconds=3600)
        index.query()
        briefing_service.BRIEFINGS_DIR = briefing_root
        briefing_archive._ARCHIVE_INDEX = index
        us_result = briefing_service.delete_briefing("2026-07-17", market="us")
        results["scopedUsDeleted"] = bool(us_result["deleted"])
        results["remainingKrPreserved"] = (briefing_root / "2026-07-17.kr.json").exists()
        results["staleLinkRemoved"] = not (briefing_root / "2026-07-17.link.json").exists()
        results["cacheFresh"] = index.query()["total"] == 1
        briefing_service.delete_briefing("2026-07-17", market="kr")
        results["exactCollisionPreserved"] = (briefing_root / "2026-07-170.us.json").exists()

        company_root = temp_root / "company-analysis"
        _write(company_root / "alpha.json", "alpha")
        _write(company_root / "alpha-extra.json", "alpha-extra")
        company_service.ANALYSIS_REPORTS_DIR = company_root
        company_service.delete_analysis_report("alpha")
        results["exactCollisionPreserved"] &= (company_root / "alpha-extra.json").exists()

        topic_root = temp_root / "topic-reports"
        _write(topic_root / "000_deadbeef00.json", "deadbeef00")
        _write(topic_root / "2026-07-17_topic_deadbeef.json", "deadbeef")
        topic_service.REPORTS_DIR = topic_root
        topic_service.delete_topic_report("deadbeef")
        results["exactCollisionPreserved"] &= (topic_root / "000_deadbeef00.json").exists()
    finally:
        briefing_service.BRIEFINGS_DIR = original_briefings
        briefing_archive._ARCHIVE_INDEX = original_archive
        company_service.ANALYSIS_REPORTS_DIR = original_company
        topic_service.REPORTS_DIR = original_topic
        shutil.rmtree(temp_root, ignore_errors=True)

    results["cleanup"] = not temp_root.exists()
    (attempt_dir / "result.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    passed = all(results.values())
    print(json.dumps(results, ensure_ascii=False, sort_keys=True))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
