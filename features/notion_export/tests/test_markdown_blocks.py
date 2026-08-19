import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.notion_export.client import RICH_TEXT_LIMIT, markdown_to_blocks


def _cell_text(cell):
    return "".join(piece["text"]["content"] for piece in cell)


def test_markdown_table_becomes_one_table_block_with_rows_and_cells():
    markdown = (
        "## 지표\n"
        "\n"
        "| 지표 | 값 | 비고 |\n"
        "| --- | ---: | :--- |\n"
        "| KOSPI | 2,650 | **강세** |\n"
        "| USDKRW | 1,380 | [출처](https://example.com) |\n"
    )

    blocks = markdown_to_blocks(markdown)
    tables = [block for block in blocks if block["type"] == "table"]

    assert len(tables) == 1
    table = tables[0]["table"]
    assert table["table_width"] == 3
    assert table["has_column_header"] is True
    assert len(table["children"]) == 3  # 구분 행은 셀이 아니다
    header = table["children"][0]["table_row"]["cells"]
    assert [_cell_text(cell) for cell in header] == ["지표", "값", "비고"]
    body = table["children"][2]["table_row"]["cells"]
    assert _cell_text(body[0]) == "USDKRW"
    assert body[2][0]["text"]["link"] == {"url": "https://example.com"}
    assert all(len(row["table_row"]["cells"]) == 3 for row in table["children"])
    # 표가 문단으로 병합되면 이 문자열이 한 paragraph에 통째로 들어간다.
    paragraphs = [block for block in blocks if block["type"] == "paragraph"]
    assert all("KOSPI" not in str(block) for block in paragraphs)


def test_table_rows_are_padded_to_the_widest_row():
    blocks = markdown_to_blocks("| a | b | c |\n| d |\n")
    table = blocks[0]["table"]

    assert table["table_width"] == 3
    assert table["has_column_header"] is False
    assert [_cell_text(cell) for cell in table["children"][1]["table_row"]["cells"]] == ["d", "", ""]


def test_paragraph_before_a_table_does_not_swallow_it():
    blocks = markdown_to_blocks("설명 문장\n| 항목 | 값 |\n| --- | --- |\n| A | 1 |\n")

    assert [block["type"] for block in blocks] == ["paragraph", "table"]
    assert _cell_text(blocks[0]["paragraph"]["rich_text"]) == "설명 문장"


def test_rich_text_content_is_truncated_at_the_notion_limit():
    long_line = "가" * (RICH_TEXT_LIMIT + 500)
    blocks = markdown_to_blocks(long_line)

    content = blocks[0]["paragraph"]["rich_text"][0]["text"]["content"]
    assert len(content) == RICH_TEXT_LIMIT
