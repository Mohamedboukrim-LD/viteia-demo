import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "./auth";
import { api, ApiError } from "./client";
import { EXPERIMENT_REQUEST, PROPOSAL } from "../data/proposal";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => auth.set("test-token"));
afterEach(() => vi.restoreAllMocks());

describe("authentication", () => {
  it("sends the federation token as a bearer on every call", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse(200, { items: [], total: 0 }));
    await api.listTestbeds();
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token");
  });

  it("obtains the token once before the first call when none is set", async () => {
    auth.set(null);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).endsWith("/auth/token")
        ? jsonResponse(200, { accessToken: "fresh", tokenType: "Bearer", expiresIn: 3600 })
        : jsonResponse(200, { items: [], total: 0 }),
    );
    await api.listTestbeds();
    await api.listTestbeds();
    const paths = fetchMock.mock.calls.map(([u]) => String(u));
    expect(paths.filter((p) => p.endsWith("/auth/token"))).toHaveLength(1);
    expect((fetchMock.mock.calls[2][1]?.headers as Record<string, string>).Authorization).toBe("Bearer fresh");
  });
});

describe("api.createBooking", () => {
  it("posts the booking request as JSON and returns the booking", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(201, { id: "bk-1", status: "confirmed" }),
    );
    const booking = await api.createBooking(PROPOSAL);
    expect(booking.id).toBe("bk-1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/bookings$/);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(PROPOSAL);
  });

  it("throws an ApiError carrying the problem body on 422", async () => {
    // A Response body can be read once: build a fresh one per call.
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(422, { title: "Requested QoS cannot be guaranteed", status: 422, violations: [] }),
    );
    await expect(api.createBooking(PROPOSAL)).rejects.toMatchObject({ status: 422 });
    try {
      await api.createBooking(PROPOSAL);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).problem).toMatchObject({ status: 422 });
    }
  });
});

describe("api experiments", () => {
  it("creates an experiment inside a booking", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(201, { id: "ex-1", status: "created" }),
    );
    const request = EXPERIMENT_REQUEST("bk-1", ["as-1"]);
    const created = await api.createExperiment(request);
    expect(created.status).toBe("created");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/experiments$/);
    expect(JSON.parse(String(init?.body)).bookingId).toBe("bk-1");
  });

  it("starts and stops without a body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(202, { id: "ex-1", status: "running" }),
    );
    await api.startExperiment("ex-1");
    await api.stopExperiment("ex-1");
    const paths = fetchMock.mock.calls.map(([u]) => String(u));
    expect(paths[0]).toMatch(/\/experiments\/ex-1\/start$/);
    expect(paths[1]).toMatch(/\/experiments\/ex-1\/stop$/);
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });
});

describe("api.uploadAsset", () => {
  it("sends multipart form data with the file and its metadata", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse(201, { id: "as-1", status: "processing" }),
    );
    const file = new File([new Uint8Array(4)], "scene.glb", { type: "model/gltf-binary" });
    const asset = await api.uploadAsset(file, { name: "scene", visibility: "booking" });
    expect(asset.id).toBe("as-1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/assets$/);
    const form = init?.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect((form.get("file") as File).name).toBe("scene.glb");
    expect(form.get("name")).toBe("scene");
    expect(form.get("visibility")).toBe("booking");
    // The browser must set the multipart boundary itself.
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });
});
