import { describe, expect, it } from "vitest";
import { publicSiteUrl } from "../../apps/site/src/lib/public-url";

describe("canonical public links", () => {
  it("builds no-port HTTPS links that do not inherit a stale browser port", () => {
    const toolUrl = publicSiteUrl("/msme-45-day-payment-due-date-calculator");

    expect(toolUrl).toBe(
      "https://tools.complyeaze.com/msme-45-day-payment-due-date-calculator",
    );
    expect(new URL(toolUrl, "https://tools.complyeaze.com:8080/").href).toBe(toolUrl);
  });
});
