import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDirector } from "./director/useDirector";
import { Catalog } from "./scenes/Catalog";
import { useDemoStore } from "./store/demoStore";

const SCENE_TITLE: Record<string, string> = {
  "/catalog": "Scene 1 · Catalogue",
  "/request": "Scene 2 · Request",
  "/twin": "Scene 3 · Digital twin",
  "/results": "Scene 4 · Results",
};

function Placeholder({ name, tranche }: { name: string; tranche: string }) {
  return (
    <div className="placeholder">
      <p>{name}</p>
      <p>Built in {tranche}.</p>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const theme = useDemoStore((s) => s.theme);
  const director = useDirector();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="stage">
      <header className="topbar">
        <span className="topbar__brand">VITEIA</span>
        <span className="topbar__scene">
          {SCENE_TITLE[pathname] ?? ""}
          {import.meta.env.DEV && director.next && ` — next (space): ${director.next} [${director.position}]`}
        </span>
      </header>
      <main className="scene">
        <Routes>
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/request" element={<Placeholder name="Request" tranche="tranche 2 (bookings) and 3 (experiments)" />} />
          <Route path="/twin" element={<Placeholder name="Digital twin" tranche="tranche 4 (telemetry)" />} />
          <Route path="/results" element={<Placeholder name="Results" tranche="tranche 4 (results)" />} />
        </Routes>
      </main>
    </div>
  );
}
