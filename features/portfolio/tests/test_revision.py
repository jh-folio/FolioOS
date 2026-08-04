from __future__ import annotations

import pytest

from features.portfolio import service


def test_missing_portfolio_is_revision_zero(tmp_path):
    assert service.get_portfolio(tmp_path) == {
        "schemaVersion": 2,
        "revision": 0,
        "positions": [],
        "cash": [],
        "updatedAt": "",
    }


def test_revision_safe_save_and_conflict(tmp_path, monkeypatch):
    monkeypatch.setattr(service, "normalize_portfolio_position", lambda row, resolve=False: {**row, "ticker": row.get("ticker", ""), "quantity": float(row.get("quantity", 0))})
    first = service.save_portfolio({"expectedRevision": 0, "positions": [{"ticker": "NVDA", "quantity": 2}], "cash": []}, data_dir=tmp_path)
    assert first["revision"] == 1
    with pytest.raises(service.PortfolioRevisionConflict) as error:
        service.save_portfolio({"expectedRevision": 0, "positions": [], "cash": []}, data_dir=tmp_path)
    assert error.value.latest["revision"] == 1
    assert service.get_portfolio(tmp_path)["positions"][0]["ticker"] == "NVDA"


def test_legacy_list_is_read_without_mutation(tmp_path):
    path = tmp_path / "portfolio.json"
    path.write_text('[{"ticker":"SPY","quantity":1}]', encoding="utf-8")
    value = service.get_portfolio(tmp_path)
    assert value["revision"] == 0
    assert value["positions"][0]["ticker"] == "SPY"
    assert path.read_text(encoding="utf-8").startswith("[")
