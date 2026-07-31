import type { HomeMode } from "./homePreference";

export function HomeModeChooser({ onChoose }: { onChoose: (mode: HomeMode) => void }) {
  return (
    <div className="home-mode-chooser-backdrop">
      <section
        className="home-mode-chooser"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-mode-chooser-title"
        aria-describedby="home-mode-chooser-description"
      >
        <p className="section-kicker">Choose your Home</p>
        <h2 id="home-mode-chooser-title">어떤 방식으로 시작할까요?</h2>
        <p id="home-mode-chooser-description">
          두 화면은 같은 Agent 대화와 리서치 데이터를 사용합니다. 설정에서 언제든 바꿀 수 있습니다.
        </p>
        <div className="home-mode-chooser-options">
          <button type="button" className="home-mode-option is-recommended" onClick={() => onChoose("office")}>
            <span>기본 선택</span>
            <strong>Pixel Office</strong>
            <small>자료, 보고서, Agent 작업 상태를 한 장면에서 확인합니다.</small>
          </button>
          <button type="button" className="home-mode-option" onClick={() => onChoose("home")}>
            <span>Text workspace</span>
            <strong>Agent Home</strong>
            <small>질문과 대화, 빠른 실행에 집중한 기존 화면입니다.</small>
          </button>
        </div>
      </section>
    </div>
  );
}

