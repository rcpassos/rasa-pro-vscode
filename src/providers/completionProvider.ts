import * as vscode from "vscode";
import { RasaProjectService } from "../services/rasaProjectService";
import { YamlParserService, RasaDomain } from "../services/yamlParserService";

/**
 * Provides intelligent code completion for Rasa YAML files.
 * Supports autocomplete for intents, entities, slots, actions, and responses.
 */
export class RasaCompletionProvider implements vscode.CompletionItemProvider {
  private yamlParser: YamlParserService;
  private outputChannel: vscode.OutputChannel;

  // Cache for domain data to improve performance
  private domainCache: Map<string, RasaDomain> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_VALIDITY_MS = 5000; // 5 seconds

  constructor(private projectService: RasaProjectService) {
    this.yamlParser = YamlParserService.getInstance();
    this.outputChannel = vscode.window.createOutputChannel(
      "Rasa Completion Provider"
    );
  }

  /**
   * Main completion provider implementation.
   * Analyzes the current position and provides relevant completions.
   */
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList | undefined> {
    // Only provide completions for YAML files
    if (document.languageId !== "yaml") {
      return undefined;
    }

    // Get the current line and position context
    const line = document.lineAt(position.line);
    const lineText = line.text;
    const textBeforeCursor = lineText.substring(0, position.character);

    this.log(
      `Completion requested at line ${position.line}: "${textBeforeCursor}"`
    );

    try {
      // Refresh domain cache if needed
      await this.refreshDomainCache();

      // Determine completion context and provide appropriate suggestions
      const completions: vscode.CompletionItem[] = [];

      // Check for various completion contexts
      if (this.isIntentContext(textBeforeCursor, document, position)) {
        completions.push(...(await this.getIntentCompletions()));
      } else if (this.isEntityContext(textBeforeCursor, document, position)) {
        completions.push(...(await this.getEntityCompletions()));
      } else if (this.isSlotContext(textBeforeCursor, document, position)) {
        completions.push(...(await this.getSlotCompletions()));
      } else if (this.isActionContext(textBeforeCursor, document, position)) {
        completions.push(...(await this.getActionCompletions()));
      } else if (this.isResponseContext(textBeforeCursor, document, position)) {
        completions.push(...(await this.getResponseCompletions()));
      } else if (this.isFormContext(textBeforeCursor, document, position)) {
        completions.push(...(await this.getFormCompletions()));
      } else if (
        this.isSlotMappingTypeContext(textBeforeCursor, document, position)
      ) {
        completions.push(...this.getSlotMappingTypeCompletions());
      } else if (this.isSlotTypeContext(textBeforeCursor, document, position)) {
        completions.push(...this.getSlotTypeCompletions());
      }

      return completions;
    } catch (error) {
      this.log(`Error providing completions: ${error}`);
      return undefined;
    }
  }

  /**
   * Checks if the current position is in an intent context.
   */
  private isIntentContext(
    textBeforeCursor: string,
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Check for "intent:" in stories/rules
    if (
      /^\s*-?\s*intent:\s*\w*$/.test(textBeforeCursor) ||
      /^\s*-?\s*intent:\s*$/.test(textBeforeCursor)
    ) {
      return true;
    }

    // Check for intent list in domain (under "intents:" section)
    if (/^\s*-\s*\w*$/.test(textBeforeCursor)) {
      // Look backwards to find if we're in an intents section
      for (let i = position.line - 1; i >= 0; i--) {
        const prevLine = document.lineAt(i).text;
        if (/^intents:\s*$/.test(prevLine)) {
          return true;
        }
        // Stop if we hit another top-level key
        if (/^\w+:\s*$/.test(prevLine)) {
          break;
        }
      }
    }

    return false;
  }

  /**
   * Checks if the current position is in an entity context.
   */
  private isEntityContext(
    textBeforeCursor: string,
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Check for entity list in domain (under "entities:" section)
    if (/^\s*-\s*\w*$/.test(textBeforeCursor)) {
      // Look backwards to find if we're in an entities section
      for (let i = position.line - 1; i >= 0; i--) {
        const prevLine = document.lineAt(i).text;
        if (/^entities:\s*$/.test(prevLine)) {
          return true;
        }
        // Stop if we hit another top-level key
        if (/^\w+:\s*$/.test(prevLine)) {
          break;
        }
      }
    }

    // Check for entity references in slot mappings
    if (/^\s*-?\s*entity:\s*\w*$/.test(textBeforeCursor)) {
      return true;
    }

    return false;
  }

