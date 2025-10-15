import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Service responsible for integrating with Rasa CLI commands.
 * Handles command execution, validation, and terminal management.
 */
export class CliIntegrationService {
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }

  /**
   * Validates if Rasa is installed and accessible.
   * @returns Promise<boolean> True if Rasa is installed, false otherwise.
   */
  async validateRasaInstallation(): Promise<boolean> {
    try {
      const rasaExecutable = this.getRasaExecutable();
      const { stdout } = await execAsync(`${rasaExecutable} --version`);

      this.outputChannel.appendLine(`Rasa version: ${stdout.trim()}`);
      return true;
    } catch (error) {
      this.outputChannel.appendLine("❌ Rasa is not installed or not in PATH");
      this.outputChannel.appendLine("Please install Rasa: pip install rasa");
      vscode.window
        .showErrorMessage(
          "Rasa is not installed. Please install it first: pip install rasa",
          "Open Output"
        )
        .then((selection) => {
          if (selection === "Open Output") {
            this.outputChannel.show();
          }
        });
      return false;
    }
  }

  /**
   * Gets the Rasa executable path from configuration or defaults to 'rasa'.
   * @returns The Rasa executable command.
   */
  getRasaExecutable(): string {
    const config = vscode.workspace.getConfiguration("rasa-pro-vscode");
    return config.get<string>("rasaExecutable", "rasa");
  }

  /**
   * Gets the project root directory.
   * @returns The project root path or undefined if not in a workspace.
   */
  getProjectRoot(): string | undefined {
    const config = vscode.workspace.getConfiguration("rasa-pro-vscode");
    const configuredRoot = config.get<string>("projectRoot");

    if (configuredRoot) {
      return configuredRoot;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder?.uri.fsPath;
  }

  /**
   * Trains a Rasa model.
   * @param augmentation Number of augmentation rounds (optional).
   */
  async trainModel(augmentation?: number): Promise<void> {
    if (!(await this.validateRasaInstallation())) {
      return;
    }

    const projectRoot = this.getProjectRoot();
    if (!projectRoot) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }

    const rasaExecutable = this.getRasaExecutable();
    let command = `${rasaExecutable} train`;

    if (augmentation !== undefined && augmentation > 0) {
      command += ` --augmentation ${augmentation}`;
    }

    this.showStatusBarMessage("$(sync~spin) Training Rasa model...");
    this.outputChannel.show();
    this.outputChannel.appendLine(`\n🚀 Starting: ${command}`);
    this.outputChannel.appendLine(`📁 Project: ${projectRoot}`);
    this.outputChannel.appendLine("─".repeat(60));

    const terminal = vscode.window.createTerminal({
      name: "Rasa Training",
      cwd: projectRoot,
    });

    terminal.sendText(command);
    terminal.show();

    // Update status bar after a delay (training takes time)
    setTimeout(() => {
      this.hideStatusBarMessage();
    }, 5000);
  }

  /**
   * Runs the Rasa action server.
   * @param port The port to run the action server on (default: 5055).
   */
  async runActionServer(port: number = 5055): Promise<void> {
    if (!(await this.validateRasaInstallation())) {
      return;
    }

    const projectRoot = this.getProjectRoot();
    if (!projectRoot) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }

    const rasaExecutable = this.getRasaExecutable();
    const command = `${rasaExecutable} run actions --port ${port}`;

    this.outputChannel.show();
    this.outputChannel.appendLine(`\n🎬 Starting: ${command}`);
    this.outputChannel.appendLine(`📁 Project: ${projectRoot}`);
    this.outputChannel.appendLine("─".repeat(60));

    const terminal = vscode.window.createTerminal({
      name: "Rasa Action Server",
      cwd: projectRoot,
    });

    terminal.sendText(command);
    terminal.show();

    vscode.window.showInformationMessage(
      `Rasa action server starting on port ${port}`
    );
  }

  /**
   * Opens an interactive Rasa shell.
   */
  async openShell(): Promise<void> {
    if (!(await this.validateRasaInstallation())) {
      return;
    }

    const projectRoot = this.getProjectRoot();
    if (!projectRoot) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }

    const rasaExecutable = this.getRasaExecutable();
    const command = `${rasaExecutable} shell`;

    this.outputChannel.appendLine(`\n💬 Starting: ${command}`);
    this.outputChannel.appendLine(`📁 Project: ${projectRoot}`);
    this.outputChannel.appendLine("─".repeat(60));

    const terminal = vscode.window.createTerminal({
      name: "Rasa Shell",
      cwd: projectRoot,
    });

    terminal.sendText(command);
    terminal.show();
  }

  /**
   * Runs Rasa tests.
   */
  async runTests(): Promise<void> {
    if (!(await this.validateRasaInstallation())) {
      return;
    }

    const projectRoot = this.getProjectRoot();
    if (!projectRoot) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }

    const rasaExecutable = this.getRasaExecutable();
    const command = `${rasaExecutable} test`;

    this.showStatusBarMessage("$(beaker) Running Rasa tests...");
    this.outputChannel.show();
    this.outputChannel.appendLine(`\n🧪 Starting: ${command}`);
    this.outputChannel.appendLine(`📁 Project: ${projectRoot}`);
    this.outputChannel.appendLine("─".repeat(60));

    const terminal = vscode.window.createTerminal({
      name: "Rasa Test",
      cwd: projectRoot,
    });

    terminal.sendText(command);
    terminal.show();

    setTimeout(() => {
      this.hideStatusBarMessage();
    }, 3000);
  }

  /**
   * Shows a message in the status bar.
   * @param message The message to display.
   */
  private showStatusBarMessage(message: string): void {
    this.statusBarItem.text = message;
    this.statusBarItem.show();
  }

  /**
   * Hides the status bar message.
   */
  private hideStatusBarMessage(): void {
    this.statusBarItem.hide();
  }

  /**
   * Disposes of resources.
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
