"""Manual Korea market-data import discovery.

Step 9 does not require a full automatic KRX/BOK integration. This module
defines the supported manual CSV drop zone and turns missing files into
actionable dataGaps.
"""
from __future__ import annotations

import csv
from pathlib import Path

from features.common.research_schema.data_gaps import normalize_data_gap

ROOT = Path(__file__).resolve().parents[3]
MARKET_DATA_DIR = ROOT / "research-inbox" / "market-data"

EXPECTED_FILES = {
    "krx_foreign_flows.csv": "KRX 외국인/기관 수급",
    "sector_performance.csv": "업종/섹터 성과",
    "bok_macro.csv": "한국은행 ECOS 거시지표",
}


def discover_market_data_files(base_dir: Path = MARKET_DATA_DIR) -> dict:
    files = []
    if base_dir.exists():
        for path in sorted(base_dir.glob("*.csv")):
            row_count = 0
            columns: list[str] = []
            try:
                with path.open("r", encoding="utf-8-sig", newline="") as fh:
                    reader = csv.reader(fh)
                    columns = next(reader, [])
                    row_count = sum(1 for _ in reader)
            except Exception:
                columns = []
                row_count = 0
            files.append({
                "name": path.name,
                "path": str(path),
                "rows": row_count,
                "columns": columns[:20],
            })
    present = {item["name"] for item in files}
    missing = [{"name": name, "description": desc} for name, desc in EXPECTED_FILES.items() if name not in present]
    return {
        "directory": str(base_dir),
        "exists": base_dir.exists(),
        "files": files,
        "missingExpectedFiles": missing,
    }


def korea_market_data_gaps(*, artifact_type: str = "briefing", artifact_id: str = "") -> list[dict]:
    summary = discover_market_data_files()
    gaps = []
    if not summary["exists"]:
        gaps.append(normalize_data_gap(
            {
                "category": "market_data",
                "message": "한국 시장 수동 보강 폴더가 없습니다.",
                "severity": "medium",
                "suggestedAction": "research-inbox/market-data/ 폴더를 만들고 krx_foreign_flows.csv, sector_performance.csv, bok_macro.csv 중 필요한 파일을 추가하세요.",
            },
            artifact_type=artifact_type,
            artifact_id=artifact_id,
        ))
    for item in summary["missingExpectedFiles"]:
        gaps.append(normalize_data_gap(
            {
                "category": "market_data",
                "message": f"{item['description']} 수동 CSV가 없습니다({item['name']}).",
                "severity": "low",
                "suggestedAction": f"research-inbox/market-data/{item['name']} 파일을 추가하면 다음 인덱싱/보고서 생성에서 보강 자료로 사용할 수 있습니다.",
            },
            artifact_type=artifact_type,
            artifact_id=artifact_id,
        ))
    return gaps