  /**
   * Checks if the current position is in a slot context.
   */
  private isSlotContext(
    textBeforeCursor: string,
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Check for slot references in slot_was_set conditions
    if (/^\s*-?\s*slot_was_set:\s*$/.test(textBeforeCursor)) {
      return true;
    }

    // Check for required_slots in forms
    if (/^\s*-\s*\w*$/.test(textBeforeCursor)) {
      for (let i = position.line - 1; i >= 0; i--) {
        const prevLine = document.lineAt(i).text;
        if (/^\s+required_slots:\s*$/.test(prevLine)) {
          return true;
        }
        if (/^\w+:\s*$/.test(prevLine)) {
          break;
        }
      }
    }

    return false;
  }

  /**
   * Checks if the current position is in an action context.
   */
  private isActionContext(
    textBeforeCursor: string,
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Check for "action:" in stories/rules
    if (
      /^\s*-?\s*action:\s*\w*$/.test(textBeforeCursor) ||
      /^\s*-?\s*action:\s*$/.test(textBeforeCursor)
    ) {
      return true;
    }

    // Check for action list in domain (under "actions:" section)
    if (/^\s*-\s*\w*$/.test(textBeforeCursor)) {
      for (let i = position.line - 1; i >= 0; i--) {
        const prevLine = document.lineAt(i).text;
        if (/^actions:\s*$/.test(prevLine)) {
          return true;
        }
        if (/^\w+:\s*$/.test(prevLine)) {
          break;
        }
      }
    }

    return false;
  }

