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
  // Tranche 2+: "/request", "/twin", "/results"
};
