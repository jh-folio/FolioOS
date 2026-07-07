"""Obsidian Import — 사용자 Obsidian Vault의 2차 사고 노트를 frontmatter 타입별로 회수한다.

Folio OS 2계층 모델의 입력단(hypothesis 회수)이다. Obsidian export의 역방향이며,
같은 Vault(`data/obsidian-settings.json`)를 양방향으로 사용한다.

설계 원칙(CLAUDE.md §5):
- 사용자 노트(user_synthesis)는 evidence가 아니라 hypothesis다.
- Folio OS가 내보낸 노트(generated_by / source_layer: primary_processed / reuse_as_evidence: false)는
  self_generated로 보고 import에서 제외한다(자기참조 금지).
- research-inbox는 절대 건드리지 않는다(인덱서와 독립된 read 경로).
"""
