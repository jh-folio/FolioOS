# Company Analysis Prompt Legacy Pointer

This file is kept only as a legacy compatibility pointer.

The active prompts are separate, complete prompt files:

- `features/company_analysis/prompts/beginner.md`
- `features/company_analysis/prompts/advanced.md`

Runtime selection is handled by `features/company_analysis/style.py`.
Use `analysisStyle=beginner` for the beginner-friendly report and
`analysisStyle=advanced` for the deeper analyst-style report.

Both active prompts intentionally duplicate the evidence hierarchy,
no-fabrication rules, data-gap handling rules, and the same 9-section report
outline. Do not replace them with a shared base prompt unless the user
explicitly approves that architecture change.
