import type { Testbed } from "../api/client";
import "./TestbedList.css";

type Props = {
  testbeds: Testbed[];
  total: number;
  highlightedId?: string | null;
  onSelect?: (testbed: Testbed) => void;
};

const DOMAIN_LABEL: Record<string, string> = {
  digital_twin: "Digital twin",
  xr: "XR",
  robotics: "Robotics",
  "5g": "5G",
  hpc: "HPC",
  iot: "IoT",
  simulation: "Simulation",
};

export function TestbedList({ testbeds, total, highlightedId, onSelect }: Props) {
  return (
    <section aria-label="Testbeds">
      <p className="list__summary" aria-live="polite">
        {testbeds.length === total
          ? `${total} testbeds in the federation`
          : `${testbeds.length} of ${total} testbeds match`}
      </p>
      <ul className="list">
        {testbeds.map((t) => {
          const online = t.status === "online";
          return (
            <li key={t.id}>
              <button
                type="button"
                className="list__item"
                aria-pressed={t.id === highlightedId}
                onClick={() => onSelect?.(t)}
              >
                <span className="list__name">{t.name}</span>
                <span className="list__meta">
                  {t.location.city}, {t.location.country}
                  {t.qos.maxLatencyMs != null && ` · ≤ ${t.qos.maxLatencyMs} ms`}
                  {t.qos.minFrameRate != null && ` · ≥ ${t.qos.minFrameRate} fps`}
                </span>
                <span className="list__domains">
                  {t.domains.map((d) => (
                    <span key={d}>{DOMAIN_LABEL[d] ?? d}</span>
                  ))}
                </span>
                <span className={`list__status list__status--${online ? "online" : "off"}`}>
                  {online ? "Online" : t.status === "maintenance" ? "Under maintenance" : "Offline"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
