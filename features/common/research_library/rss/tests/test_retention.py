"""RSS 보관 기간 — 무엇을 지우고, 무엇은 절대 건드리지 않는가."""
import datetime as dt
import sqlite3

import pytest

from features.common.research_library.rss import retention

TODAY = dt.date(2026, 8, 10)


def make_archive(root, names):
    rss = root / "rss"
    rss.mkdir(parents=True, exist_ok=True)
    for name in names:
        (rss / name).write_text("body", encoding="utf-8")
    return rss


def test_only_files_past_the_window_go(tmp_path):
    rss = make_archive(tmp_path, [
        "2026-01-02 09-00-00 - BBC - old.md",
        "2026-07-01 09-00-00 - BBC - middle.md",
        "2026-08-09 09-00-00 - BBC - fresh.md",
    ])

    gone = retention.delete_expired(90, rss_dir=rss, today=TODAY)

    assert gone["deleted"] == 1
    assert sorted(p.name for p in rss.iterdir()) == [
        "2026-07-01 09-00-00 - BBC - middle.md",
        "2026-08-09 09-00-00 - BBC - fresh.md",
    ]


def test_unlimited_deletes_nothing(tmp_path):
    rss = make_archive(tmp_path, ["2020-01-02 09-00-00 - BBC - ancient.md"])

    assert retention.delete_expired(0, rss_dir=rss, today=TODAY)["deleted"] == 0
    assert len(list(rss.iterdir())) == 1


def test_the_collector_state_file_is_never_touched(tmp_path):
    """`.state.json`은 마지막 실행 기록이다. 날짜 접두가 없어 애초에 걸리지 않지만,
    지워지면 수집기가 무엇을 했는지 잃는다."""
    rss = make_archive(tmp_path, ["2020-01-02 09-00-00 - BBC - ancient.md"])
    (rss / ".state.json").write_text("{}", encoding="utf-8")

    retention.delete_expired(30, rss_dir=rss, today=TODAY)

    assert (rss / ".state.json").exists()


def test_a_file_with_no_date_is_left_alone(tmp_path):
    """날짜를 못 읽으면 나이를 모른다. 모르는 것을 지우지 않는다."""
    rss = make_archive(tmp_path, ["notes about the market.md"])

    assert retention.delete_expired(30, rss_dir=rss, today=TODAY)["deleted"] == 0
    assert (rss / "notes about the market.md").exists()


@pytest.mark.parametrize("value, expected", [(999, 90), ("30", 30), (None, 90), (-1, 90), (0, 0)])
def test_only_the_offered_choices_are_accepted(value, expected):
    """화면에서 고르는 값이다. 임의의 숫자로 자료가 지워지지 않는다."""
    assert retention.normalize_days(value) == expected


def test_the_preview_says_what_would_go_before_it_goes(tmp_path):
    rss = make_archive(tmp_path, [
        "2026-01-02 09-00-00 - BBC - old.md",
        "2026-08-09 09-00-00 - BBC - fresh.md",
    ])

    seen = retention.preview(90, rss_dir=rss, today=TODAY)

    assert seen["files"] == 1
    assert seen["cutoff"] == "2026-05-12"
    assert seen["fileBytes"] > 0
    assert len(list(rss.iterdir())) == 2, "미리보기는 아무것도 지우지 않는다"


def test_evidence_rows_follow_their_file(tmp_path):
    """인덱서도 피드 캐시도 이 표를 건드리지 않는다. 남으면 없는 파일을 근거로 인용한다."""
    rss = make_archive(tmp_path, ["2026-08-09 09-00-00 - BBC - alive.md"])
    db = tmp_path / "research-index.sqlite3"
    conn = sqlite3.connect(db)
    conn.execute("CREATE TABLE evidence_items (id TEXT PRIMARY KEY, markdown_path TEXT)")
    conn.executemany(
        "INSERT INTO evidence_items (id, markdown_path) VALUES (?, ?)",
        [
            # 저장은 역슬래시, documents.path는 슬래시다. 파일명으로 맞춘다.
            ("alive", r"research-inbox\rss\2026-08-09 09-00-00 - BBC - alive.md"),
            ("gone", r"research-inbox\rss\2026-01-02 09-00-00 - BBC - old.md"),
        ],
    )
    conn.commit()
    conn.close()

    assert retention.prune_orphan_evidence(db_path=db, rss_dir=rss) == 1

    conn = sqlite3.connect(db)
    assert [r[0] for r in conn.execute("SELECT id FROM evidence_items")] == ["alive"]
    conn.close()


def test_reclaiming_reports_honestly_when_there_is_no_index(tmp_path):
    """공간이 없어 못 줄인 것을 줄였다고 말하면 안 된다."""
    result = retention.reclaim_index_space(db_path=tmp_path / "missing.sqlite3")

    assert result["ok"] is False
    assert result["reason"] == "no_index"


def test_the_scheduled_collection_never_vacuums():
    """VACUUM은 실측 728MB 기준 29초 동안 DB를 통째로 잠근다.

    매시간 도는 수집이 파일 하나를 지웠다고 매번 물리면 그 시간마다 앱이 멈춘다.
    자동 수집은 지운 자리를 SQLite가 재사용하게 두어 크기를 묶어 두고, 파일을 실제로
    줄이는 일은 사용자가 `지금 정리`를 눌렀을 때만 한다.
    """
    import inspect

    from features.common.research_library.rss import service

    collected = inspect.getsource(service._import_rssarchive_locked)
    assert "delete_expired_rss" in collected, "수집 경로가 보관 기간을 적용해야 한다"
    assert "reclaim_index_space" not in collected, "수집 경로에서 VACUUM을 부르면 안 된다"
    assert "reclaim_index_space" in inspect.getsource(service.run_retention_now)


def test_nothing_to_delete_means_no_reindex():
    """지울 것이 없는데 재색인을 돌리면 아무 일도 아닌 데 몇 분을 쓴다."""
    import inspect

    from features.common.research_library.rss import service

    source = inspect.getsource(service.run_retention_now)
    assert '"skipped": True' in source
    assert source.index('if not removed.get("deleted")') < source.index("build_index")


def test_upgrading_never_deletes_what_you_already_have():
    """보관 기간이 없던 설정에 기본 90일을 먹이면, 반년치를 모아 둔 사람이 새 버전을
    받는 것만으로 다음 수집에서 석 달치를 잃는다. 지우겠다고 말한 적이 없는데 지워진다.

    줄이는 것은 화면에서 고르게 하고, 고를 때 몇 건이 지워지는지 먼저 보여준다.
    """
    from features.automation.schema import normalize_settings

    upgraded = normalize_settings({"rss": {"enabled": True, "saveFullText": True}})
    fresh = normalize_settings(None)

    assert upgraded["rss"]["retentionDays"] == 0, "쓰던 설정은 계속 보관"
    assert fresh["rss"]["retentionDays"] == retention.DEFAULT_RETENTION_DAYS, "새 설치는 처음부터 묶는다"
    # 한 번 고르면 그 값이 그대로 남는다.
    assert normalize_settings({"rss": {"retentionDays": 30}})["rss"]["retentionDays"] == 30
    assert normalize_settings({"rss": {"retentionDays": 0}})["rss"]["retentionDays"] == 0
