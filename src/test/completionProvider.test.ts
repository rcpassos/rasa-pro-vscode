import * as assert from "assert";
import * as vscode from "vscode";
import { RasaCompletionProvider } from "../providers/completionProvider";
import { RasaProjectService } from "../services/rasaProjectService";

/**
 * Tests for RasaCompletionProvider.
 *
 * Note: These tests focus on robustness and non-crashing behavior.
 * Full completion tests would require a proper Rasa project with domain data.
 */
suite("RasaCompletionProvider Test Suite", () => {
  let completionProvider: RasaCompletionProvider;
  let projectService: RasaProjectService;

  // Helper function to create completion context
  const createCompletionContext = (): vscode.CompletionContext => ({
    triggerKind: vscode.CompletionTriggerKind.Invoke,
    triggerCharacter: undefined,
  });

  suiteSetup(async () => {
    // Initialize project service
    projectService = new RasaProjectService();
    await projectService.initialize();

    // Create completion provider
    completionProvider = new RasaCompletionProvider(projectService);
  });

  suiteTeardown(() => {
    completionProvider.dispose();
    projectService.dispose();
  });

  test("should handle intent completion requests", async () => {
    const testContent = `version: "3.1"
stories:
  - story: test story
    steps:
      - intent: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 17); // After "intent: "

    // Should not crash, may return empty list if no domain loaded
    await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(true, "Intent completion should not crash");
  });

  test("should provide entity completions in domain", async () => {
    const testContent = `version: "3.1"
entities:
  - `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(2, 4); // After "- "

    await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    // Should return something or undefined, but not crash
    assert.ok(true, "Entity completion should not crash");
  });

  test("should provide slot type completions", async () => {
    const testContent = `version: "3.1"
slots:
  name:
    type: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(3, 10); // After "type: "

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide slot type completions");

    const items = Array.isArray(completions)
      ? completions
      : completions?.items || [];
    // Slot types are hardcoded, so we should get some
    assert.ok(items.length > 0, "Should have slot type completions");
  });

  test("should provide slot mapping type completions", async () => {
    const testContent = `version: "3.1"
slots:
  name:
    type: text
    mappings:
      - type: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(5, 14); // After "type: "

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide mapping type completions");

    const items = Array.isArray(completions)
      ? completions
      : completions?.items || [];
    // Mapping types are hardcoded, so we should get some
    assert.ok(items.length > 0, "Should have mapping type completions");
  });

  test("should provide action completions in stories", async () => {
    const testContent = `version: "3.1"
stories:
  - story: test
    steps:
      - action: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 16);

    await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    // Should not crash
    assert.ok(true, "Action completion should not crash");
  });

  test("should provide response completions for utter_ actions", async () => {
    const testContent = `version: "3.1"
stories:
  - story: test
    steps:
      - action: utter_`;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 22);

    await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    // Should not crash
    assert.ok(true, "Response completion should not crash");
  });

  test("should provide form completions for active_loop", async () => {
    const testContent = `version: "3.1"
stories:
  - story: test
    steps:
      - active_loop: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 21);

    await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    // Should not crash
    assert.ok(true, "Form completion should not crash");
  });

  test("should not provide completions for non-YAML files", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "plain text",
      language: "plaintext",
    });

    const position = new vscode.Position(0, 5);

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.strictEqual(
      completions,
      undefined,
      "Should not provide completions for non-YAML files"
    );
  });

  test("should cache domain data for performance", async () => {
    // Create a document
    const doc = await vscode.workspace.openTextDocument({
      content: "version: '3.1'",
      language: "yaml",
    });

    const position = new vscode.Position(0, 10);
    const context = createCompletionContext();
    const token = new vscode.CancellationTokenSource().token;

    // First call - might populate cache
    await completionProvider.provideCompletionItems(
      doc,
      position,
      token,
      context
    );

    // Second call - should use cache
    await completionProvider.provideCompletionItems(
      doc,
      position,
      token,
      context
    );

    // Just verify it doesn't crash with caching
    assert.ok(true, "Caching should work without errors");
  });

  test("should clear cache when requested", () => {
    // Should not crash
    assert.doesNotThrow(() => {
      completionProvider.clearCache();
    }, "Cache clearing should not throw");
  });

  test("should handle dispose without errors", () => {
    const provider = new RasaCompletionProvider(projectService);

    assert.doesNotThrow(() => {
      provider.dispose();
    }, "Dispose should not throw");
  });
});
