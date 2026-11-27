import { auth } from "./auth";
import type { components, paths } from "./schema";

export type Testbed = components["schemas"]["Testbed"];
export type TestbedList = components["schemas"]["TestbedList"];
export type CapabilityList = components["schemas"]["CapabilityList"];
export type Domain = components["schemas"]["Domain"];
export type Booking = components["schemas"]["Booking"];
export type BookingRequest = components["schemas"]["BookingRequest"];
export type BookingProblem = components["schemas"]["BookingProblem"];
export type Experiment = components["schemas"]["Experiment"];
export type ExperimentRequest = components["schemas"]["ExperimentRequest"];
export type ExperimentEvent = components["schemas"]["ExperimentEvent"];
export type EventAck = components["schemas"]["EventAck"];
export type TelemetryBatch = components["schemas"]["TelemetryBatch"];
export type TelemetrySample = components["schemas"]["TelemetrySample"];
export type TelemetryEvent = components["schemas"]["TelemetryEvent"];
export type ExperimentResults = components["schemas"]["ExperimentResults"];
export type Asset = components["schemas"]["Asset"];
export type AssetVersionList = components["schemas"]["AssetVersionList"];
export type AssetVisibility = components["schemas"]["AssetVisibility"];

// Mock: http://localhost:4010 (Prism). Real gateway: set VITE_API_BASE to ".../v1".
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4010";

export class ApiError extends Error {
  status: number;
  problem?: unknown;
  constructor(status: number, message: string, problem?: unknown) {
    super(message);
    this.status = status;
    this.problem = problem;
  }
}

async function readError(res: Response, method: string, path: string): Promise<ApiError> {
  let problem: unknown;
  try {
    problem = await res.json();
  } catch {
    problem = undefined;
  }
  return new ApiError(res.status, `${res.status} ${res.statusText} on ${method} ${path}`, problem);
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Accept: "application/json", Authorization: `Bearer ${await auth.token()}` };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: await authHeaders() });
  if (!res.ok) throw await readError(res, "GET", path);
  return (await res.json()) as T;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await readError(res, "POST", path);
  return (await res.json()) as T;
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  // No Content-Type header: the browser sets multipart/form-data with the boundary.
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers: await authHeaders(), body: form });
  if (!res.ok) throw await readError(res, "POST", path);
  return (await res.json()) as T;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers: await authHeaders() });
  if (!res.ok) throw await readError(res, "DELETE", path);
}

type ListTestbedsQuery = NonNullable<paths["/testbeds"]["get"]["parameters"]["query"]>;

export const api = {
  // The mock ignores query params and returns the whole catalogue; the client filters.
  listTestbeds: (query?: ListTestbedsQuery) => {
    const qs = new URLSearchParams();
    if (query?.domain?.length) qs.set("domain", query.domain.join(","));
    if (query?.country) qs.set("country", query.country);
    if (query?.status) qs.set("status", query.status);
    const suffix = qs.size ? `?${qs}` : "";
    return get<TestbedList>(`/testbeds${suffix}`);
  },
  getTestbed: (id: string) => get<Testbed>(`/testbeds/${id}`),
  listTestbedCapabilities: (id: string) =>
    get<CapabilityList>(`/testbeds/${id}/capabilities`),

  createBooking: (body: BookingRequest) => post<Booking>("/bookings", body),
  getBooking: (id: string) => get<Booking>(`/bookings/${id}`),
  cancelBooking: (id: string) => del(`/bookings/${id}`),

  createExperiment: (body: ExperimentRequest) => post<Experiment>("/experiments", body),
  getExperiment: (id: string) => get<Experiment>(`/experiments/${id}`),
  startExperiment: (id: string) => post<Experiment>(`/experiments/${id}/start`),
  injectEvent: (id: string, event: ExperimentEvent) => post<EventAck>(`/experiments/${id}/events`, event),
  stopExperiment: (id: string) => post<Experiment>(`/experiments/${id}/stop`),

  // Batch form. The stream form (text/event-stream) is not used by the demo.
  getTelemetry: (id: string, since = 0) =>
    get<TelemetryBatch>(`/experiments/${id}/telemetry${since ? `?since=${since}` : ""}`),
  getResults: (id: string) => get<ExperimentResults>(`/experiments/${id}/results`),

  uploadAsset: (file: File, meta: { name: string; visibility?: AssetVisibility; description?: string }) => {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("name", meta.name);
    if (meta.visibility) form.append("visibility", meta.visibility);
    if (meta.description) form.append("description", meta.description);
    return postForm<Asset>("/assets", form);
  },
  getAsset: (id: string) => get<Asset>(`/assets/${id}`),
  listAssetVersions: (id: string) => get<AssetVersionList>(`/assets/${id}/versions`),
  deleteAsset: (id: string) => del(`/assets/${id}`),
};
