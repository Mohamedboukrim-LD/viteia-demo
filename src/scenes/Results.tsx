import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { api, ApiError, type ExperimentResults } from "../api/client";
import { tracked } from "../api/log";
import { ApiPanel } from "../components/ApiPanel";
import { useDemoStore } from "../store/demoStore";
import "./Results.css";

// Swagger UI is heavy; it loads only when the documentation step is reached.
const ApiDocs = lazy(() => import("../components/ApiDocs"));

const unreachable = (e: unknown) =>
  e instanceof ApiError ? e.message : "The API is not reachable. Start the mock with `npm run mock`.";

function Big({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="results__big">
      <span className="results__value">
        {value}
        {unit && <small> {unit}</small>}
      </span>
      <span className="results__label">{label}</span>
    </div>
  );
}

export function Results() {
  const experiment = useDemoStore((s) => s.experiment);
  const testbeds = useDemoStore((s) => s.testbeds);
  const showDocs = useDemoStore((s) => s.showDocs);
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestedFor = useRef<string | null>(null);

  const nameOf = (id: string) => testbeds.find((t) => t.id === id)?.name ?? id;

  // GET /experiments/{id}/results on entering the scene.
  useEffect(() => {
    // The ref makes this run once even under StrictMode's double effect, so
    // the result must not be discarded on cleanup.
    if (!experiment || results || requestedFor.current === experiment.id) return;
    requestedFor.current = experiment.id;
    tracked({ method: "GET", path: `/experiments/${experiment.id}/results` }, 200, () =>
      api.getResults(experiment.id),
    )
      .then((r) => setResults(r))
      .catch((e: unknown) => setError(unreachable(e)));
  }, [experiment, results]);

  if (!experiment) {
    return (
      <div className="placeholder">
        <p>No experiment to report on.</p>
        <p>Press R to restart the demo.</p>
      </div>
    );
  }

  // Conformance of the testbeds used, from the catalogue (tranche 1).
  // The suite is the same for every testbed: show it once, with the lowest score.
  const used = testbeds.filter((t) => experiment.testbedIds.includes(t.id) && t.conformance);
  const total = used.length ? Math.max(...used.map((t) => t.conformance?.total ?? 0)) : 0;
  const passed = used.length ? Math.min(...used.map((t) => t.conformance?.passed ?? 0)) : 0;

  return (
    <div className="results">
      <section className="results__main" aria-label="Results">
        <header className="results__header">
          <h2 className="results__name">{experiment.name}</h2>
          <p className="results__meta">
            {experiment.id} · {experiment.testbedIds.map(nameOf).join(" + ")}
          </p>
        </header>

        {error && <p role="alert" className="request__error">{error}</p>}

        {results && (
          <>
            <div className="results__bigs">
              <Big label="Average latency" value={results.metrics.avgLatencyMs} unit="ms" />
              <Big label="Availability" value={results.metrics.availabilityPct} unit="%" />
              <Big label="Events detected" value={results.metrics.eventsDetected} />
              <Big label="Requested QoS" value={results.qosMet ? "met" : "not met"} />
            </div>

            <table className="results__table">
              <caption>Per testbed</caption>
              <thead>
                <tr>
                  <th scope="col">Testbed</th>
                  <th scope="col">Avg latency</th>
                  <th scope="col">Availability</th>
                  <th scope="col">Events</th>
                </tr>
              </thead>
              <tbody>
                {results.perTestbed.map((r) => (
                  <tr key={r.testbedId}>
                    <th scope="row">{nameOf(r.testbedId)}</th>
                    <td>{r.avgLatencyMs} ms</td>
                    <td>{r.availabilityPct} %</td>
                    <td>{r.eventsDetected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {total > 0 && (
          <div className="results__conformance" aria-label="Conformance">
            <span className="results__value">
              {passed}/{total}
            </span>
            <span className="results__label">
              Conformance test suite, passed by {used.length === 1 ? "the testbed" : `each of the ${used.length} testbeds`} used.
              Any testbed that passes it joins the network.
            </span>
          </div>
        )}
      </section>

      <div className="results__side">
        {showDocs ? (
          <Suspense fallback={<p className="placeholder">Loading the API documentation…</p>}>
            <ApiDocs />
          </Suspense>
        ) : (
          <ApiPanel />
        )}
      </div>
    </div>
  );
}
