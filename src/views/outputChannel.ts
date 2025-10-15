import * as vscode from "vscode";

/**
 * Manages the Rasa output channel for logging CLI operations and diagnostics.
 */
export class RasaOutputChannel {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Rasa");
  }

  /**
   * Gets the underlying VS Code output channel.
   */
  getChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }

  /**
   * Appends a line to the output channel.
   * @param message The message to append.
   */
  appendLine(message: string): void {
    this.outputChannel.appendLine(message);
  }

  /**
   * Appends text to the output channel without a newline.
   * @param message The message to append.
   */
  append(message: string): void {
    this.outputChannel.append(message);
  }

  /**
   * Shows the output channel.
   * @param preserveFocus If true, the output channel will not take focus.
   */
  show(preserveFocus: boolean = false): void {
    this.outputChannel.show(preserveFocus);
  }

  /**
   * Clears the output channel.
   */
  clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Logs an info message with a timestamp.
   * @param message The message to log.
   */
  info(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${timestamp}] ℹ️  ${message}`);
  }

  /**
   * Logs a warning message with a timestamp.
   * @param message The message to log.
   */
  warn(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${timestamp}] ⚠️  ${message}`);
  }

  /**
   * Logs an error message with a timestamp.
   * @param message The message to log.
   */
  error(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${timestamp}] ❌ ${message}`);
  }

  /**
   * Logs a success message with a timestamp.
   * @param message The message to log.
   */
  success(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${timestamp}] ✅ ${message}`);
  }

  /**
   * Logs a separator line.
   */
  separator(): void {
    this.outputChannel.appendLine("─".repeat(80));
  }

  /**
   * Disposes of the output channel.
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}
