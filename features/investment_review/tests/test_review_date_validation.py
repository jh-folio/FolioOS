"""리뷰 캐시 경로의 date 입력 봉쇄 회귀 테스트.

사용자 입력 date가 그대로 캐시 파일 경로에 붙어 `../portfolio` 같은 값이
`data/portfolio.json`을 리뷰 JSON으로 덮어쓸 수 있던 취약점을 고정한다.
"""

from __future__ import annotations

import pytest

from features.investment_review import service


def test_build_review_rejects_traversal_date(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "REVIEW_DIR", tmp_path / "investment-review")
    with pytest.raises(ValueError):
        service.build_review(date="../portfolio")
    assert not (tmp_path / "portfolio.json").exists()


def test_get_review_rejects_traversal_date():
    with pytest.raises(ValueError):
        service.get_review("..\\portfolio")


def test_normalize_review_date_accepts_iso_and_defaults_to_today():
    assert service.normalize_review_date("2026-08-15") == "2026-08-15"
    assert service.normalize_review_date(None) == service._today()
    assert service.normalize_review_date("") == service._today()


@pytest.mark.parametrize("bad", ["2026/08/15", "../pwn", "..", "a" * 30, "2026-08-15x"])
def test_normalize_review_date_rejects_non_iso(bad):
    with pytest.raises(ValueError):
        service.normalize_review_date(bad)


def test_cache_path_is_confined_to_review_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "REVIEW_DIR", tmp_path)
    with pytest.raises(ValueError):
        service._cache_path("../pwn")
    assert service._cache_path("2026-08-15").parent == tmp_path.resolve()


def _stub_inputs(monkeypatch):
    """집계 입력을 비운다 — 검증 대상은 날짜 처리뿐이다."""
    monkeypatch.setattr(service, "_load_regime_states", lambda _warnings: [])
    monkeypatch.setattr(service, "_load_theses_with_deltas", lambda _warnings: ([], {}))
    monkeypatch.setattr(service, "_load_positions", lambda _warnings: [])
    monkeypatch.setattr(service, "_load_watchlist", lambda _warnings: [])
    monkeypatch.setattr(service, "_load_notes", lambda _warnings: [])
    monkeypatch.setattr(service, "build_dashboard_tape", lambda _date, _warnings: {})
    monkeypatch.setattr(service, "_load_recent_reports", lambda _warnings: [])


def test_generation_is_pinned_to_today_and_says_so(tmp_path, monkeypatch):
    """집계 입력은 전부 현재 시점 조회다. 과거 날짜로 저장하면 오늘의 판단이 그 날짜의 판단이 된다."""
    review_dir = tmp_path / "investment-review"
    monkeypatch.setattr(service, "REVIEW_DIR", review_dir)
    _stub_inputs(monkeypatch)

    review = service.generate_review({"date": "2026-01-05"})

    assert review["date"] == service._today()
    assert any("2026-01-05" in warning for warning in review["warnings"])
    assert not (review_dir / "2026-01-05.json").exists()
    assert (review_dir / f"{service._today()}.json").exists()


def test_nonpersisting_render_keeps_its_label_but_states_the_data_is_current(tmp_path, monkeypatch):
    """저장하지 않는 렌더링(잡 준비)은 호출자가 날짜를 소유한다. 대신 사실을 본문에 남긴다."""
    monkeypatch.setattr(service, "REVIEW_DIR", tmp_path / "investment-review")
    _stub_inputs(monkeypatch)

    review = service.build_review(date="2026-01-05", force_refresh=True, persist=False)

    assert review["date"] == "2026-01-05"
    assert any("현재 데이터로 집계" in warning for warning in review["warnings"])
    assert not (tmp_path / "investment-review").exists()


def test_todays_generation_keeps_its_date_and_warning_free_label(tmp_path, monkeypatch):
    review_dir = tmp_path / "investment-review"
    monkeypatch.setattr(service, "REVIEW_DIR", review_dir)
    _stub_inputs(monkeypatch)

    today = service._today()
    review = service.generate_review({"date": today})

    assert review["date"] == today
    assert not any("현재 데이터로 집계" in warning for warning in review["warnings"])
    assert (review_dir / f"{today}.json").exists()


def test_an_existing_dated_cache_is_still_readable(tmp_path, monkeypatch):
    """이미 저장된 옛 리뷰는 그대로 읽는다 — 고치는 것은 생성 경로뿐이다."""
    review_dir = tmp_path / "investment-review"
    review_dir.mkdir(parents=True)
    (review_dir / "2026-01-05.json").write_text('{"date": "2026-01-05", "markdown": "# old"}', encoding="utf-8")
    monkeypatch.setattr(service, "REVIEW_DIR", review_dir)

    assert service.get_review("2026-01-05")["date"] == "2026-01-05"


def test_a_future_dated_file_never_becomes_the_latest_saved_review(tmp_path, monkeypatch):
    review_dir = tmp_path / "investment-review"
    review_dir.mkdir(parents=True)
    (review_dir / "2030-01-01.json").write_text('{"date": "2030-01-01"}', encoding="utf-8")
    (review_dir / "2026-01-05.json").write_text('{"date": "2026-01-05"}', encoding="utf-8")
    monkeypatch.setattr(service, "REVIEW_DIR", review_dir)

    assert service._load_latest()["date"] == "2026-01-05"
