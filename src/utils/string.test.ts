import { describe, it, expect } from "vitest";
import { prepareString } from "./string.js";

describe("prepareString", () => {
  it("strips trailing null bytes", () => {
    expect(prepareString("hello\x00\x00\x00")).toBe("hello");
  });

  it("returns the string unchanged if no null bytes", () => {
    expect(prepareString("hello")).toBe("hello");
  });

  it("strips from the first null byte onward", () => {
    expect(prepareString("ab\x00cd\x00")).toBe("ab");
  });

  it("returns empty string if input is empty", () => {
    expect(prepareString("")).toBe("");
  });

  it("returns empty string when only null bytes (leading null)", () => {
    expect(prepareString("\x00\x00\x00")).toBe("\x00\x00\x00");
  });

  it("handles single-character strings", () => {
    expect(prepareString("A")).toBe("A");
    expect(prepareString("A\x00")).toBe("A");
  });

  it("handles unicode content before null bytes", () => {
    expect(prepareString("café\x00\x00")).toBe("café");
  });
});
