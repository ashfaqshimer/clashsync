import { describe, expect, it } from "vitest";
import { normalizeTag, tagToSlug } from "./tags";

describe("normalizeTag", () => {
  it("adds the # and uppercases", () => {
    expect(normalizeTag("pql2vgu8")).toBe("#PQL2VGU8");
  });

  it("keeps an existing # and trims whitespace", () => {
    expect(normalizeTag("  #PQL2VGU8 \n")).toBe("#PQL2VGU8");
  });

  it("maps the letter O to zero", () => {
    expect(normalizeTag("#P0O2")).toBe("#P002");
  });

  it("decodes URL-encoded tags", () => {
    expect(normalizeTag("%23PQL2VGU8")).toBe("#PQL2VGU8");
  });

  it("survives a malformed percent sequence", () => {
    expect(normalizeTag("%E0")).toBeNull();
  });

  it("rejects characters that never appear in tags", () => {
    expect(normalizeTag("#SAMPLE")).toBeNull();
    expect(normalizeTag("#ABC123")).toBeNull();
  });

  it("rejects empty, too short and too long tags", () => {
    expect(normalizeTag(undefined)).toBeNull();
    expect(normalizeTag("")).toBeNull();
    expect(normalizeTag("#PY")).toBeNull();
    expect(normalizeTag("#" + "P".repeat(13))).toBeNull();
  });
});

describe("tagToSlug", () => {
  it("strips the leading #", () => {
    expect(tagToSlug("#PQL2VGU8")).toBe("PQL2VGU8");
  });
});
