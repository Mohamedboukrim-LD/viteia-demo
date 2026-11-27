# VITEIA demo – kick-off video and PoC seed

Web app that shows a user working on the VITEIA TaaS portal, with the API call
visible at every step. Everything is simulated except the OpenAPI specification,
which is the first draft of the T3.3 work (deliverable D3.3).

All testbed data is fictional demo data. It does not describe any real partner facility.

## Run

```bash
npm install
npm run mock      # Prism mock server on http://localhost:4010, from openapi/openapi.yaml
npm run dev       # Vite on http://localhost:5173
```

`npm run gen:api` regenerates `src/api/schema.d.ts` from the spec (also run by `npm run build`).
Copy `.env.example` to `.env` to point the client at another API base URL.

## Check

```bash
npm run lint:api  # Spectral: the spec is valid OpenAPI and follows the house rules (.spectral.yaml)
npm test          # Vitest: client and store logic
```

Run both before sending a tranche for review.

## Recording mode

Every scene is a route. The space bar runs the next step of the current scene
(steps are listed in `src/director/steps.ts`); the last step moves to the next
scene. `R` resets the demo and goes back to scene 1. In dev mode the top bar
shows the next step. Captions are added in editing, not in the app.

## Structure

```
openapi/openapi.yaml      the specification (the only real piece)
src/api/client.ts         single entry point for every API call, typed from the spec
src/store/demoStore.ts    demo state shared across scenes
src/director/             recording steps and the space-bar hook
src/api/log.ts            log of the API calls made, shown by the API panel
src/telemetry/useReplay.ts replays a telemetry batch in real time
src/data/proposal.ts      scripted content of scenes 2 and 3 (no LLM)
src/scenes/               one component per scene (route)
src/components/           map, filters, list, assistant chat, API panel, 3D scene, telemetry panel, API docs
src/styles/tokens.css     temporary design tokens, to be replaced by the final design
```

## How the work is organised

- Front end and back end: LD dev team.
- Design: Nastya. Until her design lands, `tokens.css` holds a temporary one;
  components only use those variables, so the swap is a change of values.
- Each API tranche is checked against the product scope before the next one starts.
- Final confirmation of the API: Ali (senior front end). Doubts on the API go to him.

## Tranches

| # | Category | Spec | Mock | Scene | Status |
|---|----------|------|------|-------|--------|
| 1 | testbeds | done | done | Catalogue (scene 1) | tested |
| 2 | bookings | done | done | Request (scene 2) | tested |
| 3 | experiments | done | done | Request (scene 2), Digital twin (scene 3) | tested |
| 4 | telemetry, results | done | done | Digital twin (scene 3), Results (scene 4) | tested |
| 5 | assets | done | done | Request (scene 2, one line) | ready for review |
| 6 | identity | | | none | |

## Decisions taken in tranche 1

- The version lives in the server URL (`/v1`), not in the paths. Prism matches
  raw paths, so the mock server URL has no prefix.
- The mock ignores query filters and returns the whole catalogue; the client filters.
- Errors use RFC 9457 problem details.
- TypeScript is pinned to 5.x because `openapi-typescript` does not support 7.x yet.

## Decisions taken in tranche 2

- A booking reserves capabilities on one or more testbeds for a time window.
  An experiment (tranche 3) runs inside a confirmed booking. Separate resources,
  because a booking can exist without an experiment (reserved, then cancelled).
- The user sends a `QoSRequirement` (what they need); each allocation answers
  with a `guaranteedQos` (what the testbed commits to). A multi-testbed booking
  is confirmed only if every part is satisfiable; otherwise 422 with `violations`.
- Capability ids come from `GET /testbeds/{id}/capabilities`; the booking
  request references them, it does not describe hardware again.
- Scene 2 is driven by a `requestPhase` in the store so the director can
  replay it identically; the assistant's text is scripted in `src/data/proposal.ts`.

## Decisions taken in tranche 3

- An experiment belongs to one confirmed booking and can only reference the
  booking's testbeds. `steps` describe the multi-testbed workflow (order,
  testbed, role); the federation orchestrates them.
- Lifecycle as sub-resources, not status patches: `POST /start`, `/stop`,
  `/events`. Each returns 202 because the federation forwards the request to
  the testbeds and confirms asynchronously.
- Events are stimuli the user sends into the scenario (obstacle, network
  degradation). Alarms detected by the testbeds come back on the telemetry
  stream (tranche 4), not through this endpoint.
- Every call the portal makes goes through `tracked()` in `src/api/log.ts`, so
  the API panel shows the full history of the session.

## Decisions taken in tranche 4

- Telemetry has two forms on one endpoint: a stream (`text/event-stream`) while
  the experiment runs, and a batch (`application/json`, `since=`) to replay. The
  demo uses the batch and replays it in real time with `useReplay`; the sample
  times live in the spec example, not in the app.
- Events in telemetry are what the testbeds detect (zone violation, robot
  stopped, zone cleared); they are distinct from events the user injects. An
  alarm stays active until a `-cleared` event follows.
- Results aggregate the telemetry per testbed and overall, and state whether
  the QoS requested in the booking was met.
- The 3D scene is built from primitives; each part is a component so a GLB
  model can replace it with drei's `useGLTF`. Models are a separate decision.
- The documentation page is Swagger UI reading `openapi.yaml` itself, loaded
  only when the last step of scene 4 is reached.

## Decisions taken in tranche 5

- Assets are glTF 2.0 only (`.glb` or `.gltf`, no external references), so
  every engine of every testbed can load them. Upload is multipart; the
  federation validates and converts, and the status moves from `processing`
  to `ready`.
- Versions: a new upload with the same `name` creates a new version; an
  experiment records the version it used.
- Visibility decides which testbeds may read the file: `private`, `booking`
  (the testbeds of the bookings the asset is used in, for their duration) or
  `federation`.
- In the demo the file is a 16-byte placeholder named `tunnel_entrance_v3.glb`;
  the mock accepts any upload. The experiment request references the asset id
  in `scenario.assetIds`.
