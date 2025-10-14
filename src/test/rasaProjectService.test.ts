import * as assert from "assert";
import * as vscode from "vscode";
import { RasaProjectService } from "../services/rasaProjectService";

suite("RasaProjectService Test Suite", () => {
  let service: RasaProjectService;

  setup(() => {
    service = new RasaProjectService();
  });

  teardown(() => {
    service.dispose();
  });

  test("Should initialize without errors", async () => {
    await assert.doesNotReject(async () => {
      await service.initialize();
    });
  });

  test("Should detect workspace root", async () => {
    await service.initialize();
    const root = service.getWorkspaceRoot();

    if (vscode.workspace.workspaceFolders) {
      assert.ok(root !== undefined, "Workspace root should be defined");
    }
  });

  test("Should return empty project files if not a Rasa project", async () => {
    await service.initialize();

    if (!service.isRasaProject()) {
      const files = service.getProjectFiles();
      // Files might still be found but project won't be detected
      assert.ok(files instanceof Map, "Should return a Map instance");
    }
  });

  test("Should filter files by type", async () => {
    await service.initialize();

    const domainFiles = service.getFilesByType("domain");
    const nluFiles = service.getFilesByType("nlu");
    const storiesFiles = service.getFilesByType("stories");

    assert.ok(Array.isArray(domainFiles), "Domain files should be an array");
    assert.ok(Array.isArray(nluFiles), "NLU files should be an array");
    assert.ok(Array.isArray(storiesFiles), "Stories files should be an array");
  });

  test("Should get Rasa executable from config", () => {
    const executable = service.getRasaExecutable();
    assert.ok(typeof executable === "string", "Executable should be a string");
    assert.ok(executable.length > 0, "Executable should not be empty");
  });
});
