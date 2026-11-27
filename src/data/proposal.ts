import type { BookingRequest, ExperimentEvent, ExperimentRequest } from "../api/client";

/* Scripted content of scene 2. There is no LLM: the assistant's answer is
   written here and matches the example in openapi.yaml. */

export const USER_REQUEST =
  "I want to test a digital twin of a highway construction site, with a robot inspecting a tunnel.";

export const ASSISTANT_REPLY =
  "I found a combination on two testbeds. Sofia Robotics Lab provides a quadruped inspection robot and the site digital twin runtime. Oulu 5G/XR Lab provides a private 5G slice and two headsets to follow the site in VR. Both guarantee the latency and frame rate you need.";

export const PROPOSAL: BookingRequest = {
  purpose: "Test a digital twin of a highway construction site with a robot inspecting a tunnel",
  window: { start: "2027-02-03T09:00:00Z", end: "2027-02-03T11:00:00Z" },
  resources: [
    { testbedId: "tb-sofia-robotics", capabilityId: "cap-quadruped-01", quantity: 1 },
    { testbedId: "tb-sofia-robotics", capabilityId: "cap-dt-engine", quantity: 1 },
    { testbedId: "tb-oulu-5g-xr", capabilityId: "cap-5g-slice", quantity: 1 },
    { testbedId: "tb-oulu-5g-xr", capabilityId: "cap-xr-headset", quantity: 2 },
  ],
  qos: { maxLatencyMs: 20, minFrameRate: 90 },
};

export const CAPABILITY_LABEL: Record<string, string> = {
  "cap-quadruped-01": "Quadruped inspection robot",
  "cap-dt-engine": "Site digital twin runtime",
  "cap-5g-slice": "Private 5G slice",
  "cap-xr-headset": "XR headset",
};

export const EXPERIMENT_REQUEST = (bookingId: string): ExperimentRequest => ({
  bookingId,
  name: "Tunnel inspection with quadruped robot",
  scenario: {
    name: "highway-site-tunnel-inspection",
    assetIds: [],
    parameters: { durationMinutes: 90, inspectionRoute: "tunnel-north", alertZones: ["red-zone-1", "red-zone-2"] },
  },
  steps: [
    { order: 1, testbedId: "tb-sofia-robotics", role: "run-twin", description: "Run the site digital twin and the robot" },
    { order: 2, testbedId: "tb-oulu-5g-xr", role: "stream-xr", description: "Stream the twin to two headsets over the 5G slice" },
  ],
});

export const OBSTACLE_EVENT: ExperimentEvent = {
  type: "obstacle",
  testbedId: "tb-sofia-robotics",
  payload: { location: "tunnel-north-entrance", size: "large" },
};
