import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { tracked } from "../api/log";
import { ApiPanel } from "../components/ApiPanel";
import { OBSTACLE_EVENT } from "../data/proposal";
import { useDemoStore } from "../store/demoStore";
import "./Twin.css";

const unreachable = (e: unknown) =>
  e instanceof ApiError ? e.message : "The API is not reachable. Start the mock with `npm run mock`.";

export function Twin() {
  const experiment = useDemoStore((s) => s.experiment);
  const setExperiment = useDemoStore((s) => s.setExperiment);
  const phase = useDemoStore((s) => s.twinPhase);
  const setPhase = useDemoStore((s) => s.setTwinPhase);
  const testbeds = useDemoStore((s) => s.testbeds);
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const name = (id: string) => testbeds.find((t) => t.id === id)?.name ?? id;

  // Phase "event": POST /experiments/{id}/events with the scripted stimulus.
  useEffect(() => {
    if (phase !== "event" || !experiment) return;
    let cancelled = false;
    const path = `/experiments/${experiment.id}/events`;
    tracked({ method: "POST", path, request: OBSTACLE_EVENT }, 202, () =>
      api.injectEvent(experiment.id, OBSTACLE_EVENT),
    )
      .then((ack) => {
        if (cancelled) return;
        setEvents((e) => [...e, `${ack.eventId}: obstacle at ${OBSTACLE_EVENT.payload?.location}`]);
        setPhase("running");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(unreachable(e));
        setPhase("running");
      });
    return () => {
      cancelled = true;
    };
  }, [phase, experiment, setPhase]);

  // Phase "stopping": POST /experiments/{id}/stop.
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

  return (
    <div className="twin">
      <section className="twin__main" aria-label="Experiment">
        <header className="twin__header">
          <div>
            <h2 className="twin__name">{experiment.name}</h2>
            <p className="twin__meta">
              {experiment.id} · booking {experiment.bookingId} ·{" "}
              {experiment.testbedIds.map(name).join(" + ")}
            </p>
          </div>
          <span className={`twin__status twin__status--${experiment.status}`}>{experiment.status}</span>
        </header>

        <div className="twin__stage" aria-label="Digital twin view">
          <p>3D view of the site: built in tranche 4 (telemetry).</p>
        </div>

        <div className="twin__controls">
          <button
            type="button"
            className="btn"
            onClick={() => setPhase("event")}
            disabled={experiment.status !== "running" || phase !== "running"}
          >
            Inject obstacle in the tunnel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setPhase("stopping")}
            disabled={experiment.status !== "running" || phase !== "running"}
          >
            Stop the experiment
          </button>
          {events.length > 0 && (
            <ul className="twin__events" aria-label="Injected events">
              {events.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        {error && <p role="alert" className="request__error">{error}</p>}
      </section>
      <ApiPanel />
    </div>
  );
}
