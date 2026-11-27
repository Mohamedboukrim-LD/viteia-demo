import { beforeEach, describe, expect, it } from "vitest";
import { tracked, useApiLog } from "./log";

beforeEach(() => useApiLog.getState().clear());

describe("tracked", () => {
  it("records request, then response with the declared status", async () => {
    const body = await tracked({ method: "POST", path: "/bookings", request: { a: 1 } }, 201, async () => ({ id: "bk-1" }));
    expect(body).toEqual({ id: "bk-1" });
    const [call] = useApiLog.getState().calls;
    expect(call.pending).toBe(false);
    expect(call.response).toEqual({ status: 201, body: { id: "bk-1" } });
    expect(call.request).toEqual({ a: 1 });
  });

  it("records the error and rethrows", async () => {
    await expect(
      tracked({ method: "POST", path: "/experiments/x/stop" }, 202, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    const [call] = useApiLog.getState().calls;
    expect(call.error).toBe("boom");
    expect(call.response).toBeNull();
  });
});
