import type { components, paths } from "./schema";

export type Testbed = components["schemas"]["Testbed"];
export type TestbedList = components["schemas"]["TestbedList"];
export type CapabilityList = components["schemas"]["CapabilityList"];
export type Domain = components["schemas"]["Domain"];

// Mock: http://localhost:4010 (Prism). Real gateway: set VITE_API_BASE to ".../v1".
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4010";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText} on GET ${path}`);
  }
  return (await res.json()) as T;
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
};
