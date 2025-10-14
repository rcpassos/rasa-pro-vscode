import * as assert from "assert";
import * as vscode from "vscode";
import { RasaProjectService } from "../services/rasaProjectService";
import { RasaHoverProvider } from "../providers/hoverProvider";

/**
 * Unit tests for RasaHoverProvider.
 *
 * Note: These tests focus on basic functionality that doesn't require
 * file system access. Full integration tests would require a test workspace
 * with actual Rasa project files.
 */
suite("RasaHoverProvider Test Suite", () => {
  let hoverProvider: RasaHoverProvider;
  let projectService: RasaProjectService;

  suiteSetup(async () => {
    // Initialize a project service (will detect from current workspace)
    projectService = new RasaProjectService();
    await projectService.initialize();

    // Create hover provider
    hoverProvider = new RasaHoverProvider(projectService);
  });

  suiteTeardown(() => {
    if (hoverProvider) {
      hoverProvider.dispose();
    }
    if (projectService) {
      projectService.dispose();
    }
  });

  test("Should not provide hover for non-YAML files", async () => {
    // Create a temporary text document
    const document = await vscode.workspace.openTextDocument({
      language: "plaintext",
      content: "intent: greet",
    });

    const position = new vscode.Position(0, 8);

    const hover = await hoverProvider.provideHover(
      document,
      position,
      new vscode.CancellationTokenSource().token
    );

    assert.strictEqual(
      hover,
      undefined,
      "Hover should not be provided for non-YAML files"
    );
  });

  test("Should handle YAML files gracefully", async () => {
    // Create a temporary YAML document
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: `version: "3.1"\nintents:\n  - greet\n  - goodbye`,
    });

    const position = new vscode.Position(0, 0);

    // Should not crash, may or may not return hover depending on context
    await hoverProvider.provideHover(
      document,
      position,
      new vscode.CancellationTokenSource().token
    );

    // Just verify it doesn't crash
    assert.ok(true, "Hover provider should handle YAML files without crashing");
  });

  test("Should handle empty positions gracefully", async () => {
    // Create a temporary YAML document
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "\n\n\n",
    });

    const position = new vscode.Position(1, 0);

    // Should not crash on empty content
    await hoverProvider.provideHover(
      document,
      position,
      new vscode.CancellationTokenSource().token
    );

    assert.ok(
      true,
      "Hover provider should handle empty content without crashing"
    );
  });

  test("Should handle invalid YAML gracefully", async () => {
    // Create a YAML document with invalid syntax
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "intents:\n  - : invalid\n  bad: : syntax",
    });

    const position = new vscode.Position(1, 5);

    // Should not crash on invalid YAML
    await hoverProvider.provideHover(
      document,
      position,
      new vscode.CancellationTokenSource().token
    );

    assert.ok(
      true,
      "Hover provider should handle invalid YAML without crashing"
    );
  });

  test("Should have a working dispose method", () => {
    // Create a new provider
    const testProvider = new RasaHoverProvider(projectService);

    // Should not throw when disposing
    assert.doesNotThrow(() => {
      testProvider.dispose();
    }, "Dispose should not throw errors");
  });

  test("Should handle cancellation tokens", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "version: '3.1'",
    });

    const position = new vscode.Position(0, 0);
    const tokenSource = new vscode.CancellationTokenSource();

    // Cancel immediately
    tokenSource.cancel();

    // Should handle cancelled token gracefully
    await hoverProvider.provideHover(document, position, tokenSource.token);

    assert.ok(
      true,
      "Hover provider should handle cancellation tokens without crashing"
    );
  });

  test("Should not crash with extremely long lines", async () => {
    // Create a document with a very long line
    const longContent = "version: " + "x".repeat(10000);
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: longContent,
    });

    const position = new vscode.Position(0, 100);

    // Should handle long content without performance issues
    await hoverProvider.provideHover(
      document,
      position,
      new vscode.CancellationTokenSource().token
    );

    assert.ok(true, "Hover provider should handle long lines without crashing");
  });

  test("Should handle positions at end of document", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "version: '3.1'\nintents:\n  - greet",
    });

    // Position at the very end
    const lastLine = document.lineCount - 1;
    const lastChar = document.lineAt(lastLine).text.length;
    const position = new vscode.Position(lastLine, lastChar);

    await hoverProvider.provideHover(
      document,
      position,
      new vscode.CancellationTokenSource().token
    );

    assert.ok(true, "Hover provider should handle end-of-document positions");
  });

  // Note: Integration tests that verify actual hover content would require
  // a proper test workspace with Rasa project files. These tests focus on
  // ensuring the provider doesn't crash under various conditions.
});
