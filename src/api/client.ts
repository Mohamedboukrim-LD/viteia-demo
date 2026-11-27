import type { components, paths } from "./schema";

export type Testbed = components["schemas"]["Testbed"];
export type TestbedList = components["schemas"]["TestbedList"];
export type CapabilityList = components["schemas"]["CapabilityList"];
export type Domain = components["schemas"]["Domain"];
export type Booking = components["schemas"]["Booking"];
export type BookingRequest = components["schemas"]["BookingRequest"];
export type BookingProblem = components["schemas"]["BookingProblem"];

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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await readError(res, "GET", path);
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await readError(res, "POST", path);
  return (await res.json()) as T;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
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
};
