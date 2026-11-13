import { describe, expect, it } from "vitest";
import { normalizeTag, tagToSlug } from "./tags";

describe("normalizeTag", () => {
  it("adds the # and uppercases", () => {
    expect(normalizeTag("r8l9r2gvg")).toBe("#R8L9R2GVG");
  });

  it("keeps an existing # and trims whitespace", () => {
    expect(normalizeTag("  #R8L9R2GVG \n")).toBe("#R8L9R2GVG");
  });

  it("maps the letter O to zero", () => {
    expect(normalizeTag("#P0O2")).toBe("#P002");
  });

  it("decodes URL-encoded tags", () => {
    expect(normalizeTag("%23R8L9R2GVG")).toBe("#R8L9R2GVG");
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
    expect(tagToSlug("#R8L9R2GVG")).toBe("R8L9R2GVG");
  });
});
