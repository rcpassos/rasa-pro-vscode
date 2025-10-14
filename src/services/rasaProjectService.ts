import * as vscode from "vscode";
import * as path from "path";
import { glob } from "fast-glob";

/**
 * Service responsible for detecting and managing Rasa project information.
 * Handles project detection, file discovery, and workspace monitoring.
 */
export class RasaProjectService {
  private workspaceRoot: string | undefined;
  private isRasaProjectDetected: boolean = false;
  private projectFiles: Map<string, vscode.Uri> = new Map();
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private readonly outputChannel: vscode.OutputChannel;

  // Required files for Rasa project detection
  private readonly REQUIRED_FILES = ["domain.yml", "config.yml"];

  // Common Rasa file patterns
  private readonly RASA_FILE_PATTERNS = [
    "**/domain.yml",
    "**/domain/*.yml",
    "**/domain/*.yaml",
    "**/config.yml",
    "**/data/nlu/*.yml",
    "**/data/nlu/*.yaml",
    "**/data/stories/*.yml",
    "**/data/stories/*.yaml",
    "**/data/rules/*.yml",
    "**/data/rules/*.yaml",
    "**/nlu.yml",
    "**/stories.yml",
    "**/rules.yml",
    "**/endpoints.yml",
    "**/credentials.yml",
    "**/tests/*.yml",
    "**/tests/*.yaml",
  ];

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Rasa Pro");
  }

  /**
   * Initialize the Rasa project service.
   * Detects if the workspace contains a Rasa project and scans for relevant files.
   */
  async initialize(): Promise<void> {
    this.log("Initializing Rasa Project Service...");

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      this.log("No workspace folder found");
      return;
    }

    // For now, support only the first workspace folder
    const firstFolder = workspaceFolders[0];
    if (!firstFolder) {
      this.log("No workspace folder found");
      return;
    }

    this.workspaceRoot = firstFolder.uri.fsPath;
    this.log(`Workspace root: ${this.workspaceRoot}`);

    // Check if this is a Rasa project
    this.isRasaProjectDetected = await this.detectRasaProject();

    if (this.isRasaProjectDetected) {
      this.log("✓ Rasa project detected!");
      await this.scanProjectFiles();
      this.setupFileWatcher();
    } else {
      this.log("✗ No Rasa project detected in workspace");
    }
  }

  /**
   * Detects if the current workspace is a Rasa project.
   * Checks for the presence of required Rasa files.
   */
  private async detectRasaProject(): Promise<boolean> {
    if (!this.workspaceRoot) {
      return false;
    }

    try {
      // Check for required files
      for (const requiredFile of this.REQUIRED_FILES) {
        const files = await vscode.workspace.findFiles(
          `**/${requiredFile}`,
          "**/node_modules/**",
          1
        );

        if (files.length === 0) {
          this.log(`Required file not found: ${requiredFile}`);
          return false;
        }

        this.log(`✓ Found required file: ${requiredFile}`);
      }

      // Additional validation: check if domain.yml or domain/ contains valid Rasa structure
      const isValidDomain = await this.validateDomainStructure();
      if (!isValidDomain) {
        this.log("✗ Invalid domain structure detected");
        return false;
      }

      return true;
    } catch (error) {
      this.log(`Error during project detection: ${error}`);
      return false;
    }
  }

  /**
   * Validates that the domain file(s) contain valid Rasa structure.
   */
  private async validateDomainStructure(): Promise<boolean> {
    try {
      const domainFiles = await vscode.workspace.findFiles(
        "**/domain.yml",
        "**/node_modules/**",
        1
      );

      if (domainFiles.length > 0 && domainFiles[0]) {
        const content = await vscode.workspace.fs.readFile(domainFiles[0]);
        const text = Buffer.from(content).toString("utf8");

        // Basic validation: check for common Rasa domain keys
        const hasRasaStructure =
          /\b(intents|entities|slots|responses|actions|forms|version)\b/.test(
            text
          );
        return hasRasaStructure;
      }

      // Check for domain/ directory structure
      const domainDirFiles = await vscode.workspace.findFiles(
        "**/domain/*.yml",
        "**/node_modules/**",
        5
      );

      return domainDirFiles.length > 0;
    } catch (error) {
      this.log(`Error validating domain structure: ${error}`);
      return false;
    }
  }

  /**
   * Scans the project for all Rasa-related files and caches their URIs.
   */
  private async scanProjectFiles(): Promise<void> {
    if (!this.workspaceRoot) {
      return;
    }

    this.log("Scanning project files...");
    this.projectFiles.clear();

    try {
      const files = await glob(this.RASA_FILE_PATTERNS, {
        cwd: this.workspaceRoot,
        ignore: [
          "**/node_modules/**",
          "**/.venv/**",
          "**/venv/**",
          "**/.git/**",
        ],
        absolute: true,
        onlyFiles: true,
      });

      for (const file of files) {
        const uri = vscode.Uri.file(file);
        const relativePath = path.relative(this.workspaceRoot, file);
        this.projectFiles.set(relativePath, uri);
      }

      this.log(`Found ${this.projectFiles.size} Rasa files`);
    } catch (error) {
      this.log(`Error scanning project files: ${error}`);
    }
  }

  /**
   * Sets up file system watcher to monitor changes to YAML files.
   * Uses VS Code's built-in file watcher API.
   */
  private setupFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }

    // Watch for YAML file changes
    this.fileWatcher =
      vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");

    this.fileWatcher.onDidChange((uri) => {
      this.log(`File changed: ${uri.fsPath}`);
      this.refreshFile(uri);
    });

    this.fileWatcher.onDidCreate((uri) => {
      this.log(`File created: ${uri.fsPath}`);
      this.addFile(uri);
    });

    this.fileWatcher.onDidDelete((uri) => {
      this.log(`File deleted: ${uri.fsPath}`);
      this.removeFile(uri);
    });

    this.log("File watcher set up successfully");
  }

  /**
   * Refreshes a file in the project cache.
   */
  async refreshFile(uri: vscode.Uri): Promise<void> {
    if (!this.workspaceRoot) {
      return;
    }

    const relativePath = path.relative(this.workspaceRoot, uri.fsPath);

    // Check if this is a Rasa-related file
    if (this.isRasaFile(relativePath)) {
      this.projectFiles.set(relativePath, uri);
      this.log(`Refreshed file: ${relativePath}`);
    }
  }

  /**
   * Adds a new file to the project cache.
   */
  async addFile(uri: vscode.Uri): Promise<void> {
    if (!this.workspaceRoot) {
      return;
    }

    const relativePath = path.relative(this.workspaceRoot, uri.fsPath);

    if (this.isRasaFile(relativePath)) {
      this.projectFiles.set(relativePath, uri);
      this.log(`Added file: ${relativePath}`);

      // Re-check if this is now a Rasa project (in case domain.yml was just created)
      if (!this.isRasaProjectDetected) {
        await this.initialize();
      }
    }
  }

  /**
   * Removes a file from the project cache.
   */
  async removeFile(uri: vscode.Uri): Promise<void> {
    if (!this.workspaceRoot) {
      return;
    }

    const relativePath = path.relative(this.workspaceRoot, uri.fsPath);

    if (this.projectFiles.has(relativePath)) {
      this.projectFiles.delete(relativePath);
      this.log(`Removed file: ${relativePath}`);
    }
  }

  /**
   * Checks if a file path matches Rasa file patterns.
   */
  private isRasaFile(relativePath: string): boolean {
    // Check if file is in common Rasa directories or has Rasa-specific names
    const rasaPatterns = [
      /^domain\.yml$/,
      /^domain\/.*\.ya?ml$/,
      /^config\.yml$/,
      /^data\/.*\.ya?ml$/,
      /^nlu\.yml$/,
      /^stories\.yml$/,
      /^rules\.yml$/,
      /^endpoints\.yml$/,
      /^credentials\.yml$/,
      /^tests\/.*\.ya?ml$/,
    ];

    return rasaPatterns.some((pattern) => pattern.test(relativePath));
  }

  /**
   * Returns whether a Rasa project was detected in the workspace.
   */
  isRasaProject(): boolean {
    return this.isRasaProjectDetected;
  }

  /**
   * Gets the workspace root path.
   */
  getWorkspaceRoot(): string | undefined {
    return this.workspaceRoot;
  }

  /**
   * Gets all cached Rasa project files.
   */
  getProjectFiles(): Map<string, vscode.Uri> {
    return new Map(this.projectFiles);
  }

  /**
   * Gets files of a specific type (e.g., domain, nlu, stories).
   */
  getFilesByType(
    type: "domain" | "nlu" | "stories" | "rules" | "config" | "tests"
  ): vscode.Uri[] {
    const files: vscode.Uri[] = [];

    for (const [relativePath, uri] of this.projectFiles.entries()) {
      switch (type) {
        case "domain":
          if (
            relativePath.startsWith("domain") ||
            relativePath === "domain.yml"
          ) {
            files.push(uri);
          }
          break;
        case "nlu":
          if (relativePath.includes("nlu") || relativePath === "nlu.yml") {
            files.push(uri);
          }
          break;
        case "stories":
          if (
            relativePath.includes("stories") ||
            relativePath === "stories.yml"
          ) {
            files.push(uri);
          }
          break;
        case "rules":
          if (relativePath.includes("rules") || relativePath === "rules.yml") {
            files.push(uri);
          }
          break;
        case "config":
          if (relativePath === "config.yml") {
            files.push(uri);
          }
          break;
        case "tests":
          if (relativePath.startsWith("tests/")) {
            files.push(uri);
          }
          break;
      }
    }

    return files;
  }

  /**
   * Checks if a specific file exists in the project.
   */
  hasFile(relativePath: string): boolean {
    return this.projectFiles.has(relativePath);
  }

  /**
   * Gets all domain files (domain.yml or domain/*.yml).
   */
  getDomainFiles(): vscode.Uri[] {
    return this.getFilesByType("domain");
  }

  /**
   * Gets all NLU files.
   */
  getNLUFiles(): vscode.Uri[] {
    return this.getFilesByType("nlu");
  }

  /**
   * Gets all stories files.
   */
  getStoriesFiles(): vscode.Uri[] {
    return this.getFilesByType("stories");
  }

  /**
   * Gets all rules files.
   */
  getRulesFiles(): vscode.Uri[] {
    return this.getFilesByType("rules");
  }

  /**
   * Gets the Rasa executable path from configuration or defaults to 'rasa'.
   */
  getRasaExecutable(): string {
    const config = vscode.workspace.getConfiguration("rasa-pro-vscode");
    return config.get<string>("rasaExecutable", "rasa");
  }

  /**
   * Validates that Rasa CLI is installed and accessible.
   */
  async validateRasaInstallation(): Promise<boolean> {
    const executable = this.getRasaExecutable();

    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      await execAsync(`${executable} --version`);
      this.log(`✓ Rasa CLI found: ${executable}`);
      return true;
    } catch (error) {
      this.log(`✗ Rasa CLI not found: ${executable}`);
      vscode.window
        .showErrorMessage(
          `Rasa CLI not found. Please install Rasa or configure the path in settings.`,
          "Install Rasa",
          "Configure Path"
        )
        .then((selection) => {
          if (selection === "Install Rasa") {
            vscode.env.openExternal(
              vscode.Uri.parse("https://rasa.com/docs/rasa/installation")
            );
          } else if (selection === "Configure Path") {
            vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "rasa-pro-vscode.rasaExecutable"
            );
          }
        });
      return false;
    }
  }

  /**
   * Logs a message to the Rasa output channel.
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }

  /**
   * Disposes of resources used by the service.
   */
  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    this.outputChannel.dispose();
  }
}
