import type { TelemetrySample } from "../api/client";
import type { ReplayState } from "../telemetry/useReplay";
import "./TelemetryPanel.css";

type Props = {
  replay: ReplayState;
  injected: { t: number; message: string }[];
  testbedIds: string[];
  nameOf: (id: string) => string;
};

function Metric({ label, value, unit }: { label: string; value: number | string | undefined; unit?: string }) {
  return (
    <div className="telemetry__metric">
      <span className="telemetry__label">{label}</span>
      <span className="telemetry__value">
        {value === undefined ? "—" : value}
        {value !== undefined && unit ? <small> {unit}</small> : null}
      </span>
    </div>
  );
}

function Column({ sample, name }: { sample: TelemetrySample | undefined; name: string }) {
  const m = sample?.metrics ?? {};
  const pos = m.robotPosition;
  return (
    <div className="telemetry__column">
      <h3 className="telemetry__testbed">{name}</h3>
      <Metric label="Latency" value={m.latencyMs} unit="ms" />
      {m.frameRate !== undefined && <Metric label="Frame rate" value={m.frameRate} unit="fps" />}
      {m.bandwidthMbps !== undefined && <Metric label="Bandwidth" value={m.bandwidthMbps} unit="Mbps" />}
      {m.robotSpeedMs !== undefined && <Metric label="Robot speed" value={m.robotSpeedMs} unit="m/s" />}
      {pos && <Metric label="Robot position" value={`${(pos.x ?? 0).toFixed(1)}, ${(pos.z ?? 0).toFixed(1)}`} unit="m" />}
      {typeof m.workersOnSite === "number" && <Metric label="Workers on site" value={m.workersOnSite} />}
      {typeof m.headsetsConnected === "number" && <Metric label="Headsets" value={m.headsetsConnected} />}
    </div>
  );
}

export function TelemetryPanel({ replay, injected, testbedIds, nameOf }: Props) {
  // Detected by the testbeds and injected by the user, in one feed, newest first.
  const feed = [
    ...replay.events.map((e) => ({ t: e.t, message: e.message, severity: e.severity, key: `d-${e.t}-${e.type}` })),
    ...injected.map((e, i) => ({ t: e.t, message: e.message, severity: "warning" as const, key: `i-${i}` })),
  ].sort((a, b) => b.t - a.t);
  return (
    <section className="telemetry" aria-label="Live telemetry" aria-live="polite">
      <div className="telemetry__head">
        <h2 className="telemetry__title">Live telemetry</h2>
        <span className="telemetry__clock">t = {replay.t.toFixed(0)} s</span>
      </div>
      {replay.alarm && (
        <p role="alert" className="telemetry__alarm">
          {replay.alarm.message}
        </p>
      )}
      <div className="telemetry__columns">
        {testbedIds.map((id) => (
          <Column key={id} sample={replay.latest[id]} name={nameOf(id)} />
        ))}
      </div>
      <ul className="telemetry__events" aria-label="Events detected">
        {feed.map((e) => (
          <li key={e.key} className={`telemetry__event telemetry__event--${e.severity}`}>
            <span>{e.t.toFixed(0)} s</span>
            <span>{e.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
