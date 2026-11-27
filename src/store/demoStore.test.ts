import { describe, expect, it } from "vitest";
import type { Testbed } from "../api/client";
import { filterTestbeds, useDemoStore } from "./demoStore";

const tb = (id: string, domains: Testbed["domains"]): Testbed => ({
  id,
  name: id,
  operator: "demo",
  location: { city: "x", country: "XX", lat: 0, lon: 0 },
  domains,
  status: "online",
  engines: [],
  qos: {},
});

describe("filterTestbeds", () => {
  const all = [tb("a", ["xr"]), tb("b", ["robotics", "digital_twin"]), tb("c", ["5g"])];

  it("returns everything when no domain is active", () => {
    expect(filterTestbeds(all, [])).toHaveLength(3);
  });

  it("keeps testbeds offering at least one active domain (OR)", () => {
    expect(filterTestbeds(all, ["xr", "5g"]).map((t) => t.id)).toEqual(["a", "c"]);
  });
});

describe("demo store reset", () => {
  it("clears the request flow but keeps the theme", () => {
    const s = useDemoStore.getState();
    s.setTheme("contrast");
    s.setRequestPhase("booked");
    s.setBooking({ id: "bk-1", status: "confirmed", window: { start: "", end: "" }, resources: [], createdAt: "" });
    s.reset();
    const after = useDemoStore.getState();
    expect(after.theme).toBe("contrast");
    expect(after.requestPhase).toBe("idle");
    expect(after.booking).toBeNull();
  });
});
