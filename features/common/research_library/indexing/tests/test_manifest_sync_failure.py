"""sync 실패 시 매니페스트 갱신 회귀 테스트.

sync_index()는 단일 트랜잭션이라 실패하면 documents/chunks가 통째로 롤백되는데,
그 뒤에도 file_manifest를 새 서명으로 덮어쓰면 다음 증분 실행이 그 파일들을
"이미 처리됨"으로 건너뛰어 파일이 다시 바뀌기 전까지 색인에서 영구히 빠지던
버그를 고정한다. 옛 매니페스트가 남아 있어야 다음 실행이 스스로 복구한다.
"""

import features.common.research_library.indexing.service as svc


def _workspace(tmp_path, monkeypatch):
    inbox = tmp_path / "research-inbox"
    (inbox / "articles").mkdir(parents=True)
    (inbox / "articles" / "2026-08-14 - Reuters - chip demand.md").write_text(
        "Nvidia data center demand keeps rising this quarter.", encoding="utf-8"
    )
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr(svc, "workspace_root", lambda: tmp_path)
    monkeypatch.setattr(svc, "INBOX_DIR", inbox)
    monkeypatch.setattr(svc, "DATA_DIR", data_dir)
    monkeypatch.setattr(svc, "RESEARCH_DB_PATH", data_dir / "research-index.sqlite3")


def test_manifest_is_not_updated_when_sqlite_sync_fails(tmp_path, monkeypatch):
    _workspace(tmp_path, monkeypatch)
    manifest_writes = []
    monkeypatch.setattr(svc, "write_manifest", lambda *args: manifest_writes.append(args))

    def locked(*_args, **_kwargs):
        raise RuntimeError("database is locked")

    monkeypatch.setattr(svc, "sync_index", locked)

    index = svc.build_index(incremental=True)

    assert index["sqlite"]["error"] == "sqlite_index_failed"
    assert index["sqlite"]["manifestError"] == "manifest_skipped_after_sync_failure"
    assert manifest_writes == []


def test_manifest_is_updated_after_successful_sync(tmp_path, monkeypatch):
    _workspace(tmp_path, monkeypatch)
    manifest_writes = []
    monkeypatch.setattr(svc, "write_manifest", lambda *args: manifest_writes.append(args))
    monkeypatch.setattr(svc, "sync_index", lambda *_args, **_kwargs: {"documents": 1})

    index = svc.build_index(incremental=True)

    assert index["sqlite"] == {"documents": 1}
    assert len(manifest_writes) == 1
