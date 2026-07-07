from features.company_analysis.style import (
    PROMPT_DIR,
    REQUIRED_SECTION_HEADINGS,
    analysis_prompt_path,
    analysis_style_label,
    normalize_analysis_style,
    read_analysis_prompt,
    validate_prompt_structure,
)


def test_normalize_analysis_style_defaults_to_beginner():
    assert normalize_analysis_style(None) == "beginner"
    assert normalize_analysis_style("") == "beginner"
    assert normalize_analysis_style("unknown") == "beginner"
    assert normalize_analysis_style("초심자") == "beginner"
    assert normalize_analysis_style("ADVANCED") == "advanced"


def test_analysis_prompt_path_selects_separate_prompt_files():
    assert analysis_prompt_path("beginner").name == "beginner.md"
    assert analysis_prompt_path("advanced").name == "advanced.md"
    assert analysis_prompt_path("invalid").name == "beginner.md"


def test_analysis_style_labels_are_user_facing():
    assert analysis_style_label("beginner") == "초심자"
    assert analysis_style_label("advanced") == "숙련자"


def test_beginner_and_advanced_prompts_are_complete_and_structurally_aligned():
    beginner = read_analysis_prompt("beginner")
    advanced = read_analysis_prompt("advanced")

    assert "초심자" in beginner
    assert "숙련자" in advanced
    assert "제공된 자료에 없는 사실" in beginner
    assert "제공된 자료에 없는 사실" in advanced
    assert validate_prompt_structure(beginner) == []
    assert validate_prompt_structure(advanced) == []

    for heading in REQUIRED_SECTION_HEADINGS:
        assert heading in beginner
        assert heading in advanced


def test_legacy_prompt_file_points_to_separate_active_prompts():
    legacy_prompt = (PROMPT_DIR.parent / "prompt.md").read_text(encoding="utf-8")

    assert "legacy" in legacy_prompt.lower()
    assert "prompts/beginner.md" in legacy_prompt
    assert "prompts/advanced.md" in legacy_prompt
    assert "active prompts" in legacy_prompt.lower()


def test_readme_documents_style_modes_and_gap_resolver():
    readme = (PROMPT_DIR.parent / "README.md").read_text(encoding="utf-8")

    assert "analysisStyle" in readme
    assert "beginner" in readme
    assert "advanced" in readme
    assert "data-gap resolver" in readme
    assert "features/company_analysis/prompts/beginner.md" in readme
    assert "features/company_analysis/prompts/advanced.md" in readme