  /**
   * Checks if the current position is in a response context.
   */
  private isResponseContext(
    textBeforeCursor: string,
    _document: vscode.TextDocument,
    _position: vscode.Position
  ): boolean {
    // Check for action that starts with "utter_" (responses)
    if (
      /^\s*-?\s*action:\s*utter_\w*$/.test(textBeforeCursor) ||
      /^\s*-?\s*action:\s*utter_$/.test(textBeforeCursor)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Checks if the current position is in a form context.
   */
  private isFormContext(
    textBeforeCursor: string,
    _document: vscode.TextDocument,
    _position: vscode.Position
  ): boolean {
    // Check for active_loop in stories/rules
    if (
      /^\s*-?\s*active_loop:\s*\w*$/.test(textBeforeCursor) ||
      /^\s*-?\s*active_loop:\s*$/.test(textBeforeCursor)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Checks if the current position is in a slot type context.
   */
  private isSlotTypeContext(
    textBeforeCursor: string,
    _document: vscode.TextDocument,
    _position: vscode.Position
  ): boolean {
    return /^\s*type:\s*\w*$/.test(textBeforeCursor);
  }

  /**
   * Checks if the current position is in a slot mapping type context.
   */
  private isSlotMappingTypeContext(
    textBeforeCursor: string,
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Check if we're inside a mappings array and typing "type:"
    if (/^\s*-?\s*type:\s*\w*$/.test(textBeforeCursor)) {
      // Look backwards to confirm we're in a mappings section
      for (let i = position.line - 1; i >= 0; i--) {
        const prevLine = document.lineAt(i).text;
        if (/^\s+mappings:\s*$/.test(prevLine)) {
          return true;
        }
        if (/^\s+\w+:\s*$/.test(prevLine) && !/mappings/.test(prevLine)) {
          break;
        }
      }
    }

    return false;
  }

  /**
   * Gets intent completions from domain files.
   */
  private async getIntentCompletions(): Promise<vscode.CompletionItem[]> {
    const intents = await this.getAllIntents();
    return intents.map((intent) => {
      const item = new vscode.CompletionItem(
        intent,
        vscode.CompletionItemKind.Value
      );
      item.detail = "Intent";
      item.documentation = new vscode.MarkdownString(
        `Intent: \`${intent}\`\n\nDefined in domain`
      );
      item.sortText = `0_${intent}`; // Sort intents at the top
      return item;
    });
  }

  /**
   * Gets entity completions from domain files.
   */
  private async getEntityCompletions(): Promise<vscode.CompletionItem[]> {
    const entities = await this.getAllEntities();
    return entities.map((entity) => {
      const item = new vscode.CompletionItem(
        entity,
        vscode.CompletionItemKind.Variable
      );
      item.detail = "Entity";
      item.documentation = new vscode.MarkdownString(
        `Entity: \`${entity}\`\n\nDefined in domain`
      );
      item.sortText = `0_${entity}`;
      return item;
    });
  }

  /**
   * Gets slot completions from domain files.
   */
  private async getSlotCompletions(): Promise<vscode.CompletionItem[]> {
    const slots = await this.getAllSlots();
    return slots.map((slot) => {
      const item = new vscode.CompletionItem(
        slot,
        vscode.CompletionItemKind.Field
      );
      item.detail = "Slot";
      item.documentation = new vscode.MarkdownString(
        `Slot: \`${slot}\`\n\nDefined in domain`
      );
      item.sortText = `0_${slot}`;
      return item;
    });
  }

  /**
   * Gets action completions from domain files.
   */
  private async getActionCompletions(): Promise<vscode.CompletionItem[]> {
    const actions = await this.getAllActions();
    const responses = await this.getAllResponses();

    // Combine actions and responses (responses are also actions)
    const allActions = [...new Set([...actions, ...responses])];

    return allActions.map((action) => {
      const isResponse = action.startsWith("utter_");
      const item = new vscode.CompletionItem(
        action,
        isResponse
          ? vscode.CompletionItemKind.Text
          : vscode.CompletionItemKind.Method
      );
      item.detail = isResponse ? "Response" : "Action";
      item.documentation = new vscode.MarkdownString(
        `${
          isResponse ? "Response" : "Action"
        }: \`${action}\`\n\nDefined in domain`
      );
      item.sortText = isResponse ? `0_${action}` : `1_${action}`; // Prioritize responses
      return item;
    });
  }

  /**
   * Gets response completions from domain files.
   */
  private async getResponseCompletions(): Promise<vscode.CompletionItem[]> {
    const responses = await this.getAllResponses();
    return responses.map((response) => {
      const item = new vscode.CompletionItem(
        response,
        vscode.CompletionItemKind.Text
      );
      item.detail = "Response";
      item.documentation = new vscode.MarkdownString(
        `Response: \`${response}\`\n\nDefined in domain`
      );
      item.sortText = `0_${response}`;
      return item;
    });
  }

  /**
   * Gets form completions from domain files.
   */
  private async getFormCompletions(): Promise<vscode.CompletionItem[]> {
    const forms = await this.getAllForms();
    return forms.map((form) => {
      const item = new vscode.CompletionItem(
        form,
        vscode.CompletionItemKind.Class
      );
      item.detail = "Form";
      item.documentation = new vscode.MarkdownString(
        `Form: \`${form}\`\n\nDefined in domain`
      );
      item.sortText = `0_${form}`;
      return item;
    });
  }

  /**
   * Gets slot type completions (text, bool, categorical, float, list, any).
   */
  private getSlotTypeCompletions(): vscode.CompletionItem[] {
    const slotTypes = ["text", "bool", "categorical", "float", "list", "any"];

    return slotTypes.map((type) => {
      const item = new vscode.CompletionItem(
        type,
        vscode.CompletionItemKind.Keyword
      );
      item.detail = "Slot Type";
      item.documentation = new vscode.MarkdownString(
        this.getSlotTypeDocumentation(type)
      );
      item.sortText = `0_${type}`;
      return item;
    });
  }

  /**
   * Gets slot mapping type completions (from_entity, from_text, from_intent, custom).
   */
  private getSlotMappingTypeCompletions(): vscode.CompletionItem[] {
    const mappingTypes = ["from_entity", "from_text", "from_intent", "custom"];

    return mappingTypes.map((type) => {
      const item = new vscode.CompletionItem(
        type,
        vscode.CompletionItemKind.Keyword
      );
      item.detail = "Slot Mapping Type";
      item.documentation = new vscode.MarkdownString(
        this.getSlotMappingTypeDocumentation(type)
      );
      item.sortText = `0_${type}`;
      return item;
    });
  }

  /**
   * Returns documentation for slot types.
   */
  private getSlotTypeDocumentation(type: string): string {
    const docs: { [key: string]: string } = {
      text: "**Text Slot**\n\nStores text values. Best for free-form text like names, messages, etc.",
      bool: "**Boolean Slot**\n\nStores true/false values. Useful for binary flags.",
      categorical:
        "**Categorical Slot**\n\nStores values from a predefined list of options.",
      float:
        "**Float Slot**\n\nStores numerical values. Can be used for amounts, ratings, etc.",
      list: "**List Slot**\n\nStores lists of values. Useful for collecting multiple items.",
      any: "**Any Slot**\n\nStores any value. Does not influence conversation flow.",
    };

    return docs[type] || "";
  }

  /**
   * Returns documentation for slot mapping types.
   */
  private getSlotMappingTypeDocumentation(type: string): string {
    const docs: { [key: string]: string } = {
      from_entity:
        "**From Entity**\n\nMaps an entity value to the slot.\n\nExample:\n```yaml\nmappings:\n  - type: from_entity\n    entity: location\n```",
      from_text:
        "**From Text**\n\nMaps the entire user message text to the slot.\n\nExample:\n```yaml\nmappings:\n  - type: from_text\n```",
      from_intent:
        "**From Intent**\n\nMaps a fixed value when a specific intent is detected.\n\nExample:\n```yaml\nmappings:\n  - type: from_intent\n    intent: affirm\n    value: true\n```",
      custom:
        "**Custom**\n\nUses a custom action to fill the slot.\n\nExample:\n```yaml\nmappings:\n  - type: custom\n    action: action_custom_slot_mapping\n```",
    };

    return docs[type] || "";
  }

  /**
   * Refreshes the domain cache by parsing all domain files.
   */
  private async refreshDomainCache(): Promise<void> {
    const now = Date.now();

    // Only refresh if cache is older than validity period
    if (now - this.lastCacheUpdate < this.CACHE_VALIDITY_MS) {
      return;
    }

    this.domainCache.clear();
    const domainFiles = this.projectService.getFilesByType("domain");

    for (const fileUri of domainFiles) {
      try {
        const result = await this.yamlParser.parseDomain(fileUri.fsPath);
        if (result.success && result.data) {
          this.domainCache.set(fileUri.fsPath, result.data);
        }
      } catch (error) {
        this.log(`Error parsing domain file ${fileUri.fsPath}: ${error}`);
      }
    }

    this.lastCacheUpdate = now;
    this.log(`Domain cache refreshed with ${this.domainCache.size} files`);
  }

  /**
   * Gets all intents from cached domain data.
   */
  private async getAllIntents(): Promise<string[]> {
    const intents = new Set<string>();

    for (const domain of this.domainCache.values()) {
      const domainIntents = this.yamlParser.extractIntents(domain);
      domainIntents.forEach((intent) => intents.add(intent));
    }

    return Array.from(intents).sort();
  }

  /**
   * Gets all entities from cached domain data.
   */
  private async getAllEntities(): Promise<string[]> {
    const entities = new Set<string>();

    for (const domain of this.domainCache.values()) {
      const domainEntities = this.yamlParser.extractEntities(domain);
      domainEntities.forEach((entity) => entities.add(entity));
    }

    return Array.from(entities).sort();
  }

  /**
   * Gets all slots from cached domain data.
   */
  private async getAllSlots(): Promise<string[]> {
    const slots = new Set<string>();

    for (const domain of this.domainCache.values()) {
      const domainSlots = this.yamlParser.extractSlots(domain);
      domainSlots.forEach((slot) => slots.add(slot));
    }

    return Array.from(slots).sort();
  }

  /**
   * Gets all actions from cached domain data.
   */
  private async getAllActions(): Promise<string[]> {
    const actions = new Set<string>();

    for (const domain of this.domainCache.values()) {
      const domainActions = this.yamlParser.extractActions(domain);
      domainActions.forEach((action) => actions.add(action));
    }

    return Array.from(actions).sort();
  }

  /**
   * Gets all responses from cached domain data.
   */
  private async getAllResponses(): Promise<string[]> {
    const responses = new Set<string>();

    for (const domain of this.domainCache.values()) {
      const domainResponses = this.yamlParser.extractResponses(domain);
      domainResponses.forEach((response) => responses.add(response));
    }

    return Array.from(responses).sort();
  }

  /**
   * Gets all forms from cached domain data.
   */
  private async getAllForms(): Promise<string[]> {
    const forms = new Set<string>();

    for (const domain of this.domainCache.values()) {
      const domainForms = this.yamlParser.extractForms(domain);
      domainForms.forEach((form) => forms.add(form));
    }

    return Array.from(forms).sort();
  }

  /**
   * Logs a message to the output channel.
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }

  /**
   * Clears the domain cache (useful when domain files are modified).
   */
  public clearCache(): void {
    this.domainCache.clear();
    this.lastCacheUpdate = 0;
    this.log("Domain cache cleared");
  }

  /**
   * Disposes of resources.
   */
  public dispose(): void {
    this.domainCache.clear();
    this.outputChannel.dispose();
  }
}
