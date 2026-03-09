import { describe, it, expect } from "vitest";
import { zeroAddress, oneAddress } from "./account.js";

describe("account constants", () => {
  it("zeroAddress is a valid 58-character Algorand address", () => {
    expect(zeroAddress).toHaveLength(58);
    expect(zeroAddress).toBe(
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
    );
  });

  it("oneAddress is a valid 58-character Algorand address", () => {
    expect(oneAddress).toHaveLength(58);
    expect(oneAddress).toBe(
      "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
    );
  });

  it("zeroAddress and oneAddress are different", () => {
    expect(zeroAddress).not.toBe(oneAddress);
  });
});
