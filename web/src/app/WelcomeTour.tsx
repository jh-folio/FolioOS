/** 첫 실행 안내의 선택 튜토리얼 — Folio OS가 어떻게 도는지 3장.
 *
 *  **개별 화면 사용법이 아니라 자료의 흐름을 말한다.** 처음 여는 사람이 막히는 지점은
 *  버튼 위치가 아니라 "이 앱이 대체 무엇을 해 주는가"다. 자료가 어디서 들어와서 무엇을
 *  거쳐 브리핑·보고서가 되는지 한 번 보면 빈 화면이 빈 화면으로 보이지 않는다.
 *
 *  **큰 SVG 한 장으로 그리지 않는다.** 860px 카드에 맞춘 도형은 375px에서 글자가
 *  뭉개진다. 박스와 화살표를 HTML로 쌓으면 모바일에서 세로로 접히고, 글자가 진짜
 *  텍스트라 확대·번역·스크린리더가 그대로 읽는다.
 *
 *  색은 토큰만 쓴다. 단계를 색으로 구분하지 않는다(DESIGN_SYSTEM §1 원칙 4).
 */

type Slide = {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly flow: ReadonlyArray<{ readonly label: string; readonly detail: string }>;
  readonly note: string;
};

export const TOUR_SLIDES: ReadonlyArray<Slide> = [
  {
    eyebrow: "1 / 3",
    title: "자료가 들어옵니다",
    lead: "뉴스와 공시, 직접 저장한 기사와 리포트가 이 컴퓨터의 자료 폴더에 모입니다. 모인 자료는 검색할 수 있게 정리됩니다.",
    flow: [
      { label: "RSS 뉴스", detail: "고른 시장의 매체에서 자동으로" },
      { label: "내가 넣은 자료", detail: "기사·리포트·공시 파일" },
      { label: "자료 보관함", detail: "찾아 쓸 수 있게 정리" },
    ],
    note: "관심 시장에서 끈 시장은 여기서부터 들어오지 않습니다.",
  },
  {
    eyebrow: "2 / 3",
    title: "자료가 이야기가 됩니다",
    lead: "낱개 기사 대신 지금 시장을 움직이는 흐름으로 묶습니다. 흐름은 하루로 끝나지 않고 강해지거나 약해지는 상태로 이어집니다.",
    flow: [
      { label: "자료 보관함", detail: "쌓인 기사와 공시" },
      { label: "이슈로 묶기", detail: "여러 매체가 함께 다룬 것" },
      { label: "시장 내러티브", detail: "이어지는 흐름과 그 상태" },
    ],
    note: "한 매체만 쓴 이야기는 흐름으로 올라가지 않습니다.",
  },
  {
    eyebrow: "3 / 3",
    title: "이야기가 결과물이 됩니다",
    lead: "모인 자료와 흐름을 바탕으로 브리핑과 보고서를 만듭니다. 결과물에는 어떤 자료를 근거로 삼았는지가 함께 남습니다.",
    flow: [
      { label: "자료 · 흐름", detail: "지금까지 모은 것" },
      { label: "브리핑 · 기업 분석", detail: "매일의 시장과 종목" },
      { label: "내 노트", detail: "내 생각을 최신 자료로 되짚기" },
    ],
    note: "내가 쓴 노트는 근거가 아니라 확인해야 할 생각으로 다룹니다.",
  },
];

export function WelcomeTour({ index }: { index: number }) {
  const slide = TOUR_SLIDES[Math.min(Math.max(index, 0), TOUR_SLIDES.length - 1)];
  return (
    <>
      <p className="welcome-eyebrow welcome-tour-eyebrow">{slide.eyebrow}</p>
      <h1 id="welcomeTitle" tabIndex={-1}>{slide.title}</h1>
      <p>{slide.lead}</p>
      <ol className="welcome-tour-flow">
        {slide.flow.map((stop) => (
          <li key={stop.label}>
            <b>{stop.label}</b>
            <span>{stop.detail}</span>
          </li>
        ))}
      </ol>
      <p className="welcome-muted">{slide.note}</p>
    </>
  );
}
