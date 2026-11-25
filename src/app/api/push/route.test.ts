import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendNotice = vi.fn(async () => 2);
vi.mock("@/lib/push", () => ({ sendNotice }));

const { POST } = await import("./route");

const call = (headers: Record<string, string>, body: unknown) =>
  POST(new Request("https://app.example/api/push", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
const insert = { type: "INSERT", table: "notifications", record: { id: 1, user_id: "u1", project_id: "p1", kind: "shared", title: "Ama shared Lookbook with you", body: "" } };

describe("POST /api/push", () => {
  beforeEach(() => {
    vi.stubEnv("PUSH_WEBHOOK_SECRET", "s3cret-value");
    sendNotice.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("refuses calls without the secret, or with a wrong one", async () => {
    expect((await call({}, insert)).status).toBe(401);
    expect((await call({ "x-nia-push-secret": "s3cret-valuE" }, insert)).status).toBe(401);
    expect((await call({ "x-nia-push-secret": "short" }, insert)).status).toBe(401);
    expect(sendNotice).not.toHaveBeenCalled();
  });

  it("refuses everything when no secret is set on the server", async () => {
    vi.stubEnv("PUSH_WEBHOOK_SECRET", "");
    expect((await call({ "x-nia-push-secret": "" }, insert)).status).toBe(401);
  });

  it("sends a new notification", async () => {
    const res = await call({ "x-nia-push-secret": "s3cret-value" }, insert);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 2 });
    expect(sendNotice).toHaveBeenCalledWith(insert.record);
  });

  it("ignores anything that isn't a new notification", async () => {
    expect((await call({ "x-nia-push-secret": "s3cret-value" }, { ...insert, type: "UPDATE" })).status).toBe(204);
    expect((await call({ "x-nia-push-secret": "s3cret-value" }, { ...insert, table: "activity" })).status).toBe(204);
    expect(sendNotice).not.toHaveBeenCalled();
  });
});
