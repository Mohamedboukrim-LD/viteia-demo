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
src/scenes/               one component per scene (route)
src/components/           map, filters, list
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
| 1 | testbeds | done | done | Catalogue (scene 1) | ready for review |
| 2 | bookings | | | Request (scene 2) | |
| 3 | experiments | | | Request (scene 2) | |
| 4 | telemetry, results | | | Digital twin (scene 3), Results (scene 4) | |
| 5 | assets | | | Request (scene 2, one line) | |
| 6 | identity | | | none | |

## Decisions taken in tranche 1

- The version lives in the server URL (`/v1`), not in the paths. Prism matches
  raw paths, so the mock server URL has no prefix.
- The mock ignores query filters and returns the whole catalogue; the client filters.
- Errors use RFC 9457 problem details.
- TypeScript is pinned to 5.x because `openapi-typescript` does not support 7.x yet.
