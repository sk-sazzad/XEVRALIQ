import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));

import { getToken } from "next-auth/jwt";
import { getAuthToken } from "./api-auth";

const mockGetToken = vi.mocked(getToken);

describe("getAuthToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue(null);
  });

  it("uses __Secure- cookie on https", async () => {
    process.env.NEXTAUTH_URL = "https://example.com";
    await getAuthToken({} as any);
    expect(mockGetToken).toHaveBeenCalledWith(
      expect.objectContaining({ cookieName: "__Secure-authjs.session-token" })
    );
  });

  it("uses plain cookie on http", async () => {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    await getAuthToken({} as any);
    expect(mockGetToken).toHaveBeenCalledWith(
      expect.objectContaining({ cookieName: "authjs.session-token" })
    );
  });
});
