from __future__ import annotations

from copy import deepcopy
from pathlib import Path

from features.common.canonical_identity import DATE_PATTERN, ReportKind
from features.common.canonical_report_types import WriteKind
from features.common.job_json_producer_types import BriefingJobRequest
from features.common.job_json_schema import (
    ArtifactSpec,
    CanonicalArtifactSpec,
    JobArtifactValidationError,
    JsonArtifactSpec,
)
from features.common.shared_jobs_schema import StorageKind


def briefing_specs(data_root: Path, request: BriefingJobRequest) -> list[ArtifactSpec]:
    if DATE_PATTERN.fullmatch(request.date) is None:
        raise JobArtifactValidationError("briefing date is invalid")
    if not request.scopes or len(request.scopes) != len(set(request.scopes)):
        raise JobArtifactValidationError("briefing scopes must be unique and nonempty")
    if set(request.reports) != set(request.scopes):
        raise JobArtifactValidationError("briefing reports must exactly match requested scopes")
    if not set(request.visuals).issubset(request.scopes):
        raise JobArtifactValidationError("briefing visuals must belong to requested scopes")
    both = set(request.scopes) == {"us", "kr"}
    if both != (request.link is not None):
        raise JobArtifactValidationError("both-scope briefing requires exactly one link")
    specs: list[ArtifactSpec] = []
    for scope in request.scopes:
        report = deepcopy(request.reports[scope])
        report["date"] = request.date
        report["marketScope"] = scope
        specs.append(
            CanonicalArtifactSpec(
                artifact_type="briefing_report",
                artifact_id=f"{request.date}.{scope}",
                report_kind=ReportKind.BRIEFING,
                exact_path=data_root / "briefings" / f"{request.date}.{scope}.json",
                write_kind=WriteKind.CANONICAL,
                candidate=report,
            )
        )
        visual = deepcopy(request.visuals.get(scope, {}))
        snapshots = visual.get("snapshots")
        if isinstance(snapshots, dict) and snapshots:
            visual["date"] = request.date
            visual["marketScope"] = scope
            specs.append(
                JsonArtifactSpec(
                    storage=StorageKind.GZIP_JSON,
                    artifact_type="briefing_visual",
                    artifact_id=f"{request.date}.{scope}",
                    exact_path=data_root / "briefings" / f"{request.date}.{scope}.visuals.json.gz",
                    payload=visual,
                )
            )
    if request.link is not None:
        link = deepcopy(request.link)
        link["date"] = request.date
        specs.append(
            JsonArtifactSpec(
                storage=StorageKind.JSON,
                artifact_type="briefing_link",
                artifact_id=request.date,
                exact_path=data_root / "briefings" / f"{request.date}.link.json",
                payload=link,
            )
        )
    return specs
