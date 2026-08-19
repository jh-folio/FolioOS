"""DART 계정 → metric 매핑 회귀 테스트.

부분문자열 매칭이 ProfitLossBeforeTax(세전이익)·ShareOfProfitLoss...(지분법이익)를
"profit loss" 패턴으로 Net Income에 넣고, 손익계산서에서 먼저 나오는 그 행이
슬롯을 차지해 진짜 당기순이익이 버려지던 버그를 고정한다.
"""

from features.company_analysis import dart_client
from features.company_analysis.dart_client import _metric_for_account, build_dart_summary, fetch_financial_rows
from features.company_analysis.report_rules import _reporting_currency


def test_profit_loss_before_tax_is_not_net_income():
    assert _metric_for_account("법인세비용차감전순이익", "ifrs-full_ProfitLossBeforeTax") is None


def test_equity_method_profit_is_not_net_income():
    account_id = "ifrs-full_ShareOfProfitLossOfAssociatesAndJointVenturesAccountedForUsingEquityMethod"
    assert _metric_for_account("지분법이익", account_id) is None


def test_net_income_matches_exact_standard_code():
    assert _metric_for_account("당기순이익", "ifrs-full_ProfitLoss") == "Net Income"


def test_continuing_operations_profit_is_not_operating_income():
    assert _metric_for_account("계속영업이익", "ifrs-full_ProfitLossFromContinuingOperations") is None


def test_operating_income_matches_dart_standard_code():
    assert _metric_for_account("영업이익", "dart_OperatingIncomeLoss") == "Operating Income"


def test_name_fallback_without_standard_code():
    assert _metric_for_account("당기순이익", "-표준계정코드 미사용-") == "Net Income"
    assert _metric_for_account("계속영업당기순이익", "-표준계정코드 미사용-") is None


def test_income_statement_order_does_not_steal_net_income_slot(monkeypatch, tmp_path):
    """삼성전자형 손익계산서 순서(지분법→세전→법인세→당기순이익)에서 당기순이익이 이긴다."""
    statement = [
        {"account_nm": "수익(매출액)", "account_id": "ifrs-full_Revenue", "thstrm_amount": "1000", "fs_div": "CFS"},
        {"account_nm": "영업이익", "account_id": "dart_OperatingIncomeLoss", "thstrm_amount": "200", "fs_div": "CFS"},
        {"account_nm": "지분법이익", "account_id": "ifrs-full_ShareOfProfitLossOfAssociatesAndJointVenturesAccountedForUsingEquityMethod", "thstrm_amount": "20", "fs_div": "CFS"},
        {"account_nm": "법인세비용차감전순이익", "account_id": "ifrs-full_ProfitLossBeforeTax", "thstrm_amount": "180", "fs_div": "CFS"},
        {"account_nm": "법인세비용", "account_id": "ifrs-full_IncomeTaxExpenseContinuingOperations", "thstrm_amount": "40", "fs_div": "CFS"},
        {"account_nm": "당기순이익", "account_id": "ifrs-full_ProfitLoss", "thstrm_amount": "140", "fs_div": "CFS"},
    ]
    monkeypatch.setattr(dart_client, "_request_json", lambda *args, **kwargs: ({"status": "000", "list": statement}, ""))

    rows, warnings = fetch_financial_rows("00126380", tmp_path, "test-key", [2025])

    by_metric = {row["metric"]: row for row in rows}
    assert by_metric["Net Income"]["annual"][0]["val"] == 140
    assert by_metric["Net Income"]["concept"] == "당기순이익"
    assert by_metric["Operating Income"]["annual"][0]["val"] == 200
    assert by_metric["Revenue"]["annual"][0]["val"] == 1000


def test_dart_summary_reports_krw_currency(monkeypatch):
    monkeypatch.delenv("DART_API_KEY", raising=False)
    summary = build_dart_summary({"name": "삼성전자", "ticker": "005930"}, cache_dir=None)
    assert summary["ok"] is False
    assert summary["currency"] == "KRW"
    assert _reporting_currency(summary) == "KRW"
