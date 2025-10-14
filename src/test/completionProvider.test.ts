import * as assert from "assert";
import * as vscode from "vscode";
import { RasaCompletionProvider } from "../providers/completionProvider";
import { RasaProjectService } from "../services/rasaProjectService";

suite("RasaCompletionProvider Test Suite", () => {
  let completionProvider: RasaCompletionProvider;
  let projectService: RasaProjectService;

  // Helper function to create completion context
  const createCompletionContext = (): vscode.CompletionContext => ({
    triggerKind: vscode.CompletionTriggerKind.Invoke,
    triggerCharacter: undefined,
  });

  suiteSetup(async () => {
    // Initialize project service with basic-rasa-project
    projectService = new RasaProjectService();
    await projectService.initialize();

    // Create completion provider
    completionProvider = new RasaCompletionProvider(projectService);
  });

  suiteTeardown(() => {
    completionProvider.dispose();
    projectService.dispose();
  });

  test("should provide intent completions in stories", async () => {
    // Create a test document
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

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide completions");
    assert.ok(
      Array.isArray(completions) || completions instanceof vscode.CompletionList,
      "Completions should be an array or CompletionList"
    );

    const items = Array.isArray(completions) ? completions : completions.items;
    assert.ok(items.length > 0, "Should provide at least one completion");
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

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide completions");
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

    assert.ok(completions, "Should provide completions");

    const items = Array.isArray(completions) ? completions : completions.items;
    const slotTypes = ["text", "bool", "categorical", "float", "list", "any"];

    // Check if all slot types are present
    slotTypes.forEach((type) => {
      const found = items.some((item) => item.label === type);
      assert.ok(found, `Should include slot type: ${type}`);
    });
  });

  test("should provide slot mapping type completions", async () => {
    const testContent = `version: "3.1"
slots:
  location:
    type: text
    mappings:
      - type: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(5, 14); // After "- type: "

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide completions");

    const items = Array.isArray(completions) ? completions : completions.items;
    const mappingTypes = ["from_entity", "from_text", "from_intent", "custom"];

    // Check if all mapping types are present
    mappingTypes.forEach((type) => {
      const found = items.some((item) => item.label === type);
      assert.ok(found, `Should include mapping type: ${type}`);
    });
  });

  test("should provide action completions in stories", async () => {
    const testContent = `version: "3.1"
stories:
  - story: test story
    steps:
      - action: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 16); // After "action: "

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide completions");

    const items = Array.isArray(completions) ? completions : completions.items;
    assert.ok(items.length > 0, "Should provide at least one action completion");
  });

  test("should provide response completions for utter_ actions", async () => {
    const testContent = `version: "3.1"
stories:
  - story: test story
    steps:
      - action: utter_`;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 22); // After "action: utter_"

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide completions");

    const items = Array.isArray(completions) ? completions : completions.items;
    assert.ok(
      items.length > 0,
      "Should provide at least one response completion"
    );

    // All completions should be responses (start with "utter_")
    items.forEach((item) => {
      assert.ok(
        String(item.label).startsWith("utter_"),
        `Completion "${item.label}" should start with "utter_"`
      );
    });
  });

  test("should provide form completions for active_loop", async () => {
    const testContent = `version: "3.1"
stories:
  - story: test story
    steps:
      - active_loop: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 21); // After "active_loop: "

    const completions = await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );

    assert.ok(completions, "Should provide completions");
  });

  test("should not provide completions for non-YAML files", async () => {
    const testContent = `print("hello world")`;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "python",
    });

    const position = new vscode.Position(0, 10);

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
    // First call - should populate cache
    const testContent = `version: "3.1"
stories:
  - story: test
    steps:
      - intent: `;

    const doc = await vscode.workspace.openTextDocument({
      content: testContent,
      language: "yaml",
    });

    const position = new vscode.Position(4, 17);

    const startTime1 = Date.now();
    await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );
    const duration1 = Date.now() - startTime1;

    // Second call - should use cache (should be faster or similar)
    const startTime2 = Date.now();
    await completionProvider.provideCompletionItems(
      doc,
      position,
      new vscode.CancellationTokenSource().token,
      createCompletionContext()
    );
    const duration2 = Date.now() - startTime2;

    // Cache should make second call faster or at least not significantly slower
    assert.ok(
      duration2 <= duration1 * 2,
      `Cached call (${duration2}ms) should be reasonably fast compared to first call (${duration1}ms)`
    );
  });

  test("should clear cache when requested", () => {
    completionProvider.clearCache();
    assert.ok(true, "Should clear cache without errors");
  });
});
