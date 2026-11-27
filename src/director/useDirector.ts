import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDemoStore } from "../store/demoStore";
import { SCENE_ORDER, steps } from "./steps";

export function useDirector() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  // A new scene starts from its first step.
  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA"].includes(target.tagName);
      if (typing) return;

      if (e.key === " ") {
        e.preventDefault();
        const sceneSteps = steps[pathname] ?? [];
        const step = sceneSteps[indexRef.current];
        if (!step) return;
        step.run(navigate);
        indexRef.current += 1;
        setIndex(indexRef.current);
      }

      if (e.key === "r" || e.key === "R") {
        useDemoStore.getState().reset();
        navigate(SCENE_ORDER[0]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, navigate]);

  const sceneSteps = steps[pathname] ?? [];
  return {
    next: sceneSteps[index]?.label ?? null,
    position: `${Math.min(index, sceneSteps.length)}/${sceneSteps.length}`,
  };
}
