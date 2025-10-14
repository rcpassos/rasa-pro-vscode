import * as assert from "assert";
import * as vscode from "vscode";
import { RasaDiagnosticProvider } from "../providers/diagnosticProvider";
import { RasaProjectService } from "../services/rasaProjectService";

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

  test("Should detect YAML syntax errors", async () => {
    // Create a document with invalid YAML
    const invalidYaml = `
version: "3.1"
intents:
  - greet
  - goodbye
    - invalid_indent
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: invalidYaml,
    });

    // Validate the document
    await diagnosticProvider.validateDocument(document);

    // Get diagnostics
    const diagnostics = diagnosticProvider.getDiagnostics(document.uri);

    // Should have at least one error
    assert.ok(diagnostics.length > 0, "Should detect YAML syntax error");

    // At least one should be an error
    const hasError = diagnostics.some(
      (d) => d.severity === vscode.DiagnosticSeverity.Error
    );
    assert.ok(hasError, "Should have at least one error diagnostic");
  });

  test("Should detect missing version field in domain", async () => {
    const invalidDomain = `
intents:
  - greet
  - goodbye

responses:
  utter_greet:
    - text: "Hello!"
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: invalidDomain,
    });

    // Set the file path to look like a domain file
    Object.defineProperty(document, "uri", {
      value: vscode.Uri.file("/fake/path/domain.yml"),
      writable: false,
    });

    await diagnosticProvider.validateDocument(document);

    const diagnostics = diagnosticProvider.getDiagnostics(document.uri);

    // Should detect missing version
    const hasMissingVersionError = diagnostics.some((d) =>
      d.message.includes("version")
    );
    assert.ok(hasMissingVersionError, "Should detect missing version field");
  });

  test("Should detect invalid slot type", async () => {
    const invalidDomain = `
version: "3.1"

slots:
  my_slot:
    type: invalid_type
    influence_conversation: false
    mappings:
      - type: from_text
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: invalidDomain,
    });

    Object.defineProperty(document, "uri", {
      value: vscode.Uri.file("/fake/path/domain.yml"),
      writable: false,
    });

    await diagnosticProvider.validateDocument(document);

    const diagnostics = diagnosticProvider.getDiagnostics(document.uri);

    // Should detect invalid slot type
    const hasInvalidSlotTypeError = diagnostics.some(
      (d) =>
        d.message.includes("Invalid slot type") && d.message.includes("my_slot")
    );
    assert.ok(hasInvalidSlotTypeError, "Should detect invalid slot type");
  });

  test("Should detect invalid response structure", async () => {
    const invalidDomain = `
version: "3.1"

responses:
  utter_greet: "This should be an array, not a string"
`;

    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: invalidDomain,
    });

    Object.defineProperty(document, "uri", {
      value: vscode.Uri.file("/fake/path/domain.yml"),
      writable: false,
    });

    await diagnosticProvider.validateDocument(document);

    const diagnostics = diagnosticProvider.getDiagnostics(document.uri);

    // Should detect invalid response structure
    const hasInvalidResponseError = diagnostics.some(
      (d) =>
        d.message.includes("utter_greet") &&
        d.message.toLowerCase().includes("array")
    );
    assert.ok(
      hasInvalidResponseError,
      "Should detect invalid response structure"
    );
  });

  test("Should validate valid domain without errors", async () => {
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

    Object.defineProperty(document, "uri", {
      value: vscode.Uri.file("/fake/path/domain.yml"),
      writable: false,
    });

    await diagnosticProvider.validateDocument(document);

    const diagnostics = diagnosticProvider.getDiagnostics(document.uri);

    // Should have no errors
    const errors = diagnostics.filter(
      (d) => d.severity === vscode.DiagnosticSeverity.Error
    );
    assert.strictEqual(errors.length, 0, "Valid domain should have no errors");
  });

  test("Should clear diagnostics for a file", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "invalid: yaml: syntax:",
    });

    await diagnosticProvider.validateDocument(document);

    let diagnostics = diagnosticProvider.getDiagnostics(document.uri);
    assert.ok(diagnostics.length > 0, "Should have diagnostics initially");

    diagnosticProvider.clearFile(document.uri);

    diagnostics = diagnosticProvider.getDiagnostics(document.uri);
    assert.strictEqual(diagnostics.length, 0, "Diagnostics should be cleared");
  });

  test("Should clear all diagnostics", async () => {
    const doc1 = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "invalid: yaml:",
    });

    const doc2 = await vscode.workspace.openTextDocument({
      language: "yaml",
      content: "another: invalid:",
    });

    await diagnosticProvider.validateDocument(doc1);
    await diagnosticProvider.validateDocument(doc2);

    diagnosticProvider.clearAll();

    const diag1 = diagnosticProvider.getDiagnostics(doc1.uri);
    const diag2 = diagnosticProvider.getDiagnostics(doc2.uri);

    assert.strictEqual(diag1.length, 0, "Doc1 diagnostics should be cleared");
    assert.strictEqual(diag2.length, 0, "Doc2 diagnostics should be cleared");
  });

  test("Should not validate non-YAML files", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "python",
      content: "def test(): pass",
    });

    await diagnosticProvider.validateDocument(document);

    const diagnostics = diagnosticProvider.getDiagnostics(document.uri);
    assert.strictEqual(
      diagnostics.length,
      0,
      "Should not validate Python files"
    );
  });

  test("Should not validate when diagnostics are disabled", async () => {
    // Get current config
    const config = vscode.workspace.getConfiguration("rasa-pro-vscode");
    const originalValue = config.get<boolean>("enableDiagnostics");

    try {
      // Disable diagnostics
      await config.update(
        "enableDiagnostics",
        false,
        vscode.ConfigurationTarget.Workspace
      );

      const document = await vscode.workspace.openTextDocument({
        language: "yaml",
        content: "invalid: yaml:",
      });

      await diagnosticProvider.validateDocument(document);

      const diagnostics = diagnosticProvider.getDiagnostics(document.uri);
      assert.strictEqual(
        diagnostics.length,
        0,
        "Should not validate when disabled"
      );
    } finally {
      // Restore original value
      await config.update(
        "enableDiagnostics",
        originalValue,
        vscode.ConfigurationTarget.Workspace
      );
    }
  });
});
