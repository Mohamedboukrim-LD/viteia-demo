import { useEffect, useMemo, useRef, useState } from "react";
import type { TelemetryEvent, TelemetrySample } from "../api/client";

/* Replays a telemetry batch in real time: `t` seconds after the replay
   starts, the sample with that `t` is "received". While `running` is false the
   clock stops, so a stopped experiment freezes on its last sample. */

export type ReplayEvent = TelemetryEvent & { t: number; testbedId: string };

export type ReplayState = {
  t: number;
  latest: Record<string, TelemetrySample | undefined>;
  events: ReplayEvent[];
  alarm: ReplayEvent | null;
  finished: boolean;
};

export function useReplay(samples: TelemetrySample[] | null, running: boolean, tickMs = 100): ReplayState {
  const [t, setT] = useState(0);
  const startedAt = useRef<number | null>(null);
  const elapsedBeforePause = useRef(0);

  useEffect(() => {
    if (!samples) return;
    if (!running) {
      if (startedAt.current !== null) {
        elapsedBeforePause.current += (performance.now() - startedAt.current) / 1000;
        startedAt.current = null;
      }
      return;
    }
    startedAt.current = performance.now();
    const id = window.setInterval(() => {
      if (startedAt.current === null) return;
      setT(elapsedBeforePause.current + (performance.now() - startedAt.current) / 1000);
    }, tickMs);
    return () => window.clearInterval(id);
  }, [samples, running, tickMs]);

  return useMemo(() => aggregate(samples, t), [samples, t]);
}

/* What has been received at time t, and what it means. Pure, so it is tested. */
export function aggregate(samples: TelemetrySample[] | null, t: number): ReplayState {
  const received = (samples ?? []).filter((s) => s.t <= t);
  const latest: ReplayState["latest"] = {};
  const events: ReplayEvent[] = [];
  for (const s of received) {
    latest[s.testbedId] = s;
    for (const e of s.events ?? []) events.push({ ...e, t: s.t, testbedId: s.testbedId });
  }
  // An alarm stays active until a "-cleared" event follows it.
  let alarm: ReplayEvent | null = null;
  for (const e of events) {
    if (e.severity === "alarm") alarm = e;
    if (e.type.endsWith("-cleared")) alarm = null;
  }
  const last = samples?.length ? samples[samples.length - 1].t : 0;
  return { t, latest, events, alarm, finished: samples !== null && t >= last };
}
