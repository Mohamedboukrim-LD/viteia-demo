import { describe, expect, it } from "vitest";
import type { TelemetrySample } from "../api/client";
import { aggregate } from "./useReplay";

const samples: TelemetrySample[] = [
  { t: 0, testbedId: "a", metrics: { latencyMs: 10 } },
  { t: 0, testbedId: "b", metrics: { frameRate: 90 } },
  { t: 2, testbedId: "a", metrics: { latencyMs: 12 }, events: [{ type: "zone-violation", severity: "alarm", message: "in" }] },
  { t: 4, testbedId: "a", metrics: { latencyMs: 11 }, events: [{ type: "zone-cleared", severity: "info", message: "out" }] },
];

describe("aggregate", () => {
  it("keeps the latest sample per testbed up to t", () => {
    const s = aggregate(samples, 2.5);
    expect(s.latest.a?.metrics.latencyMs).toBe(12);
    expect(s.latest.b?.metrics.frameRate).toBe(90);
    expect(s.events).toHaveLength(1);
  });

  it("raises the alarm at the violation and lowers it at the cleared event", () => {
    expect(aggregate(samples, 1).alarm).toBeNull();
    expect(aggregate(samples, 2).alarm?.type).toBe("zone-violation");
    expect(aggregate(samples, 4).alarm).toBeNull();
    expect(aggregate(samples, 4).finished).toBe(true);
  });

  it("handles no batch", () => {
    const s = aggregate(null, 5);
    expect(s.events).toEqual([]);
    expect(s.finished).toBe(false);
  });
});
