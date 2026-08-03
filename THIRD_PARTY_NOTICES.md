# Third-party notices

## TradingView Lightweight Charts™

Folio OS loads TradingView Lightweight Charts version 5.2.0 for interactive
briefing price charts.

- Project: <https://github.com/tradingview/lightweight-charts>
- License: Apache License 2.0
- Copyright © 2025 TradingView, Inc. <https://www.tradingview.com/>

The user-facing chart area retains the required TradingView attribution and
link through `layout.attributionLogo`, with an additional visible notice below
the briefing visuals.

## Tesseract OCR

Folio OS can call a user-installed Tesseract executable for local-first
portfolio screenshot recognition. Tesseract is not installed automatically.

- Project: <https://github.com/tesseract-ocr/tesseract>
- License: Apache License 2.0

The import flow requests the `kor` and `eng` language data, returns only a
normalized editable draft, and does not retain the image, raw OCR text, or word
bounding boxes.

## Fast-origin news services

FinancialJuice, Investing.com, and Benzinga are optional external news sources,
not bundled libraries. Their names and links identify the origin of user-enabled
feeds. Provider terms, availability, and delay policies continue to apply.

- FinancialJuice free stream data may be delayed by approximately 10 minutes.
- Investing.com collection is disabled until the user supplies a feed URL they
  are authorized to use.
- Benzinga collection uses a configured official/authorized RSS URL; Folio OS
  does not scrape the website or use a paid article bypass.

All three enter Folio OS as metadata-only, unconfirmed leads. They do not count
as report evidence until corroborated through an eligible evidence path.

## Optional OpenAI Vision import

When the user explicitly selects external Vision and consents for that request,
Folio OS can send only the browser-cropped/redacted image to the configured
OpenAI API with storage disabled in the request. The local import remains the
default. Users should review the current provider privacy and retention terms
before enabling this option.
