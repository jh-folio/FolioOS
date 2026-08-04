type Props = { variant?: "chrome" | "hero" };

/**
 * `folio ─ os` 워드마크. 두 단어는 같은 굵기의 소문자이고, 사이의 가로 막대가
 * 구분과 리듬을 담당한다. 막대 색과 길이는 CSS가 variant로 정한다:
 * chrome(상단바)는 잉크 단색으로 조용하게, hero(홈)는 골드로 브랜드 순간을 만든다.
 *
 * 문서·README의 제품명 표기는 계속 `Folio OS`다. 소문자는 화면 워드마크의
 * 시각 처리이므로, 스크린리더에는 표기용 이름을 따로 읽힌다.
 */
export function FolioWordmark({ variant = "chrome" }: Props) {
  return (
    <span className="folio-wordmark" data-variant={variant}>
      <span className="sr-only">Folio OS</span>
      <span className="folio-wordmark__word" aria-hidden="true">folio</span>
      <span className="folio-wordmark__bar" aria-hidden="true" />
      <span className="folio-wordmark__word" aria-hidden="true">os</span>
    </span>
  );
}
