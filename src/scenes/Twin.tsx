import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { tracked } from "../api/log";
import { ApiPanel } from "../components/ApiPanel";
import { TelemetryPanel } from "../components/TelemetryPanel";
import { TwinScene } from "../components/TwinScene";
import { OBSTACLE_EVENT } from "../data/proposal";
import { useDemoStore } from "../store/demoStore";
import { useReplay } from "../telemetry/useReplay";
import "./Twin.css";

const unreachable = (e: unknown) =>
  e instanceof ApiError ? e.message : "The API is not reachable. Start the mock with `npm run mock`.";

export function Twin() {
  const experiment = useDemoStore((s) => s.experiment);
  const setExperiment = useDemoStore((s) => s.setExperiment);
  const phase = useDemoStore((s) => s.twinPhase);
  const setPhase = useDemoStore((s) => s.setTwinPhase);
  const telemetry = useDemoStore((s) => s.telemetry);
  const setTelemetry = useDemoStore((s) => s.setTelemetry);
  const testbeds = useDemoStore((s) => s.testbeds);
  const [error, setError] = useState<string | null>(null);
  const [injected, setInjected] = useState<{ t: number; message: string }[]>([]);
  const requestedFor = useRef<string | null>(null);

  const nameOf = (id: string) => testbeds.find((t) => t.id === id)?.name ?? id;
  const running = experiment?.status === "running";
  const replay = useReplay(telemetry?.samples ?? null, running);

  // On entering the scene: GET /experiments/{id}/telemetry, then replay it.
  useEffect(() => {
    // The ref makes this run once even under StrictMode's double effect, so
    // the result must not be discarded on cleanup.
    if (!experiment || telemetry || requestedFor.current === experiment.id) return;
    requestedFor.current = experiment.id;
    tracked({ method: "GET", path: `/experiments/${experiment.id}/telemetry` }, 200, () =>
      api.getTelemetry(experiment.id),
    )
      .then((batch) => setTelemetry(batch))
      .catch((e: unknown) => setError(unreachable(e)));
  }, [experiment, telemetry, setTelemetry]);

  // Phase "event": POST /experiments/{id}/events with the scripted stimulus.
  useEffect(() => {
    if (phase !== "event" || !experiment) return;
    let cancelled = false;
    tracked({ method: "POST", path: `/experiments/${experiment.id}/events`, request: OBSTACLE_EVENT }, 202, () =>
      api.injectEvent(experiment.id, OBSTACLE_EVENT),
    )
      .then((ack) => {
        if (cancelled) return;
        setInjected((list) => [
          ...list,
          { t: replay.t, message: `Obstacle injected at ${OBSTACLE_EVENT.payload?.location} (${ack.eventId})` },
        ]);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(unreachable(e));
      })
      .finally(() => {
        if (!cancelled) setPhase("running");
      });
    return () => {
      cancelled = true;
    };
    // replay.t is read once, at injection time, on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, experiment, setPhase]);

  // Phase "stopping": POST /experiments/{id}/stop. The replay freezes.
  useEffect(() => {
    if (phase !== "stopping" || !experiment) return;
    let cancelled = false;
    tracked({ method: "POST", path: `/experiments/${experiment.id}/stop` }, 202, () =>
      api.stopExperiment(experiment.id),
    )
      .then((stopped) => {
        if (cancelled) return;
        setExperiment(stopped);
        setPhase("stopped");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(unreachable(e));
        setPhase("running");
      });
    return () => {
      cancelled = true;
    };
  }, [phase, experiment, setExperiment, setPhase]);

  if (!experiment) {
    return (
      <div className="placeholder">
        <p>No experiment is running.</p>
        <p>Start one from the request scene, or press R to restart the demo.</p>
      </div>
    );
  }

  const sofia = replay.latest["tb-sofia-robotics"]?.metrics;

  return (
    <div className="twin">
      <section className="twin__main" aria-label="Experiment">
        <header className="twin__header">
          <div>
            <h2 className="twin__name">{experiment.name}</h2>
            <p className="twin__meta">
              {experiment.id} · booking {experiment.bookingId} · {experiment.testbedIds.map(nameOf).join(" + ")}
            </p>
          </div>
          <span className={`twin__status twin__status--${experiment.status}`}>{experiment.status}</span>
        </header>

        <TwinScene
          robotTarget={sofia?.robotPosition ?? null}
          robotSpeed={running ? (sofia?.robotSpeedMs ?? 0) : 0}
          alarm={replay.alarm !== null}
          obstacle={injected.length > 0}
        />

        <div className="twin__controls">
          <button type="button" className="btn" onClick={() => setPhase("event")} disabled={!running || phase !== "running"}>
            Inject obstacle in the tunnel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setPhase("stopping")}
            disabled={!running || phase !== "running"}
          >
            Stop the experiment
          </button>
        </div>
        {error && <p role="alert" className="request__error">{error}</p>}
      </section>

      <div className="twin__side">
        <TelemetryPanel replay={replay} injected={injected} testbedIds={experiment.testbedIds} nameOf={nameOf} />
        <ApiPanel />
      </div>
    </div>
  );
}
