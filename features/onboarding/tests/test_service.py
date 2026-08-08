"""첫 실행 판정.

지킬 것은 하나다. **쓰던 사람이 새 버전으로 올렸을 때 위저드가 뜨면 안 된다.**
안내 파일 유무만 보면 정확히 그 일이 벌어진다 — 그 파일은 배포 zip에 없다.
"""
from __future__ import annotations

import pytest

from features.common import workspace
from features.onboarding import service


@pytest.fixture
def fresh(tmp_path, monkeypatch):
    """갓 켠 서버 상태. 서버가 스스로 만드는 파일 10개만 있다."""
    root = tmp_path / "FolioOS-v0.5.1"
    for name in workspace.WORKSPACE_DIR_NAMES:
        (root / name).mkdir(parents=True)
    for name in ("index.json", "market-memory.sqlite3", "research-index.sqlite3"):
        (root / "data" / name).write_text("{}", encoding="utf-8")
    (root / "data" / "sec-cache").mkdir()
    (root / "data" / "sec-cache" / "company_tickers_exchange.json").write_text("{}", encoding="utf-8")
    for name in ("company_master.json", "sp500_constituents.json"):
        (root / "config" / name).write_text("{}", encoding="utf-8")
    for name in service.USER_DIRS:
        (root / "data" / name).mkdir(exist_ok=True)
    for name in service.INBOX_DIRS:
        (root / "research-inbox" / name).mkdir(exist_ok=True)

    monkeypatch.setattr(workspace, "APP_ROOT", root)
    monkeypatch.delenv("FOLIO_HOME", raising=False)
    monkeypatch.setattr(workspace, "documents_root", lambda: tmp_path / "home" / "Documents")
    workspace.reset_cache()
    yield root
    workspace.reset_cache()


def test_a_brand_new_workspace_is_a_first_run(fresh):
    """서버가 스스로 만드는 파일은 사용자 자료가 아니다."""
    status = service.onboarding_status()
    assert status["firstRun"] is True
    assert status["reason"] == "fresh"
    assert status["completed"] is False


@pytest.mark.parametrize(
    "path",
    [
        "data/portfolio.json",
        "data/watchlist.json",
        "data/market-scope.json",
        "data/briefings/2026-08-08.json",
        "data/company-analysis/NVDA-2026-08-08.json",
        "data/topic-reports/ai-power.json",
        "research-inbox/rss/2026-08-08-reuters.md",
        "research-inbox/articles/note.md",
    ],
)
def test_any_user_artifact_means_it_is_not_a_first_run(fresh, path):
    """0.5.0을 쓰던 사람이 0.5.1로 올릴 때 안내 파일은 없다. 자료로 판정해야 한다."""
    target = fresh / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("{}", encoding="utf-8")

    status = service.onboarding_status()
    assert status["firstRun"] is False
    assert status["reason"] == "existing_workspace"


def test_finishing_the_guide_stops_it_from_coming_back(fresh):
    assert service.onboarding_status()["firstRun"] is True

    done = service.complete_onboarding()
    assert done["firstRun"] is False
    assert done["skipped"] is False
    assert done["completedAt"]

    assert service.onboarding_status()["firstRun"] is False
    assert service.onboarding_status()["reason"] == "completed"


def test_skipping_also_counts_as_finished(fresh):
    """건너뛴 사람에게 다음 실행에 또 띄우면 건너뛰기가 아니다."""
    service.complete_onboarding(skipped=True)

    status = service.onboarding_status()
    assert status["firstRun"] is False
    assert status["completed"] is True


def test_a_broken_state_file_does_not_crash_the_app(fresh):
    """읽지 못하는 파일 때문에 앱이 뜨지 않으면 안 된다."""
    service.state_path().write_text("{망가진 json", encoding="utf-8")
    status = service.onboarding_status()
    assert status["completed"] is False
    # 자료가 없으니 첫 실행으로 본다. 안내를 한 번 더 보는 쪽이 못 켜는 것보다 낫다.
    assert status["firstRun"] is True
