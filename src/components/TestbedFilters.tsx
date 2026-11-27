import type { Domain } from "../api/client";
import { useDemoStore } from "../store/demoStore";
import "./TestbedFilters.css";

const DOMAINS: { value: Domain; label: string }[] = [
  { value: "digital_twin", label: "Digital twin" },
  { value: "xr", label: "XR (VR / AR)" },
  { value: "robotics", label: "Robotics" },
  { value: "5g", label: "5G network" },
  { value: "hpc", label: "HPC" },
  { value: "iot", label: "IoT sensors" },
  { value: "simulation", label: "Simulation" },
];

export function TestbedFilters() {
  const activeDomains = useDemoStore((s) => s.activeDomains);
  const toggleDomain = useDemoStore((s) => s.toggleDomain);
  const setDomains = useDemoStore((s) => s.setDomains);
  const theme = useDemoStore((s) => s.theme);
  const setTheme = useDemoStore((s) => s.setTheme);

  return (
    <aside className="filters" aria-label="Filters">
      <fieldset className="filters__group">
        <legend>What do you need to test?</legend>
        {DOMAINS.map((d) => (
          <label key={d.value} className="filters__option">
            <input
              type="checkbox"
              checked={activeDomains.includes(d.value)}
              onChange={() => toggleDomain(d.value)}
            />
            {d.label}
          </label>
        ))}
        <button
          type="button"
          className="btn filters__clear"
          onClick={() => setDomains([])}
          disabled={activeDomains.length === 0}
        >
          Clear filters
        </button>
      </fieldset>

      <div className="filters__display">
        <button
          type="button"
          className="btn"
          aria-pressed={theme === "contrast"}
          onClick={() => setTheme(theme === "contrast" ? "default" : "contrast")}
        >
          High contrast
        </button>
      </div>
    </aside>
  );
}
