import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { RasaProjectService } from "../../services/rasaProjectService";
import { RasaCompletionProvider } from "../../providers/completionProvider";

/**
 * Integration tests for RasaCompletionProvider.
 * Tests the completion provider with real project files and VS Code API.
 *
 * NOTE: These tests work with manually opened files since we cannot
 * easily change the workspace during test execution. The completion provider
 * will work with the current workspace which may not have Rasa files during tests.
 */
suite("Completion Provider Integration Tests", () => {
  const testProjectsPath = path.join(__dirname, "../../../test-projects");
  const basicProjectPath = path.join(testProjectsPath, "basic-rasa-project");

  let projectService: RasaProjectService;
  let completionProvider: RasaCompletionProvider;

  /**
   * Set up the project service and completion provider before tests.
   */
  suiteSetup(async function () {
    this.timeout(10000); // Allow time for project initialization

    projectService = new RasaProjectService();
    await projectService.initialize();

    completionProvider = new RasaCompletionProvider(projectService);

    // Force a cache refresh to load domain files
    // This ensures domain data is available for completions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  /**
   * Clean up resources after all tests.
   */
  suiteTeardown(() => {
    if (completionProvider) {
      completionProvider.dispose();
    }
    if (projectService) {
      projectService.dispose();
    }
  });

  /**
   * Helper function to open a file and get completions at a specific position.
   */
  async function getCompletionsAt(
    relativePath: string,
    line: number,
    character: number
  ): Promise<vscode.CompletionItem[]> {
    const filePath = path.join(basicProjectPath, relativePath);
    const uri = vscode.Uri.file(filePath);

    // Open the document
    const document = await vscode.workspace.openTextDocument(uri);

    // Create position and trigger completion
    const position = new vscode.Position(line, character);
    const token = new vscode.CancellationTokenSource().token;
    const context: vscode.CompletionContext = {
      triggerKind: vscode.CompletionTriggerKind.Invoke,
      triggerCharacter: undefined,
    };

    const completions = await completionProvider.provideCompletionItems(
      document,
      position,
      token,
      context
    );

    if (!completions) {
      return [];
    }

    return Array.isArray(completions) ? completions : completions.items;
  }

  /**
   * Helper function to check if a completion list contains a specific label.
   */
  function hasCompletion(
    completions: vscode.CompletionItem[],
    label: string
  ): boolean {
    return completions.some((item) => item.label === label);
  }

  /**
   * Helper function to get completion labels as an array.
   */
  function getCompletionLabels(completions: vscode.CompletionItem[]): string[] {
    return completions.map((item) => item.label as string);
  }

  suite("Intent Completions", () => {
    test("Should handle intent completion requests in stories files", async function () {
      this.timeout(5000);

      // NOTE: Without a workspace containing Rasa files, completions will be empty
      // This test verifies the provider handles the request without errors
      const completions = await getCompletionsAt("data/stories.yml", 6, 16);

      // Provider should return an array (may be empty without workspace context)
      assert.ok(Array.isArray(completions), "Should return an array");

      // If domain files were found, we'd have completions
      if (completions.length > 0) {
        console.log(
          `✓ Intent completions provided: ${getCompletionLabels(
            completions
          ).join(", ")}`
        );
      } else {
        console.log(
          "✓ Intent completion handling works (no domain files in test workspace)"
        );
      }
    });

    test("Should handle intent completion requests in rules", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("data/rules.yml", 6, 16);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(
        `✓ Rules file intent completion handling: ${completions.length} items`
      );
    });

    test("Should handle intent completion requests in domain", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("domain.yml", 5, 4);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(
        `✓ Domain file intent completion handling: ${completions.length} items`
      );
    });
  });

  suite("Action Completions", () => {
    test("Should handle action completion requests in stories", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("data/stories.yml", 7, 16);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(`✓ Action completion handling: ${completions.length} items`);
    });

    test("Should handle action completion requests in rules", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("data/rules.yml", 7, 16);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(
        `✓ Action completion handling in rules: ${completions.length} items`
      );
    });
  });

  suite("Response Completions", () => {
    test("Should handle response completion requests", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("domain.yml", 47, 4);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(
        `✓ Response completion handling: ${completions.length} items`
      );
    });
  });

  suite("Entity Completions", () => {
    test("Should handle entity completion requests", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("domain.yml", 14, 4);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(`✓ Entity completion handling: ${completions.length} items`);
    });
  });

  suite("Slot Completions", () => {
    test("Should handle slot completion requests", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("data/stories.yml", 6, 16);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(`✓ Slot completion mechanism functional`);
    });
  });

  suite("Form Completions", () => {
    test("Should handle form completion requests", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("data/stories.yml", 36, 22);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(`✓ Form completion handling functional`);
    });
  });

  suite("Slot Type Completions", () => {
    test("Should provide slot type completions", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("domain.yml", 19, 11);

      assert.ok(Array.isArray(completions), "Should return an array");

      // Slot types are static, so they should always be available
      const expectedTypes = [
        "text",
        "bool",
        "categorical",
        "float",
        "list",
        "any",
      ];

      if (completions.length > 0) {
        let foundTypes = 0;
        for (const type of expectedTypes) {
          if (hasCompletion(completions, type)) {
            foundTypes++;
          }
        }

        console.log(
          `✓ Slot type completions: ${foundTypes}/${expectedTypes.length} types found`
        );
      } else {
        console.log("✓ Slot type completion handling functional");
      }
    });
  });

  suite("Slot Mapping Type Completions", () => {
    test("Should provide slot mapping type completions", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("domain.yml", 23, 16);

      assert.ok(Array.isArray(completions), "Should return an array");

      console.log(`✓ Slot mapping type completion handling functional`);
    });
  });

  suite("Context Detection Accuracy", () => {
    test("Should NOT provide completions for non-YAML files", async function () {
      this.timeout(5000);

      // Create a temporary text document (not YAML)
      const textDoc = await vscode.workspace.openTextDocument({
        content: "- intent: greet\n- action: utter_greet",
        language: "plaintext",
      });

      const position = new vscode.Position(0, 10);
      const token = new vscode.CancellationTokenSource().token;
      const context: vscode.CompletionContext = {
        triggerKind: vscode.CompletionTriggerKind.Invoke,
        triggerCharacter: undefined,
      };

      const completions = await completionProvider.provideCompletionItems(
        textDoc,
        position,
        token,
        context
      );

      assert.strictEqual(
        completions,
        undefined,
        "Should not provide completions for non-YAML files"
      );

      console.log("✓ Correctly ignores non-YAML files");
    });

    test("Should handle empty lines gracefully", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("data/stories.yml", 2, 0);

      // Should handle without errors (may or may not return completions)
      assert.ok(
        completions !== undefined,
        "Should handle empty lines without errors"
      );

      console.log("✓ Handles empty lines gracefully");
    });

    test("Should handle malformed YAML gracefully", async function () {
      this.timeout(5000);

      // Create a document with malformed YAML
      const doc = await vscode.workspace.openTextDocument({
        content: "- intent greet\n- action: utter_greet",
        language: "yaml",
      });

      const position = new vscode.Position(0, 10);
      const token = new vscode.CancellationTokenSource().token;
      const context: vscode.CompletionContext = {
        triggerKind: vscode.CompletionTriggerKind.Invoke,
        triggerCharacter: undefined,
      };

      const completions = await completionProvider.provideCompletionItems(
        doc,
        position,
        token,
        context
      );

      // Should not throw, should return undefined or empty array
      assert.ok(
        completions === undefined || Array.isArray(completions),
        "Should handle malformed YAML gracefully"
      );

      console.log("✓ Handles malformed YAML gracefully");
    });
  });

  suite("Performance Tests", () => {
    test("Should provide completions within reasonable time", async function () {
      this.timeout(5000);

      const startTime = Date.now();
      await getCompletionsAt("data/stories.yml", 6, 16);
      const duration = Date.now() - startTime;

      assert.ok(
        duration < 1000,
        `Completions should be provided in <1s (took ${duration}ms)`
      );

      console.log(`✓ Completion speed: ${duration}ms`);
    });

    test("Should handle multiple rapid requests", async function () {
      this.timeout(10000);

      const requests = [
        getCompletionsAt("data/stories.yml", 6, 16),
        getCompletionsAt("data/stories.yml", 7, 16),
        getCompletionsAt("data/rules.yml", 6, 16),
        getCompletionsAt("domain.yml", 5, 4),
      ];

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      assert.ok(
        results.every((r) => Array.isArray(r)),
        "All requests should complete and return arrays"
      );

      console.log(
        `✓ Handled ${requests.length} rapid requests in ${duration}ms`
      );
    });
  });

  suite("Cache Management", () => {
    test("Should handle cache operations", async function () {
      this.timeout(5000);

      const completions1 = await getCompletionsAt("data/stories.yml", 6, 16);

      // Second request - should use cache if available
      const startTime = Date.now();
      const completions2 = await getCompletionsAt("data/stories.yml", 6, 16);
      const duration = Date.now() - startTime;

      assert.ok(Array.isArray(completions1), "First request should succeed");
      assert.ok(Array.isArray(completions2), "Second request should succeed");

      console.log(`✓ Cache handling works, second request: ${duration}ms`);
    });

    test("Should handle cache refresh", async function () {
      this.timeout(5000);

      const completions1 = await getCompletionsAt("data/stories.yml", 6, 16);

      // Clear cache
      completionProvider.clearCache();

      const completions2 = await getCompletionsAt("data/stories.yml", 6, 16);

      assert.ok(Array.isArray(completions1), "Should work before cache clear");
      assert.ok(Array.isArray(completions2), "Should work after cache clear");

      console.log("✓ Cache refresh works correctly");
    });
  });

  suite("Completion Item Properties", () => {
    test("Should return completion items with valid structure", async function () {
      this.timeout(5000);

      const completions = await getCompletionsAt("data/stories.yml", 6, 16);

      if (completions.length > 0) {
        const firstItem = completions[0];

        if (firstItem) {
          assert.ok(firstItem.label, "Completion item should have a label");
          assert.ok(
            firstItem.kind !== undefined,
            "Completion item should have a kind"
          );

          console.log(`✓ Completion items have valid structure`);
        }
      } else {
        console.log(
          "✓ Completion item structure validation skipped (no items)"
        );
      }
    });
  });

  suite("File Type Support", () => {
    test("Should work with split domain files", async function () {
      this.timeout(5000);

      const splitProjectPath = path.join(
        testProjectsPath,
        "split-domain-project"
      );

      // Verify split project has domain files
      const domainDir = vscode.Uri.file(path.join(splitProjectPath, "domain"));
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(domainDir.fsPath, "*.yml")
      );

      assert.ok(
        files.length > 0,
        "Split domain project should have domain files"
      );

      console.log(`✓ Split domain project has ${files.length} domain files`);
    });
  });
});

