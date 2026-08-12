"""이미 쌓인 자료를 정리하는 기준은 **수집 게이트와 같아야 한다**.

정리 스크립트가 자기 기준표를 따로 들면 설정을 고칠 때마다 조용히 어긋난다 — 피드에서
섹션을 하나 늘렸는데 정리는 그걸 모르고 계속 지우는 식이다. 그래서 판정은 전부
`url_section_allowed()`와 `config/rss_feeds.yaml`에서 나와야 한다.

실측(2026-08-13): 대상 960건 — Handelsblatt 806(politik 423 · technik 154 · karriere 68
· meinung 57 · video 31 …), Het Financieele Dagblad 113, manager magazin 41.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[5]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

import prune_offtopic_rss as prune  # noqa: E402

FINANZEN = {"media": "HB", "url_sections": {"allow": ["finanzen"]}}
UNTERNEHMEN = {"media": "HB", "url_sections": {"allow": ["unternehmen"]}}
OPEN = {"media": "HB"}


def _write(rss_dir: Path, name: str, media: str, url: str) -> Path:
    path = rss_dir / name
    path.write_text(
        f'---\ntitle: "t"\nsource: "{media}"\nurl: "{url}"\nmarkets: ["EUROPE"]\n---\n\nbody\n',
        encoding="utf-8",
    )
    return path


def test_any_active_feed_of_that_outlet_keeps_the_file():
    """한 매체가 섹션 피드를 여럿 가진다. 하나만 받아들여도 남긴다."""
    feeds = [FINANZEN, UNTERNEHMEN]

    assert prune.survives("https://x.de/finanzen/a", feeds) is True
    assert prune.survives("https://x.de/unternehmen/a", feeds) is True
    assert prune.survives("https://x.de/politik/a", feeds) is False


def test_an_outlet_with_one_unrestricted_feed_is_never_touched():
    """규칙 없는 피드가 하나라도 있으면 그 매체는 제한이 없다."""
    assert prune.restricted_media({"HB": [FINANZEN, OPEN]}) == {}
    assert prune.survives("https://x.de/politik/a", [FINANZEN, OPEN]) is True


def test_the_reported_sections_are_the_union_of_its_feeds():
    assert prune.restricted_media({"HB": [FINANZEN, UNTERNEHMEN]}) == {"HB": ["finanzen", "unternehmen"]}


def test_an_outlet_missing_from_the_config_is_left_alone(tmp_path):
    """구독을 내린 매체의 자료는 이 정리가 손대지 않는다. 다른 결정이고 훨씬 무겁다."""
    _write(tmp_path, "a.md", "Reuters", "https://reuters.com/sports/x")

    report = prune.scan(tmp_path, {"HB": [FINANZEN]})

    assert report["candidates"] == 0


def test_a_link_without_a_section_survives(tmp_path):
    """게이트와 같은 이유다 — 구조 신호가 없다고 자료를 버리지 않는다."""
    _write(tmp_path, "a.md", "HB", "https://x.de")

    assert prune.scan(tmp_path, {"HB": [FINANZEN]})["candidates"] == 0


def test_the_scan_counts_what_it_would_remove(tmp_path):
    _write(tmp_path, "a.md", "HB", "https://x.de/politik/1")
    _write(tmp_path, "b.md", "HB", "https://x.de/karriere/1")
    _write(tmp_path, "c.md", "HB", "https://x.de/finanzen/1")

    report = prune.scan(tmp_path, {"HB": [FINANZEN]})

    assert report["candidates"] == 2
    assert report["keptInRestrictedMedia"] == 1
    assert dict(report["bySection"]["HB"]) == {"politik": 1, "karriere": 1}


def test_a_dry_run_is_the_default(tmp_path):
    """실수로 지우는 일이 없어야 한다. `scan`은 읽기만 하고 `remove`가 따로 있다."""
    kept = _write(tmp_path, "a.md", "HB", "https://x.de/politik/1")

    prune.scan(tmp_path, {"HB": [FINANZEN]})

    assert kept.exists()


def test_removal_never_reaches_outside_the_rss_folder(tmp_path):
    """§6 절대 규칙 2. RSS 폴더 밖은 어떤 이유로도 건드리지 않는다."""
    rss = tmp_path / "rss"
    rss.mkdir()
    outsider = tmp_path / "portfolio.json"
    outsider.write_text("{}", encoding="utf-8")

    result = prune.remove([outsider], rss, None)

    assert outsider.exists()
    assert result["removed"] == 0


def test_trash_moves_instead_of_deleting(tmp_path):
    """되돌릴 수 있는 길을 남긴다."""
    rss = tmp_path / "rss"
    rss.mkdir()
    doomed = _write(rss, "a.md", "HB", "https://x.de/politik/1")
    trash = tmp_path / "trash"

    result = prune.remove([doomed], rss, trash)

    assert result["removed"] == 1
    assert not doomed.exists()
    assert (trash / "a.md").read_text(encoding="utf-8").startswith("---")


@pytest.mark.parametrize("section", ["politik", "karriere", "video", "technik", "meinung"])
def test_the_shipped_config_would_no_longer_collect_these_handelsblatt_sections(section):
    """설정이 실제로 그 섹션을 막는지 확인한다. 정리 기준이 곧 이 설정이다."""
    feeds = prune.feeds_by_media()

    assert prune.survives(f"https://www.handelsblatt.com/{section}/x", feeds["Handelsblatt"]) is False


@pytest.mark.parametrize("section", ["finanzen", "unternehmen"])
def test_the_sections_we_do_subscribe_to_survive(section):
    feeds = prune.feeds_by_media()

    assert prune.survives(f"https://www.handelsblatt.com/{section}/x", feeds["Handelsblatt"]) is True
    assert prune.survives(f"https://www.manager-magazin.de/{section}/x", feeds["manager magazin"]) is True
