import * as assert from "assert";
import { RasaProjectService } from "../services/rasaProjectService";
import { CrossFileValidationService } from "../services/crossFileValidationService";

suite("CrossFileValidationService Test Suite", () => {
  let projectService: RasaProjectService;
  let validationService: CrossFileValidationService;

  setup(async () => {
    projectService = new RasaProjectService();
    validationService = new CrossFileValidationService(projectService);
  });

  teardown(() => {
    projectService.dispose();
    validationService.dispose();
  });

  suite("Service Initialization", () => {
    test("Should create service without errors", () => {
      assert.ok(validationService, "Validation service should be created");
    });

    test("Should have validateProject method", () => {
      assert.strictEqual(
        typeof validationService.validateProject,
        "function",
        "Should have validateProject method"
      );
    });

    test("Should have dispose method", () => {
      assert.strictEqual(
        typeof validationService.dispose,
        "function",
        "Should have dispose method"
      );
    });
  });

  suite("Basic Validation - Mocked", () => {
    test("Should return empty map when not a Rasa project", async () => {
      // When projectService.isRasaProject() returns false,
      // validateProject should return empty map
      const issuesByFile = await validationService.validateProject();

      assert.ok(issuesByFile instanceof Map, "Should return a Map");
      assert.strictEqual(
        issuesByFile.size,
        0,
        "Should return empty map for non-Rasa project"
      );
    });

    test("Should handle validation without workspace gracefully", async () => {
      // When there's no workspace, should not throw
      try {
        await validationService.validateProject();
        assert.ok(true, "Should handle missing workspace gracefully");
      } catch (error) {
        assert.fail("Should not throw when workspace is missing");
      }
    });
  });

  suite("Service Methods", () => {
    test("Should dispose without errors", () => {
      try {
        validationService.dispose();
        assert.ok(true, "Should dispose without errors");
      } catch (error) {
        assert.fail("Should not throw on dispose");
      }
    });

    test("Should handle multiple dispose calls", () => {
      try {
        validationService.dispose();
        validationService.dispose(); // Second call
        assert.ok(true, "Should handle multiple dispose calls");
      } catch (error) {
        assert.fail("Should not throw on multiple dispose calls");
      }
    });
  });
});