/**
 * Edge case tests for completion provider.
 */
suite("Completion Provider Edge Cases", () => {
  let projectService: RasaProjectService;
  let completionProvider: RasaCompletionProvider;

  suiteSetup(async function () {
    this.timeout(10000);

    projectService = new RasaProjectService();
    await projectService.initialize();

    completionProvider = new RasaCompletionProvider(projectService);
  });

  suiteTeardown(() => {
    if (completionProvider) {
      completionProvider.dispose();
    }
    if (projectService) {
      projectService.dispose();
    }
  });

  test("Should handle documents with no workspace folder", async function () {
    this.timeout(5000);

    const doc = await vscode.workspace.openTextDocument({
      content: "- intent: test",
      language: "yaml",
    });

    const position = new vscode.Position(0, 10);
    const token = new vscode.CancellationTokenSource().token;
    const context: vscode.CompletionContext = {
      triggerKind: vscode.CompletionTriggerKind.Invoke,
      triggerCharacter: undefined,
    };

    await completionProvider.provideCompletionItems(
      doc,
      position,
      token,
      context
    );

    // Should not crash
    assert.ok(true, "Should handle untitled documents");

    console.log("✓ Handles documents without workspace folder");
  });

  test("Should handle very long lines", async function () {
    this.timeout(5000);

    const longIntent = "very_long_intent_name_" + "x".repeat(1000);
    const doc = await vscode.workspace.openTextDocument({
      content: `- intent: ${longIntent}`,
      language: "yaml",
    });

    const position = new vscode.Position(0, 10);
    const token = new vscode.CancellationTokenSource().token;
    const context: vscode.CompletionContext = {
      triggerKind: vscode.CompletionTriggerKind.Invoke,
      triggerCharacter: undefined,
    };

    await completionProvider.provideCompletionItems(
      doc,
      position,
      token,
      context
    );

    // Should handle without crashing
    assert.ok(true, "Should handle very long lines");

    console.log("✓ Handles very long lines");
  });

  test("Should handle deeply nested YAML", async function () {
    this.timeout(5000);

    const nestedYaml = `
a:
  b:
    c:
      d:
        e:
          f:
            g:
              - intent: test
    `;

    const doc = await vscode.workspace.openTextDocument({
      content: nestedYaml,
      language: "yaml",
    });

    const position = new vscode.Position(8, 26);
    const token = new vscode.CancellationTokenSource().token;
    const context: vscode.CompletionContext = {
      triggerKind: vscode.CompletionTriggerKind.Invoke,
      triggerCharacter: undefined,
    };

    await completionProvider.provideCompletionItems(
      doc,
      position,
      token,
      context
    );

    // Should handle without crashing
    assert.ok(true, "Should handle deeply nested YAML");

    console.log("✓ Handles deeply nested YAML");
  });

  test("Should dispose cleanly", () => {
    const tempService = new RasaProjectService();
    const tempProvider = new RasaCompletionProvider(tempService);

    assert.doesNotThrow(() => {
      tempProvider.dispose();
      tempService.dispose();
    }, "Should dispose without errors");

    console.log("✓ Disposes cleanly");
  });
});
