// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { RasaProjectService } from "./services/rasaProjectService";
import { RasaCompletionProvider } from "./providers/completionProvider";
import { RasaDiagnosticProvider } from "./providers/diagnosticProvider";
import { RasaHoverProvider } from "./providers/hoverProvider";

// Global reference to the Rasa project service
let rasaProjectService: RasaProjectService | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.log("Rasa Pro extension is activating...");

  // Initialize the Rasa project service
  rasaProjectService = new RasaProjectService();
  await rasaProjectService.initialize();

  // Register the service for disposal
  context.subscriptions.push(rasaProjectService);

  // Register providers only if a Rasa project was detected
  if (rasaProjectService.isRasaProject()) {
    vscode.window.showInformationMessage("Rasa project detected!");

    // Register completion provider for YAML files
    const completionProvider = new RasaCompletionProvider(rasaProjectService);
    const completionDisposable =
      vscode.languages.registerCompletionItemProvider(
        { language: "yaml", pattern: "**/*.{yml,yaml}" },
        completionProvider,
        ":", // Trigger on colon
        "-", // Trigger on dash (for list items)
        " " // Trigger on space
      );
    context.subscriptions.push(completionDisposable);
    context.subscriptions.push(completionProvider);

    console.log("Rasa completion provider registered");

    // Register diagnostic provider
    const diagnosticProvider = new RasaDiagnosticProvider(rasaProjectService);
    context.subscriptions.push(diagnosticProvider);
    console.log("Rasa diagnostic provider registered");

    // Register hover provider
    const hoverProvider = new RasaHoverProvider(rasaProjectService);
    const hoverDisposable = vscode.languages.registerHoverProvider(
      { language: "yaml", pattern: "**/*.{yml,yaml}" },
      hoverProvider
    );
    context.subscriptions.push(hoverDisposable);
    context.subscriptions.push(hoverProvider);
    console.log("Rasa hover provider registered");

    // TODO: Register commands

    console.log("Rasa Pro extension activated successfully");
  } else {
    console.log("No Rasa project detected in workspace");
  }

  // Register a test command for now
  const disposable = vscode.commands.registerCommand(
    "rasa-pro-vscode.helloWorld",
    () => {
      if (rasaProjectService?.isRasaProject()) {
        const fileCount = rasaProjectService.getProjectFiles().size;
        vscode.window.showInformationMessage(
          `Rasa Pro extension active! Found ${fileCount} Rasa files.`
        );
      } else {
        vscode.window.showInformationMessage("Hello from Rasa Pro extension!");
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Cleanup is handled automatically via context.subscriptions
  rasaProjectService = undefined;
}
