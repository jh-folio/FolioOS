"""웹 검색 결과는 정해진 출처에서만 온다.

프롬프트에 "신뢰 가능한 매체를 쓰세요"라고 적는 것은 부탁이지 제한이 아니다.
돌아온 URL을 대조하지 않으면 블로그도 커뮤니티도 그대로 근거가 된다.
"""
from __future__ import annotations

import textwrap

from features.common.web_search_scope import (
    COMPANY,
    MEDIA,
    OFFICIAL,
    REJECTED,
    audit_urls,
    company_domain,
    load_source_scope,
    render_scope_instruction,
)

CONFIG = textwrap.dedent(
    """
    official:
      - domain: sec.gov
        label: SEC EDGAR
      - domain: dart.fss.or.kr
        label: DART
    media:
      - domain: reuters.com
        label: Reuters
      - domain: wsj.com
        label: WSJ
        paywalled: true
    company_domain_overrides:
      HWM: https://ir.howmet.com
    """
)


def _scope(company=None):
    return load_source_scope(company, config_loader=lambda: CONFIG)


def test_official_and_media_are_separate_tiers():
    scope = _scope()
    assert scope.classify("https://www.sec.gov/Archives/x.htm")[0] == OFFICIAL
    assert scope.classify("https://www.reuters.com/markets/x")[0] == MEDIA


def test_anything_outside_the_list_is_rejected():
    scope = _scope()
    assert scope.classify("https://some-blog.example/post")[0] == REJECTED
    assert scope.classify("https://seekingalpha.com/article/1")[0] == REJECTED
    assert scope.classify("")[0] == REJECTED


def test_subdomains_belong_to_their_domain():
    """investor.nvidia.com은 nvidia.com과 같은 출처다."""
    scope = _scope({"ticker": "NVDA", "website": "https://www.nvidia.com"})
    assert scope.classify("https://investor.nvidia.com/events")[0] == COMPANY


def test_a_lookalike_domain_is_not_the_company():
    scope = _scope({"ticker": "NVDA", "website": "https://www.nvidia.com"})
    assert scope.classify("https://nvidia.com.fake-site.example/x")[0] == REJECTED


def test_the_company_domain_comes_from_the_resolved_company():
    """1만 종목의 IR 주소를 손으로 관리할 수 없다."""
    assert company_domain({"ticker": "MU", "website": "https://www.micron.com"}) == "micron.com"


def test_an_override_wins_over_the_looked_up_site():
    scope = _scope({"ticker": "HWM", "website": "https://www.howmet.com"})
    assert scope.company_domains == frozenset({"ir.howmet.com"})


def test_paid_media_are_listed_but_marked():
    """검색 결과와 공개 페이지까지만 쓰고 유료 본문은 가져오지 않는다."""
    scope = _scope()
    assert scope.is_paywalled("https://www.wsj.com/articles/x") is True
    assert scope.is_paywalled("https://www.reuters.com/x") is False


def test_a_missing_config_allows_nothing():
    """목록 없이 여는 것보다 웹 검색을 쓰지 않는 편이 낫다."""
    def broken():
        raise OSError("no config")

    scope = load_source_scope({}, config_loader=broken)
    assert scope.allowed_domains() == []
    assert scope.classify("https://www.reuters.com/x")[0] == REJECTED


def test_the_audit_reports_what_fell_outside():
    scope = _scope({"ticker": "NVDA", "website": "https://www.nvidia.com"})
    text = (
        "매출은 https://www.sec.gov/x 에서 확인했고 "
        "해설은 https://www.reuters.com/y 를, "
        "그리고 https://random-blog.example/z 도 참고했습니다."
    )
    result = audit_urls(text, scope)
    assert result["checked"] == 3
    assert [row["url"] for row in result["rejected"]] == ["https://random-blog.example/z"]


def test_the_instruction_names_the_allowed_sources():
    scope = _scope({"ticker": "NVDA", "website": "https://www.nvidia.com"})
    text = render_scope_instruction(scope)
    assert "SEC EDGAR" in text and "Reuters" in text and "nvidia.com" in text
    assert "유료 본문을 우회하지 않습니다" in text
