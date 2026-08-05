"""Task 7.5 — an attached screenshot must reach the CLI as a file, not as a filename.

Both existing screenshot paths ask for a prerequisite the user may not have
(Tesseract, an OpenAI key). The Agent CLI reads images with neither, but the
dock discarded image bytes, so the prompt carried only "[첨부: shot.png] (본문
미포함)" and the CLI had nothing to open.
"""
from __future__ import annotations

import base64
from pathlib import Path

import pytest

from features.agent_mode.attachment_files import (
    MAX_IMAGE_BYTES,
    MAX_IMAGE_FILES,
    AttachmentImageError,
    StagedImages,
    decode_image,
    image_block,
    image_extension,
    safe_stem,
)
from features.agent_mode.chat import _attachment_block, build_chat_prompt

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
WEBP = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 64


def _attachment(name="shot.png", data=PNG):
    return {"name": name, "size": len(data), "content": "", "imageData": base64.b64encode(data).decode()}


class TestFormatDetection:
    """A browser MIME type and a filename are both user input; the bytes are not."""

    @pytest.mark.parametrize("data,extension", [
        (PNG, ".png"), (JPEG, ".jpg"), (WEBP, ".webp"),
        (b"GIF89a" + b"\x00" * 8, ".gif"), (b"BM" + b"\x00" * 8, ".bmp"),
    ])
    def test_a_known_signature_names_the_extension(self, data, extension):
        assert image_extension(data) == extension

    def test_a_non_image_is_refused_however_it_is_named(self):
        with pytest.raises(AttachmentImageError, match="attachment_not_an_image"):
            decode_image(base64.b64encode(b"#!/bin/sh\nrm -rf /").decode())

    def test_a_data_url_prefix_is_accepted(self):
        assert decode_image("data:image/png;base64," + base64.b64encode(PNG).decode()) == PNG

    def test_garbage_is_refused(self):
        with pytest.raises(AttachmentImageError, match="attachment_not_base64"):
            decode_image("not base64 at all !!!")

    def test_an_oversized_image_is_refused(self):
        payload = base64.b64encode(PNG + b"\x00" * MAX_IMAGE_BYTES).decode()
        with pytest.raises(AttachmentImageError, match="attachment_too_large"):
            decode_image(payload)


class TestFilenameSafety:
    @pytest.mark.parametrize("name,expected", [
        ("../../etc/passwd", "passwd"),
        ("shot.png", "shot"),
        # 한글은 경로에 안전하므로 그대로 남긴다. 공백만 떨어진다.
        ("포지션 캡처.png", "포지션캡처"),
        ("shot<>:|?*.png", "shot"),
        ("", "attachment"),
        ("a" * 80 + ".png", "a" * 40),
    ])
    def test_a_display_name_never_steers_the_path(self, name, expected):
        assert safe_stem(name) == expected

    def test_a_traversing_name_stays_inside_the_scratch_directory(self):
        with StagedImages([_attachment(name="../../../evil.png")]) as staged:
            assert len(staged.images) == 1
            assert staged.images[0].path.parent == staged.images[0].path.resolve().parent
            assert ".." not in str(staged.images[0].path.name)


class TestLifetime:
    def test_the_file_exists_inside_the_block_and_is_gone_after(self):
        with StagedImages([_attachment()]) as staged:
            path = staged.images[0].path
            assert path.is_file()
            assert path.read_bytes() == PNG
            root = path.parent
        assert not path.exists()
        assert not root.exists()

    def test_cleanup_still_runs_when_the_body_raises(self):
        captured: list[Path] = []
        with pytest.raises(RuntimeError):
            with StagedImages([_attachment()]) as staged:
                captured.append(staged.images[0].path.parent)
                raise RuntimeError("CLI failed")
        assert not captured[0].exists()

    def test_nothing_is_created_when_there_are_no_images(self):
        with StagedImages([{"name": "notes.md", "size": 3, "content": "abc"}]) as staged:
            assert staged.images == []
            assert staged.errors == []

    def test_extra_images_beyond_the_cap_are_reported_not_dropped_silently(self):
        with StagedImages([_attachment(name=f"{i}.png") for i in range(MAX_IMAGE_FILES + 2)]) as staged:
            assert len(staged.images) == MAX_IMAGE_FILES
            assert [code for _name, code in staged.errors] == ["too_many_images"] * 2


class TestPrompt:
    def test_the_prompt_names_the_path_and_never_the_bytes(self):
        with StagedImages([_attachment()]) as staged:
            block = image_block(staged)
            assert str(staged.images[0].path) in block
            assert base64.b64encode(PNG).decode() not in block
            assert "hypothesis" in block

    def test_a_rejected_image_says_why(self):
        bad = {"name": "notes.pdf", "size": 9, "content": "", "imageData": base64.b64encode(b"%PDF-1.7").decode()}
        with StagedImages([bad]) as staged:
            assert "이미지 파일로 인식되지 않았습니다" in image_block(staged)

    def test_without_a_cli_the_user_is_told_why_the_image_was_not_read(self):
        staged = StagedImages([_attachment()])
        block = image_block(staged, cli_available=False)
        assert "Agent CLI가 없어" in block

    def test_an_image_is_no_longer_announced_as_body_less_text(self):
        """The old text block called every image "(본문 미포함)" — now inaccurate."""
        assert _attachment_block({"attachments": [_attachment()]}) == ""

    def test_a_text_attachment_is_unchanged(self):
        block = _attachment_block({"attachments": [{"name": "n.md", "size": 3, "content": "abc"}]})
        assert "[첨부: n.md]" in block and "abc" in block

    def test_the_chat_prompt_carries_the_image_section(self):
        prompt = build_chat_prompt("이 스크린샷 읽어줘", {"surface": "agent_home"}, {"attachments": []}, "", "IMAGE-SECTION")
        assert "IMAGE-SECTION" in prompt


class TestBytesNeverPersist:
    """The gate: image bytes must not survive in the prompt, job result, or logs.

    A chat result is written to `data/jobs.json` and echoed to the client. Passing
    the raw options through would store an attached screenshot on disk — exactly
    what the 0.4 screenshot contract forbids for the OCR path.
    """

    def test_the_result_options_carry_a_flag_not_the_bytes(self):
        from features.agent_mode.companion import normalize_agent_options, public_options

        options = normalize_agent_options({"attachments": [_attachment()]})
        assert options["attachments"][0]["imageData"], "CLI 경로는 바이트가 필요하다"

        public = public_options(options)
        assert "imageData" not in public["attachments"][0]
        assert public["attachments"][0]["hasImage"] is True
        assert public["attachments"][0]["name"] == "shot.png"
        assert base64.b64encode(PNG).decode() not in str(public)

    def test_a_rules_fallback_reply_holds_no_bytes(self):
        from features.agent_mode.companion import agent_companion_reply

        reply = agent_companion_reply("이 스크린샷 읽어줘", {"surface": "agent_home"},
                                      {"attachments": [_attachment()]})
        assert base64.b64encode(PNG).decode() not in str(reply)
        assert reply["options"]["attachments"][0]["hasImage"] is True

    def test_a_text_attachment_gains_no_image_flag(self):
        from features.agent_mode.companion import normalize_agent_options, public_options

        options = normalize_agent_options({"attachments": [{"name": "n.md", "size": 3, "content": "abc"}]})
        assert "hasImage" not in public_options(options)["attachments"][0]
