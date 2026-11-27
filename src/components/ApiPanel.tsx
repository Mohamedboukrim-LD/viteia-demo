import type { ApiCall } from "../api/log";
import { useApiLog } from "../api/log";
import "./ApiPanel.css";

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function Line({ call }: { call: ApiCall }) {
  return (
    <p className="api__line">
      <span className={`api__method api__method--${call.method.toLowerCase()}`}>{call.method}</span>
      <code>/v1{call.path}</code>
      {call.response && <span className="api__status">{call.response.status}</span>}
      {call.error && <span className="api__status api__status--error">error</span>}
      {call.pending && <span className="api__status">…</span>}
    </p>
  );
}

export function ApiPanel() {
  const calls = useApiLog((s) => s.calls);
  const last = calls[calls.length - 1];
  const previous = calls.slice(0, -1);

  return (
    <section className="api" aria-label="API calls" aria-live="polite">
      <h2 className="api__title">Behind the portal</h2>
      {!last ? (
        <p className="api__empty">Every action in the portal is an API call. It will appear here.</p>
      ) : (
        <>
          {previous.length > 0 && (
            <div className="api__history">
              {previous.map((c) => (
                <Line key={c.id} call={c} />
              ))}
            </div>
          )}
          <Line call={last} />
          {last.request !== undefined && (
            <pre className={`api__body${last.response ? " api__body--collapsed" : ""}`}>
              <span className="api__label">Request</span>
              {pretty(last.request)}
            </pre>
          )}
          {last.pending && <p className="api__pending">Waiting for the federation…</p>}
          {last.error && <p className="api__pending">{last.error}</p>}
          {last.response && (
            <pre className="api__body api__body--response">
              <span className="api__label">Response {last.response.status}</span>
              {pretty(last.response.body)}
            </pre>
          )}
        </>
      )}
    </section>
  );
}
