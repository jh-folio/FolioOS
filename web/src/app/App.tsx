import { useEffect, useState } from "react";
import { getJson } from "../api";
import { AppShell } from "./AppShell";
import { WelcomeWizard } from "./WelcomeWizard";

type OnboardingStatus = { readonly firstRun: boolean };

/** 첫 실행이면 안내를 먼저 보여준다.
 *
 *  판정은 서버가 한다. 브라우저 저장소로 잡으면 브라우저를 바꾸거나 지웠을 때 쓰던
 *  사람에게 다시 뜨고, 안내 파일 유무만 보면 새 버전으로 올린 사람에게 뜬다.
 *  응답을 기다리는 동안에는 앱을 그대로 보여준다 — 안내 때문에 화면이 늦으면 안 된다.
 */
export function App() {
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const status = await getJson<OnboardingStatus>("/api/onboarding");
        if (!cancelled && status.firstRun) setWelcome(true);
      } catch {
        /* 판정에 실패하면 안내를 띄우지 않는다. 쓰던 사람에게 뜨는 쪽이 더 나쁘다. */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // 설정에서 다시 보기. 서버의 첫 실행 판정을 건드리지 않는다 — 이미 자료가 있는
    // 사람은 어차피 `firstRun`이 false라 상태를 지워도 안내가 뜨지 않고, 지웠다는
    // 사실만 남는다.
    const open = () => setWelcome(true);
    window.addEventListener("folio:show-welcome", open);
    return () => window.removeEventListener("folio:show-welcome", open);
  }, []);

  return (
    <>
      <AppShell />
      {welcome && <WelcomeWizard onFinish={() => setWelcome(false)} />}
    </>
  );
}
