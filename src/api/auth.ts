import type { components } from "./schema";

type TokenResponse = components["schemas"]["TokenResponse"];

/* Federation token. Obtained once, silently, before the first call: there is
   no sign-in scene in the demo. The mock accepts any credentials. */

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4010";

let token: string | null = null;
let pending: Promise<string> | null = null;

export const auth = {
  async token(): Promise<string> {
    if (token) return token;
    if (!pending) {
      pending = fetch(`${BASE}/auth/token`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          grantType: "federated",
          idToken: "demo",
          scope: "testbeds:read bookings:write experiments:write telemetry:read results:read assets:write",
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`${res.status} on POST /auth/token`);
          const body = (await res.json()) as TokenResponse;
          token = body.accessToken;
          return token;
        })
        .finally(() => {
          pending = null;
        });
    }
    return pending;
  },
  // Tests set a token directly; the demo never calls this.
  set(value: string | null) {
    token = value;
  },
};
