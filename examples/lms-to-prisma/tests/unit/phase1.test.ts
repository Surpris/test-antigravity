import { describe, it, expect } from "vitest";
import { loadLogicalModel } from "../../src/core/loader.js";
import path from "path";

const fixturesDir = path.resolve(__dirname, "../fixtures");

describe("Phase 1: Loader & Validation", () => {
  it("should throw an error when loading an invalid YAML (missing required fields)", () => {
    const invalidPath = path.join(fixturesDir, "invalid.yaml");
    expect(() => loadLogicalModel(invalidPath)).toThrow();
  });

  it("should return a valid object when loading a valid YAML", () => {
    const validPath = path.join(fixturesDir, "valid.yaml");
    const model = loadLogicalModel(validPath);
    expect(model).toHaveProperty("model_name");
    expect(model).toHaveProperty("entities");
  });
});
