"""재스캔은 Vault의 현재 상태를 반영한다.

note_id가 `sha1(rel_path)`라 노트를 지우거나 이름·폴더를 바꾸면 옛 행이 남는다.
정리하지 않으면 없는 파일이 계속 hypothesis로 조회되고(이름변경은 같은 노트가 두
건으로 집계된다) 사용자가 DB를 직접 만지지 않는 한 회복할 방법이 없다.
"""
from __future__ import annotations

from features.obsidian.importer import note_index as idx
from features.obsidian.importer import service as S

THESIS = """---
type: company_thesis
ticker: NVDA
company: NVIDIA
source_layer: user_synthesis
reuse_as_hypothesis: true
---

# NVDA 투자 Thesis

가속 컴퓨팅 전환이 중기 동력이다.
"""


def _write(vault, rel, text=THESIS):
    path = vault / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def _hypotheses(db):
    conn = idx.connect(db)
    try:
        return idx.list_notes(conn, importable=True, ticker="NVDA")
    finally:
        conn.close()


def test_renamed_note_is_not_counted_twice(tmp_path):
    vault, db = tmp_path / "vault", tmp_path / "memory.sqlite3"
    note = _write(vault, "Thesis/NVDA Company Thesis.md")
    S.scan_vault(db_path=db, vault=vault)

    note.rename(vault / "Thesis" / "NVDA 투자논거.md")
    summary = S.scan_vault(db_path=db, vault=vault)

    rows = _hypotheses(db)
    assert summary["removed"] == 1
    assert [row["rel_path"] for row in rows] == ["Thesis/NVDA 투자논거.md"]


def test_deleted_note_leaves_no_hypothesis_row(tmp_path):
    """Vault에 다른 노트가 남아 있으면 지운 노트의 행은 정리된다."""
    vault, db = tmp_path / "vault", tmp_path / "memory.sqlite3"
    note = _write(vault, "Thesis/NVDA Company Thesis.md")
    _write(vault, "Memo/시장 메모.md", THESIS.replace("NVDA", "AMD").replace("NVIDIA", "AMD"))
    S.scan_vault(db_path=db, vault=vault)

    note.unlink()
    summary = S.scan_vault(db_path=db, vault=vault)

    assert summary["scanned"] == 1
    assert summary["removed"] == 1
    assert summary["pruneSkipped"] == ""
    assert _hypotheses(db) == []


def test_empty_scan_does_not_prune_the_index(tmp_path):
    """rglob 0건은 삭제가 아니다.

    동기화 placeholder·마운트 직후 Vault가 비어 보이면 예전에는 note_index 전 행이
    지워졌고, 호출자가 예외를 삼켜 overlay가 조용히 "연결된 노트 없음"으로 성공했다.
    """
    vault, db = tmp_path / "vault", tmp_path / "memory.sqlite3"
    note = _write(vault, "Thesis/NVDA Company Thesis.md")
    S.scan_vault(db_path=db, vault=vault)

    note.unlink()
    summary = S.scan_vault(db_path=db, vault=vault)

    assert summary["scanned"] == 0
    assert summary["removed"] == 0
    assert summary["pruneSkipped"] == "vault_empty"
    assert len(_hypotheses(db)) == 1


def test_unreadable_file_still_counts_as_seen(tmp_path, monkeypatch):
    """읽기 실패는 삭제가 아니다. 잠깐 못 읽었다고 행을 지우면 안 된다."""
    vault, db = tmp_path / "vault", tmp_path / "memory.sqlite3"
    _write(vault, "Thesis/NVDA Company Thesis.md")
    S.scan_vault(db_path=db, vault=vault)

    original = S.Path.read_text

    def boom(self, *args, **kwargs):
        if self.suffix == ".md":
            raise OSError("locked")
        return original(self, *args, **kwargs)

    monkeypatch.setattr(S.Path, "read_text", boom)
    summary = S.scan_vault(db_path=db, vault=vault)

    assert summary["scanned"] == 0
    assert summary["removed"] == 0
    assert len(_hypotheses(db)) == 1


def test_untouched_vault_prunes_nothing(tmp_path):
    vault, db = tmp_path / "vault", tmp_path / "memory.sqlite3"
    _write(vault, "Thesis/NVDA Company Thesis.md")
    S.scan_vault(db_path=db, vault=vault)
    summary = S.scan_vault(db_path=db, vault=vault)

    assert summary["removed"] == 0
    assert len(_hypotheses(db)) == 1
