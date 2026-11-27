import "./ApiPanel.css";

export type ApiCall = {
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: string;
  request?: unknown;
  response?: { status: number; body: unknown } | null;
  pending?: boolean;
};

type Props = { call: ApiCall | null };

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function ApiPanel({ call }: Props) {
  return (
    <section className="api" aria-label="API call" aria-live="polite">
      <h2 className="api__title">Behind the portal</h2>
      {!call ? (
        <p className="api__empty">Every action in the portal is an API call. It will appear here.</p>
      ) : (
        <>
          <p className="api__line">
            <span className={`api__method api__method--${call.method.toLowerCase()}`}>{call.method}</span>
            <code>{call.path}</code>
          </p>
          {call.request !== undefined && (
            <pre className={`api__body${call.response ? " api__body--collapsed" : ""}`}>
              <span className="api__label">Request</span>
              {pretty(call.request)}
            </pre>
          )}
          {call.pending && <p className="api__pending">Waiting for the federation…</p>}
          {call.response && (
            <pre className="api__body api__body--response">
              <span className="api__label">Response {call.response.status}</span>
              {pretty(call.response.body)}
            </pre>
          )}
        </>
      )}
    </section>
  );
}
