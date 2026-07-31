import { useEffect, useRef } from "react";
import { Application, TextureStyle } from "pixi.js";
import type { ActivityIntent } from "./activityIntent";
import { loadClassicRoomAssets } from "./assetLoader";
import {
  createClassicRoomRuntime,
  renderStatusIndicators,
  type ClassicRoomRuntime,
} from "./classicRoomRenderer";
import { depthFromFootPoint } from "./depthSort";
import { updateCharacterAnimator } from "./characterAnimation";
import {
  advanceMovement,
  createMovementState,
  requestMovement,
  type MovementPhase,
  type MovementState,
} from "./movementMachine";
import { validateSceneManifest } from "./sceneManifest";
import type { PixelOfficeSceneManifest, SceneObjectStatus } from "./sceneTypes";

type PixelOfficeCanvasProps = {
  manifest: PixelOfficeSceneManifest;
  statuses: SceneObjectStatus;
  intent: ActivityIntent;
  reducedMotion: boolean;
  onReady: () => void;
  onFailure: (message: string) => void;
  onPhaseChange: (phase: MovementPhase) => void;
};

export function PixelOfficeCanvas({
  manifest,
  statuses,
  intent,
  reducedMotion,
  onReady,
  onFailure,
  onPhaseChange,
}: PixelOfficeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ClassicRoomRuntime | null>(null);
  const statusesRef = useRef(statuses);
  const intentRef = useRef(intent);
  const reducedMotionRef = useRef(reducedMotion);
  const callbacksRef = useRef({ onReady, onFailure, onPhaseChange });

  useEffect(() => {
    statusesRef.current = statuses;
    if (runtimeRef.current) {
      renderStatusIndicators(runtimeRef.current.statusIndicators, statuses);
    }
  }, [statuses]);
  useEffect(() => {
    intentRef.current = intent;
  }, [intent]);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);
  useEffect(() => {
    callbacksRef.current = { onReady, onFailure, onPhaseChange };
  }, [onReady, onFailure, onPhaseChange]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let destroyed = false;
    let app: Application | null = null;
    let runtime: ClassicRoomRuntime | null = null;
    let movement: MovementState = createMovementState(manifest);
    let lastIntentKey = "";
    let lastPhase: MovementPhase = movement.phase;

    const updateVisibility = () => {
      if (!app) return;
      if (document.visibilityState === "hidden") app.stop();
      else app.start();
    };

    void (async () => {
      try {
        validateSceneManifest(manifest);
        TextureStyle.defaultOptions.scaleMode = "nearest";
        app = new Application();
        await app.init({
          width: manifest.logicalSize.width,
          height: manifest.logicalSize.height,
          antialias: false,
          autoDensity: false,
          resolution: 1,
          backgroundColor: 0x111b2d,
          preference: "webgl",
          powerPreference: "high-performance",
        });
        if (destroyed) {
          app.destroy({ removeView: true }, { children: true });
          return;
        }

        app.canvas.className = "pixel-office-canvas";
        app.canvas.setAttribute("aria-hidden", "true");
        mount.replaceChildren(app.canvas);

        const assets = await loadClassicRoomAssets();
        if (destroyed) {
          app.destroy({ removeView: true }, { children: true });
          return;
        }
        runtime = createClassicRoomRuntime(manifest, statusesRef.current, assets);
        runtimeRef.current = runtime;
        app.stage.addChild(runtime.world);
        app.ticker.add((ticker) => {
          if (!runtime) return;
          const latestIntent = intentRef.current;
          const intentKey = `${latestIntent.destination}:${latestIntent.arrivalPhase}:${latestIntent.jobId}`;
          if (intentKey !== lastIntentKey) {
            movement = requestMovement(movement, latestIntent.destination, latestIntent.arrivalPhase);
            lastIntentKey = intentKey;
          }

          const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05);
          movement = advanceMovement(
            movement,
            manifest,
            deltaSeconds,
            reducedMotionRef.current ? 168 : 76,
          );
          runtime.agent.x = Math.round(movement.position.x);
          runtime.agent.y = Math.round(movement.position.y);
          runtime.agent.zIndex = depthFromFootPoint(movement.position.y, 10);

          const walking = movement.phase === "walking";
          updateCharacterAnimator(
            runtime.characterAnimator,
            movement.facing,
            walking,
            ticker.deltaMS,
            reducedMotionRef.current,
          );
          runtime.agent.scale.x = movement.facing === "west" ? -1 : 1;

          if (movement.phase !== lastPhase) {
            lastPhase = movement.phase;
            callbacksRef.current.onPhaseChange(movement.phase);
          }
        });
        document.addEventListener("visibilitychange", updateVisibility);
        updateVisibility();
        callbacksRef.current.onReady();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pixel Office renderer initialization failed";
        callbacksRef.current.onFailure(message);
        if (app) app.destroy({ removeView: true }, { children: true });
        app = null;
      }
    })();

    return () => {
      destroyed = true;
      document.removeEventListener("visibilitychange", updateVisibility);
      runtimeRef.current = null;
      runtime?.characterAnimator.destroy();
      if (app) {
        app.destroy({ removeView: true }, { children: true });
        app = null;
      }
      mount.replaceChildren();
    };
  }, [manifest]);

  return <div ref={mountRef} className="pixel-office-canvas-mount" data-pixi-canvas />;
}
