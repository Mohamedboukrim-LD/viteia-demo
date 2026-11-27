import { useDemoStore } from "../store/demoStore";

/* Every scene is a route. Each press of the space bar runs the next step of the
   current scene; the last step of a scene navigates to the next route.
   Steps live here, not in components, so the recording order is in one place. */

export type Step = {
  label: string;
  run: (navigate: (to: string) => void) => void;
};

export const SCENE_ORDER = ["/catalog", "/request", "/twin", "/results"] as const;

export const steps: Record<string, Step[]> = {
  "/catalog": [
    {
      label: "Turn on high contrast",
      run: () => useDemoStore.getState().setTheme("contrast"),
    },
    {
      label: "Back to default theme",
      run: () => useDemoStore.getState().setTheme("default"),
    },
    {
      label: "Filter: digital twin",
      run: () => useDemoStore.getState().setDomains(["digital_twin"]),
    },
    {
      label: "Filter: digital twin + robotics",
      run: () => useDemoStore.getState().setDomains(["digital_twin", "robotics"]),
    },
    {
      label: "Go to the request scene",
      run: (navigate) => navigate("/request"),
    },
  ],
  "/request": [
    {
      label: "Type the request",
      run: () => useDemoStore.getState().setRequestPhase("typing"),
    },
    {
      label: "Assistant proposes two testbeds",
      run: () => useDemoStore.getState().setRequestPhase("proposed"),
    },
    {
      label: "Book the resources (POST /bookings)",
      run: () => useDemoStore.getState().setRequestPhase("booking"),
    },
    {
      label: "Create and start the experiment (POST /experiments, /start)",
      run: () => useDemoStore.getState().setRequestPhase("starting"),
    },
    {
      label: "Go to the digital twin",
      run: (navigate) => navigate("/twin"),
    },
  ],
  "/twin": [
    {
      label: "Inject an obstacle in the tunnel (POST /events)",
      run: () => useDemoStore.getState().setTwinPhase("event"),
    },
    {
      label: "Stop the experiment (POST /stop)",
      run: () => useDemoStore.getState().setTwinPhase("stopping"),
    },
    {
      label: "Go to the results",
      run: (navigate) => navigate("/results"),
    },
  ],
  // Tranche 4: "/results"
};
