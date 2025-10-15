import * as vscode from "vscode";
import { RasaProjectService } from "../services/rasaProjectService";
import {
  YamlParserService,
  RasaDomain,
  ValidationError,
} from "../services/yamlParserService";
import { CrossFileValidationService } from "../services/crossFileValidationService";
import * as path from "path";

/**
 * Provides real-time diagnostics (error/warning reporting) for Rasa YAML files.
 * Validates YAML syntax, Rasa schema structure, and cross-file references.
 */
export class RasaDiagnosticProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private yamlParser: YamlParserService;
  private outputChannel: vscode.OutputChannel;
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private disposables: vscode.Disposable[] = [];
  private crossFileValidator: CrossFileValidationService;
  private crossFileValidationEnabled: boolean = true;

  constructor(projectService: RasaProjectService) {
    this.yamlParser = YamlParserService.getInstance();
    this.crossFileValidator = new CrossFileValidationService(projectService);
    this.outputChannel = vscode.window.createOutputChannel("Rasa Diagnostics");

    // Create diagnostic collection
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("rasa");
    this.disposables.push(this.diagnosticCollection);

    // Set up file watchers and event handlers
    this.setupEventHandlers();

    // Run initial diagnostics on all open documents
    this.validateAllOpenDocuments();
  }

  /**
   * Set up event handlers for document changes and file system events
   */
  private setupEventHandlers(): void {
    // Watch for document changes
    const onDidChangeDisposable = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        if (this.isRasaFile(event.document)) {
          this.validateDocument(event.document);
        }
      }
    );
    this.disposables.push(onDidChangeDisposable);

    // Watch for document open
    const onDidOpenDisposable = vscode.workspace.onDidOpenTextDocument(
      (document) => {
        if (this.isRasaFile(document)) {
          this.validateDocument(document);
        }
      }
    );
    this.disposables.push(onDidOpenDisposable);

    // Watch for document close - clear diagnostics
    const onDidCloseDisposable = vscode.workspace.onDidCloseTextDocument(
      (document) => {
        if (this.isRasaFile(document)) {
          this.diagnosticCollection.delete(document.uri);
        }
      }
    );
    this.disposables.push(onDidCloseDisposable);

    // Watch for file system changes
    this.fileWatcher =
      vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");

    this.fileWatcher.onDidChange((uri) => {
      this.validateFileByUri(uri);
      // Trigger cross-file validation when any file changes
      this.debouncedCrossFileValidation();
    });

    this.fileWatcher.onDidCreate((uri) => {
      this.validateFileByUri(uri);
      // Trigger cross-file validation when any file is created
      this.debouncedCrossFileValidation();
    });

    this.fileWatcher.onDidDelete((uri) => {
      this.diagnosticCollection.delete(uri);
      // Trigger cross-file validation when any file is deleted
      this.debouncedCrossFileValidation();
    });

    this.disposables.push(this.fileWatcher);
  }

  /**
   * Debounced cross-file validation to avoid excessive re-validation
   */
  private crossFileValidationTimer: NodeJS.Timeout | undefined;
  private debouncedCrossFileValidation(): void {
    if (!this.crossFileValidationEnabled) {
      return;
    }

    // Clear existing timer
    if (this.crossFileValidationTimer) {
      clearTimeout(this.crossFileValidationTimer);
    }

    // Set new timer - validate after 500ms of inactivity
    this.crossFileValidationTimer = setTimeout(() => {
      this.runCrossFileValidation();
    }, 500);
  }

  /**
   * Run cross-file validation on the entire project
   */
  private async runCrossFileValidation(): Promise<void> {
    try {
      this.log("Running cross-file validation...");

      const issuesByFile = await this.crossFileValidator.validateProject();

      // Add cross-file diagnostics to existing diagnostics for each file
      for (const [filePath, issues] of issuesByFile.entries()) {
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);

        // Get existing diagnostics for this file
        const existingDiagnostics = Array.from(
          this.diagnosticCollection.get(uri) || []
        );

        // Convert cross-file issues to diagnostics
        const crossFileDiagnostics = this.convertCrossFileIssuesToDiagnostics(
          issues,
          document
        );

        // Merge with existing diagnostics
        const allDiagnostics = [
          ...existingDiagnostics,
          ...crossFileDiagnostics,
        ];

        this.diagnosticCollection.set(uri, allDiagnostics);
      }

      this.log("Cross-file validation complete");
    } catch (error) {
      this.log(
        `Error during cross-file validation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert cross-file issues to VS Code diagnostics
   */
  private convertCrossFileIssuesToDiagnostics(
    issues: any[],
    document: vscode.TextDocument
  ): vscode.Diagnostic[] {
    return issues.map((issue) => {
      // Try to find the location of the referenced item in the document
      const range = this.findItemLocation(document, issue.itemName);

      const diagnostic = new vscode.Diagnostic(
        range || new vscode.Range(0, 0, 0, 0),
        issue.message,
        issue.severity
      );
      diagnostic.source = "Rasa (Cross-File)";
      diagnostic.code = issue.type;

      return diagnostic;
    });
  }

  /**
   * Try to find the location of an item (intent, action, slot, etc.) in the document
   */
  private findItemLocation(
    document: vscode.TextDocument,
    itemName: string
  ): vscode.Range | undefined {
    const text = document.getText();
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) {
        continue;
      }

      const index = line.indexOf(itemName);

      if (index !== -1) {
        // Check if this is likely the item definition/reference
        // (not in a comment, and not part of another word)
        const beforeChar = index > 0 ? line[index - 1] : " ";
        const afterChar =
          index + itemName.length < line.length
            ? line[index + itemName.length]
            : " ";

        // Simple check: item should be surrounded by non-word characters
        if (
          beforeChar &&
          afterChar &&
          !/\w/.test(beforeChar) &&
          !/\w/.test(afterChar)
        ) {
          return new vscode.Range(i, index, i, index + itemName.length);
        }
      }
    }

    return undefined;
  }

  /**
   * Check if a document is a Rasa-related YAML file
   */
  private isRasaFile(document: vscode.TextDocument): boolean {
    if (document.languageId !== "yaml") {
      return false;
    }

    // Check if file is in Rasa project
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return false;
    }

    // Check if it's a Rasa file based on path or naming convention
    const fileName = path.basename(document.uri.fsPath);
    const filePath = document.uri.fsPath;

    // Common Rasa file patterns
    const rasaFilePatterns = [
      "domain.yml",
      "domain.yaml",
      "config.yml",
      "config.yaml",
      "credentials.yml",
      "credentials.yaml",
      "endpoints.yml",
      "endpoints.yaml",
      /\/domain\//,
      /\/data\//,
      /nlu\.ya?ml$/,
      /stories\.ya?ml$/,
      /rules\.ya?ml$/,
    ];

    return rasaFilePatterns.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(filePath);
      }
      return fileName === pattern;
    });
  }

  /**
   * Validate all currently open documents
   */
  private validateAllOpenDocuments(): void {
    vscode.workspace.textDocuments.forEach((document) => {
      if (this.isRasaFile(document)) {
        this.validateDocument(document);
      }
    });
  }

  /**
   * Validate a file by its URI
   */
  private async validateFileByUri(uri: vscode.Uri): Promise<void> {
    const document = await vscode.workspace.openTextDocument(uri);
    if (this.isRasaFile(document)) {
      this.validateDocument(document);
    }
  }

  /**
   * Main validation method for a document
   */
  public async validateDocument(document: vscode.TextDocument): Promise<void> {
    // Check if diagnostics are enabled
    const config = vscode.workspace.getConfiguration("rasa-pro-vscode");
    if (!config.get<boolean>("enableDiagnostics", true)) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const content = document.getText();
    const fileName = path.basename(document.uri.fsPath);

    this.log(`Validating ${fileName}...`);

    try {
      // 1. Validate YAML syntax
      const syntaxErrors = this.yamlParser.validateYaml(
        content,
        document.uri.fsPath
      );
      diagnostics.push(...this.convertValidationErrors(syntaxErrors, document));

      // If there are syntax errors, don't proceed with schema validation
      if (
        syntaxErrors.some((e) => e.severity === vscode.DiagnosticSeverity.Error)
      ) {
        this.diagnosticCollection.set(document.uri, diagnostics);
        this.log(`Found ${diagnostics.length} syntax error(s) in ${fileName}`);
        return;
      }

      // 2. Validate Rasa-specific schema based on file type
      const schemaErrors = await this.validateRasaSchema(document, content);
      diagnostics.push(...schemaErrors);

      // Set diagnostics for this document (without cross-file validation here)
      // Cross-file validation is handled separately and debounced
      this.diagnosticCollection.set(document.uri, diagnostics);

      const errorCount = diagnostics.filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Error
      ).length;
      const warningCount = diagnostics.filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Warning
      ).length;

      this.log(
        `Validation complete for ${fileName}: ${errorCount} error(s), ${warningCount} warning(s)`
      );
    } catch (error) {
      this.log(
        `Error during validation of ${fileName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert ValidationError[] to vscode.Diagnostic[]
   */
  private convertValidationErrors(
    errors: ValidationError[],
    document: vscode.TextDocument
  ): vscode.Diagnostic[] {
    return errors.map((error) => {
      let range: vscode.Range;

      if (error.line !== undefined) {
        // YAML parser line numbers are 0-based
        const line = Math.max(0, error.line);
        const column =
          error.column !== undefined ? Math.max(0, error.column) : 0;

        // Get the actual line from the document
        if (line < document.lineCount) {
          const lineText = document.lineAt(line).text;
          const endColumn = column > 0 ? column + 1 : lineText.length;
          range = new vscode.Range(line, column, line, endColumn);
        } else {
          // Fallback if line is out of bounds
          range = new vscode.Range(0, 0, 0, 0);
        }
      } else {
        // No line info, use the first line
        range = new vscode.Range(0, 0, 0, 0);
      }

      const diagnostic = new vscode.Diagnostic(
        range,
        error.message,
        error.severity
      );
      diagnostic.source = "Rasa";

      return diagnostic;
    });
  }

  /**
   * Validate Rasa-specific schema based on file type
   */
  private async validateRasaSchema(
    document: vscode.TextDocument,
    content: string
  ): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];
    const filePath = document.uri.fsPath;

    try {
      // Parse the content
      const parseResult = this.yamlParser.parseContent(content, filePath);

      if (!parseResult.success || !parseResult.data) {
        return diagnostics;
      }

      // Validate based on file type
      if (this.isDomainFile(filePath)) {
        const domainErrors = this.yamlParser.validateDomain(
          parseResult.data as RasaDomain
        );
        diagnostics.push(
          ...this.convertValidationErrorsToDiagnostics(domainErrors, document)
        );
      }

      // Additional validation for specific file types can be added here
      // e.g., validateStories, validateNLU, validateRules, etc.
    } catch (error) {
      this.log(
        `Schema validation error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return diagnostics;
  }

  /**
   * Convert ValidationError[] to vscode.Diagnostic[] with better range detection
   */
  private convertValidationErrorsToDiagnostics(
    errors: ValidationError[],
    document: vscode.TextDocument
  ): vscode.Diagnostic[] {
    return errors.map((error) => {
      // Try to find the relevant line in the document
      let range: vscode.Range | undefined;

      // If error has line info, use it
      if (error.line !== undefined) {
        const line = Math.max(0, error.line);
        const column = error.column !== undefined ? error.column : 0;
        range = new vscode.Range(line, column, line, column + 1);
      } else {
        // Try to find the error location by searching for keywords in the message
        range = this.findErrorLocation(document, error.message);
      }

      // Fallback to first line if no range found
      if (!range) {
        range = new vscode.Range(0, 0, 0, 0);
      }

      const diagnostic = new vscode.Diagnostic(
        range,
        error.message,
        error.severity
      );
      diagnostic.source = "Rasa";

      return diagnostic;
    });
  }

  /**
   * Try to find the location of an error in the document based on error message
   */
  private findErrorLocation(
    document: vscode.TextDocument,
    errorMessage: string
  ): vscode.Range | undefined {
    // Extract potential field names from error message
    const fieldMatch = errorMessage.match(/'([^']+)'/);
    if (!fieldMatch || !fieldMatch[1]) {
      return undefined;
    }

    const fieldName = fieldMatch[1];
    const text = document.getText();

    // Search for the field name in the document
    const index = text.indexOf(fieldName);
    if (index === -1) {
      return undefined;
    }

    const position = document.positionAt(index);
    return new vscode.Range(
      position.line,
      position.character,
      position.line,
      position.character + fieldName.length
    );
  }

  /**
   * Check if a file is a domain file
   */
  private isDomainFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return (
      fileName === "domain.yml" ||
      fileName === "domain.yaml" ||
      filePath.includes("/domain/") ||
      filePath.includes("\\domain\\")
    );
  }

  /**
   * Clear all diagnostics
   */
  public clearAll(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Clear diagnostics for a specific file
   */
  public clearFile(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  /**
   * Get diagnostics for a specific file
   */
  public getDiagnostics(uri: vscode.Uri): readonly vscode.Diagnostic[] {
    return this.diagnosticCollection.get(uri) || [];
  }

  /**
   * Log message to output channel
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.crossFileValidationTimer) {
      clearTimeout(this.crossFileValidationTimer);
    }
    this.crossFileValidator.dispose();
    this.clearAll();
    this.disposables.forEach((d) => d.dispose());
    this.outputChannel.dispose();
  }
}
