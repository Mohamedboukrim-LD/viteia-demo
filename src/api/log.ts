import { create } from "zustand";

/* Log of the API calls the portal makes. The API panel renders it: the last
   call expanded, the previous ones as one line each. Scenes push into it
   through `tracked()`, so every real call is shown with its request and
   response bodies. */

export type ApiCall = {
  id: string;
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: string;
  request?: unknown;
  response: { status: number; body: unknown } | null;
  error: string | null;
  pending: boolean;
};

type ApiLogState = {
  calls: ApiCall[];
  begin: (call: Pick<ApiCall, "method" | "path" | "request">) => string;
  finish: (id: string, status: number, body: unknown) => void;
  fail: (id: string, error: string) => void;
  clear: () => void;
};

let counter = 0;

export const useApiLog = create<ApiLogState>((set) => ({
  calls: [],
  begin: (call) => {
    const id = `call-${++counter}`;
    set((s) => ({ calls: [...s.calls, { ...call, id, response: null, error: null, pending: true }] }));
    return id;
  },
  finish: (id, status, body) =>
    set((s) => ({
      calls: s.calls.map((c) => (c.id === id ? { ...c, pending: false, response: { status, body } } : c)),
    })),
  fail: (id, error) =>
    set((s) => ({ calls: s.calls.map((c) => (c.id === id ? { ...c, pending: false, error } : c)) })),
  clear: () => set({ calls: [] }),
}));

/* Runs an API call and records it. `status` is the success code of the
   operation in openapi.yaml; the mock does not expose it to the client. */
export async function tracked<T>(
  call: Pick<ApiCall, "method" | "path" | "request">,
  status: number,
  run: () => Promise<T>,
): Promise<T> {
  const { begin, finish, fail } = useApiLog.getState();
  const id = begin(call);
  try {
    const body = await run();
    finish(id, status, body);
    return body;
  } catch (e) {
    fail(id, e instanceof Error ? e.message : String(e));
    throw e;
  }
}
