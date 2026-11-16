import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

vi.mock("@/lib/db", () => ({
  db: {
    connectedAccount: { findUnique: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    message: { upsert: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/events", () => ({ notifyNewMessage: vi.fn() }));
vi.mock("@/lib/download-media", () => ({ downloadMedia: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/push", () => ({ sendPushToAll: vi.fn() }));

import { db } from "@/lib/db";
import { POST } from "./route";

const PAGE_ID = "PAGE_1";
const SENDER_ID = "USER_1";
const SECRET = "test-secret";

function makeRequest(body: object) {
  const raw = JSON.stringify(body);
  const sig = "sha256=" + createHmac("sha256", SECRET).update(raw).digest("hex");
  return new Request("http://localhost/api/meta/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "x-hub-signature-256": sig },
    body: raw,
  }) as unknown as import("next/server").NextRequest;
}

function makePayload(msgOverrides: object = {}) {
  return {
    object: "page",
    entry: [{
      id: PAGE_ID,
      messaging: [{
        sender: { id: SENDER_ID },
        recipient: { id: PAGE_ID },
        timestamp: 1700000000000,
        message: { mid: "mid_1", text: "hello", ...msgOverrides },
      }],
    }],
  };
}

describe("webhook POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_APP_SECRET = SECRET;

    vi.mocked(db.connectedAccount.findUnique).mockResolvedValue({
      id: "acc-1", pageId: PAGE_ID, platform: "FACEBOOK", accessToken: "tok",
    } as any);
    vi.mocked(db.conversation.findUnique).mockResolvedValue(null);
    vi.mocked(db.conversation.create).mockResolvedValue({
      id: "convo-1", customerId: SENDER_ID, customerName: null, status: "OPEN",
    } as any);
    vi.mocked(db.message.upsert).mockResolvedValue({} as any);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ participants: { data: [] } }] }),
    }));
  });

  it("saves INCOMING direction for a normal customer message", async () => {
    const res = await POST(makeRequest(makePayload()));
    expect(res.status).toBe(200);
    expect(vi.mocked(db.message.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ direction: "INCOMING" }) })
    );
  });

  it("saves OUTGOING direction for an echo (agent-sent) message", async () => {
    const payload = {
      object: "page",
      entry: [{
        id: PAGE_ID,
        messaging: [{
          sender: { id: PAGE_ID },
          recipient: { id: SENDER_ID },
          timestamp: 1700000000000,
          message: { mid: "mid_echo", text: "agent reply", is_echo: true },
        }],
      }],
    };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(vi.mocked(db.message.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ direction: "OUTGOING" }) })
    );
  });

  it("does not save a Facebook system notification", async () => {
    const res = await POST(makeRequest(makePayload({ text: "replied to your automated welcome message" })));
    expect(res.status).toBe(200);
    expect(vi.mocked(db.message.upsert)).not.toHaveBeenCalled();
  });
});
