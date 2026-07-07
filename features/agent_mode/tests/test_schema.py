from features.agent_mode import schema


def test_scrub_secrets_redacts_keys_and_values():
    payload = {
        "OPENAI_API_KEY": "sk-proj-secretvalue123456",
        "nested": {
            "text": "token ghp_abcdefghijklmnopqrstuvwxyz123456 appears here",
            "safe": "value",
        },
    }
    scrubbed = schema.scrub_secrets(payload)
    assert scrubbed["OPENAI_API_KEY"] == "[redacted]"
    assert "ghp_" not in scrubbed["nested"]["text"]
    assert scrubbed["nested"]["safe"] == "value"


def test_build_pack_sets_agent_contract_and_generation_metadata():
    pack = schema.build_pack(
        task_type="briefing",
        artifact_type="briefing",
        artifact_id="2026-06-15",
        title="Daily Market Briefing",
        prompt="prompt",
        context="context",
        output_contract={"format": "markdown"},
        write_back_contract={"method": "write_markdown"},
        save_target="data/briefings/2026-06-15.json",
        sources=[{"title": "Source"}],
    )
    assert pack["taskType"] == "briefing"
    assert pack["status"] == "prepared"
    assert "external evidence is evidence" in pack["agentInstructions"]
    assert pack["outputContract"]["format"] == "markdown"

    generation = schema.agent_generation(3)
    assert generation["mode"] == "agent"
    assert generation["status"] == "ok_agent_authored"
    assert generation["sourceCount"] == 3


if __name__ == "__main__":
    test_scrub_secrets_redacts_keys_and_values()
    test_build_pack_sets_agent_contract_and_generation_metadata()
