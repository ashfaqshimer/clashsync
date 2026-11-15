import { describe, expect, it } from "vitest";
import { openWebhookUrl, sealWebhookUrl } from "./secrets";

const URL = "https://discord.com/api/webhooks/123456/abcdefghijklmnopqrstuvwxyz";

describe("webhook URL encryption", () => {
  it("round-trips and doesn't store the URL in the clear", async () => {
    const sealed = await sealWebhookUrl(URL);
    expect(sealed).not.toContain("discord.com");
    expect(await openWebhookUrl(sealed)).toBe(URL);
  });

  it("returns null for values it can't decrypt", async () => {
    expect(await openWebhookUrl(URL)).toBeNull();
    expect(await openWebhookUrl("deadbeef")).toBeNull();
  });
});
