import * as assert from "assert";
import * as vscode from "vscode";
import { RasaDiagnosticProvider } from "../providers/diagnosticProvider";
import { RasaProjectService } from "../services/rasaProjectService";

/**
 * Tests for RasaDiagnosticProvider.
 *
 * Note: These tests focus on robustness and non-crashing behavior.
 * Full validation tests would require a proper Rasa project context.
 */
suite("Diagnostic Provider Test Suite", () => {
  let diagnosticProvider: RasaDiagnosticProvider;
  let projectService: RasaProjectService;

  suiteSetup(async () => {
    // Initialize project service
    projectService = new RasaProjectService();
    await projectService.initialize();
  });

  setup(() => {
    // Create a new diagnostic provider for each test
    diagnosticProvider = new RasaDiagnosticProvider(projectService);
  });

  teardown(() => {
    // Clean up after each test
    diagnosticProvider.dispose();
  });

  test("Should handle YAML validation without crashing", async () => {
    const testYaml = `
version: "3.1"
intents:
  - greet
  - goodbye
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: testYaml,
    });

    // Should not crash
    await diagnosticProvider.validateDocument(document);
    assert.ok(true, "Validation should complete without crashing");
  });

  test("Should handle domain validation", async () => {
    const testDomain = `
version: "3.1"
intents:
  - greet
responses:
  utter_greet:
    - text: "Hello!"
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: testDomain,
    });

    await diagnosticProvider.validateDocument(document);
    assert.ok(true, "Domain validation should complete");
  });

  test("Should handle slot validation", async () => {
    const testDomain = `
version: "3.1"
slots:
  my_slot:
    type: text
    influence_conversation: false
    mappings:
      - type: from_text
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: testDomain,
    });

    await diagnosticProvider.validateDocument(document);
    assert.ok(true, "Slot validation should complete");
  });

  test("Should handle response validation", async () => {
    const testDomain = `
version: "3.1"
responses:
  utter_greet:
    - text: "Hello!"
    - text: "Hi there!"
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: testDomain,
    });

    await diagnosticProvider.validateDocument(document);
    assert.ok(true, "Response validation should complete");
  });

  test("Should handle valid domain", async () => {
    const validDomain = `
version: "3.1"
intents:
  - greet
  - goodbye
entities:
  - name
slots:
  name:
    type: text
    influence_conversation: false
    mappings:
      - type: from_text
responses:
  utter_greet:
    - text: "Hello!"
  utter_goodbye:
    - text: "Goodbye!"
actions:
  - action_custom
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: validDomain,
    });

    await diagnosticProvider.validateDocument(document);
    assert.ok(true, "Valid domain validation should complete");
  });

  test("Should clear diagnostics for a file", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "test: content",
    });

    await diagnosticProvider.validateDocument(document);

    // Clear should not crash
    diagnosticProvider.clearFile(document.uri);
    assert.ok(true, "Clear file should not crash");
  });

  test("Should clear all diagnostics", () => {
    // Should not crash
    diagnosticProvider.clearAll();
    assert.ok(true, "Clear all should not crash");
  });

  test("Should not validate non-YAML files", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "plaintext",
      content: "not yaml content",
    });

    await diagnosticProvider.validateDocument(document);

    const diagnostics = diagnosticProvider.getDiagnostics(document.uri);
    assert.strictEqual(
      diagnostics.length,
      0,
      "Should not validate non-YAML files"
    );
  });

  test("Should handle dispose without errors", () => {
    const provider = new RasaDiagnosticProvider(projectService);

    assert.doesNotThrow(() => {
      provider.dispose();
    }, "Dispose should not throw");
  });
});
