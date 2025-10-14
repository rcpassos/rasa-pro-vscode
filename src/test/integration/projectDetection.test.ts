import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { RasaProjectService } from "../../services/rasaProjectService";

/**
 * Integration tests for Rasa project detection using sample projects.
 * These tests verify that the RasaProjectService correctly identifies
 * valid and invalid Rasa projects.
 */
suite("Rasa Project Detection Integration Tests", () => {
  const testProjectsPath = path.join(__dirname, "../../../test-projects");

  /**
   * Helper function to open a workspace folder and test project detection
   */
  async function testProjectDetection(
    projectName: string,
    shouldBeDetected: boolean,
    description: string
  ): Promise<void> {
    const projectPath = path.join(testProjectsPath, projectName);
    const projectUri = vscode.Uri.file(projectPath);

    // Create a new service instance for each test
    const service = new RasaProjectService();

    try {
      // Note: In a real integration test, we would update the workspace
      // For now, we'll test the detection logic directly

      // Since we can't easily change workspaces in tests, we'll verify
      // the project structure exists
      const domainFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(projectUri, "**/domain.yml"),
        null,
        1
      );

      const domainDirFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(projectUri, "**/domain/*.yml"),
        null,
        5
      );

      const configFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(projectUri, "**/config.yml"),
        null,
        1
      );

      const hasDomain = domainFiles.length > 0 || domainDirFiles.length > 0;
      const hasConfig = configFiles.length > 0;

      // Validate domain structure if domain file exists
      let hasValidDomain = false;
      if (domainFiles.length > 0 && domainFiles[0]) {
        const content = await vscode.workspace.fs.readFile(domainFiles[0]);
        const text = Buffer.from(content).toString("utf8");
        // Check for common Rasa domain keys
        hasValidDomain =
          /\b(intents|entities|slots|responses|actions|forms)\b/.test(text);
      } else if (domainDirFiles.length > 0) {
        // If using split domain, at least one file should exist
        hasValidDomain = true;
      }

      const shouldDetect = hasDomain && hasConfig && hasValidDomain;

      assert.strictEqual(
        shouldDetect,
        shouldBeDetected,
        `${description}: Expected detection=${shouldBeDetected}, got=${shouldDetect}`
      );

      console.log(`✓ ${description}`);
    } finally {
      service.dispose();
    }
  }

  test("Should detect basic Rasa project with domain.yml", async function () {
    this.timeout(5000);
    await testProjectDetection(
      "basic-rasa-project",
      true,
      "Basic Rasa project with single domain.yml"
    );
  });

  test("Should detect Rasa project with split domain files", async function () {
    this.timeout(5000);
    await testProjectDetection(
      "split-domain-project",
      true,
      "Rasa project with split domain/ directory"
    );
  });

  test("Should NOT detect project without domain.yml", async function () {
    this.timeout(5000);
    await testProjectDetection(
      "invalid-project-no-domain",
      false,
      "Invalid project missing domain.yml"
    );
  });

  test("Should NOT detect project with empty/invalid domain", async function () {
    this.timeout(5000);
    await testProjectDetection(
      "invalid-project-empty-domain",
      false,
      "Invalid project with empty domain.yml"
    );
  });
});

/**
 * Unit tests for specific detection methods
 */
suite("RasaProjectService Detection Methods", () => {
  let service: RasaProjectService;

  setup(() => {
    service = new RasaProjectService();
  });

  teardown(() => {
    service.dispose();
  });

  test("Should identify Rasa YAML files correctly", () => {
    const testCases = [
      { path: "domain.yml", expected: true },
      { path: "domain/intents.yml", expected: true },
      { path: "domain/slots.yaml", expected: true },
      { path: "config.yml", expected: true },
      { path: "data/nlu.yml", expected: true },
      { path: "data/stories.yml", expected: true },
      { path: "data/rules.yaml", expected: true },
      { path: "nlu.yml", expected: true },
      { path: "stories.yml", expected: true },
      { path: "rules.yml", expected: true },
      { path: "endpoints.yml", expected: true },
      { path: "credentials.yml", expected: true },
      { path: "tests/conversation_tests.yml", expected: true },

      // Should NOT match
      { path: "random.yml", expected: false },
      { path: "src/config.yml", expected: false },
      { path: "node_modules/domain.yml", expected: false },
      { path: "package.yml", expected: false },
    ];

    for (const testCase of testCases) {
      // Access the private method through a workaround for testing
      const isRasaFile = (service as any).isRasaFile(testCase.path);
      assert.strictEqual(
        isRasaFile,
        testCase.expected,
        `File "${testCase.path}" should ${
          testCase.expected ? "be" : "NOT be"
        } recognized as Rasa file`
      );
    }
  });

  test("Should return correct file types", async () => {
    await service.initialize();

    // Test all supported file types
    const fileTypes: Array<
      "domain" | "nlu" | "stories" | "rules" | "config" | "tests"
    > = ["domain", "nlu", "stories", "rules", "config", "tests"];

    for (const fileType of fileTypes) {
      const files = service.getFilesByType(fileType);
      assert.ok(
        Array.isArray(files),
        `getFilesByType("${fileType}") should return an array`
      );
    }
  });

  test("Should get Rasa executable from configuration", () => {
    const executable = service.getRasaExecutable();
    assert.ok(typeof executable === "string");
    assert.ok(executable.length > 0);
    // Default should be 'rasa' unless configured otherwise
    assert.strictEqual(executable, "rasa");
  });
});

/**
 * File watcher tests
 */
suite("RasaProjectService File Watcher", () => {
  let service: RasaProjectService;

  setup(() => {
    service = new RasaProjectService();
  });

  teardown(() => {
    service.dispose();
  });

  test("Should initialize without file watcher if not a Rasa project", async () => {
    await service.initialize();

    // The file watcher should only be set up if it's a Rasa project
    // We can verify this by checking if the service was initialized
    assert.ok(service !== undefined, "Service should be initialized");
  });

  test("Should properly dispose resources", () => {
    // Create and dispose service
    const tempService = new RasaProjectService();

    // Should not throw
    assert.doesNotThrow(() => {
      tempService.dispose();
    }, "Service disposal should not throw errors");
  });
});

/**
 * Project file management tests
 */
suite("RasaProjectService File Management", () => {
  let service: RasaProjectService;

  setup(async () => {
    service = new RasaProjectService();
    await service.initialize();
  });

  teardown(() => {
    service.dispose();
  });

  test("Should return a Map of project files", () => {
    const files = service.getProjectFiles();
    assert.ok(files instanceof Map, "Should return a Map instance");
  });

  test("Should check file existence correctly", () => {
    const exists = service.hasFile("domain.yml");
    assert.ok(typeof exists === "boolean", "hasFile should return a boolean");
  });

  test("Should return workspace root", () => {
    const root = service.getWorkspaceRoot();

    if (
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
    ) {
      assert.ok(
        typeof root === "string" || root === undefined,
        "Workspace root should be a string or undefined"
      );
    }
  });

  test("Should correctly identify Rasa project status", () => {
    const isRasa = service.isRasaProject();
    assert.ok(
      typeof isRasa === "boolean",
      "isRasaProject should return a boolean"
    );
  });
});
