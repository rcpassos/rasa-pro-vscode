import * as vscode from "vscode";
import { RasaProjectService } from "../services/rasaProjectService";
import { YamlParserService, RasaDomain } from "../services/yamlParserService";

/**
 * Provides hover information for Rasa YAML files.
 * Shows definitions, documentation, and navigation links for Rasa elements.
 */
export class RasaHoverProvider implements vscode.HoverProvider {
  private yamlParser: YamlParserService;
  private outputChannel: vscode.OutputChannel;

  // Cache for domain data to improve performance
  private domainCache: Map<string, RasaDomain> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_VALIDITY_MS = 5000; // 5 seconds

  constructor(private projectService: RasaProjectService) {
    this.yamlParser = YamlParserService.getInstance();
    this.outputChannel = vscode.window.createOutputChannel(
      "Rasa Hover Provider"
    );
  }

  /**
   * Main hover provider implementation.
   * Analyzes the word under cursor and provides relevant hover information.
   */
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    // Only provide hover for YAML files
    if (document.languageId !== "yaml") {
      return undefined;
    }

    try {
      // Refresh domain cache if needed
      await this.refreshDomainCache();

      // Get the word range at the current position
      const wordRange = document.getWordRangeAtPosition(position, /[\w_-]+/);
      if (!wordRange) {
        return undefined;
      }

      const word = document.getText(wordRange);
      const line = document.lineAt(position.line);
      const lineText = line.text;

      this.log(`Hover requested for word: "${word}" at line ${position.line}`);

      // Determine what type of element the user is hovering over
      // and provide appropriate hover information
      const hover = await this.getHoverForElement(word, lineText, document);

      return hover;
    } catch (error) {
      this.log(`Error providing hover: ${error}`);
      return undefined;
    }
  }

  /**
   * Determines the type of element and returns appropriate hover information.
   */
  private async getHoverForElement(
    word: string,
    lineText: string,
    document: vscode.TextDocument
  ): Promise<vscode.Hover | undefined> {
    // Check if it's an intent
    if (this.isIntentLine(lineText) || lineText.includes("intent:")) {
      return this.getIntentHover(word, document);
    }

    // Check if it's an entity
    if (this.isEntityLine(lineText) || lineText.includes("entity:")) {
      return this.getEntityHover(word, document);
    }

    // Check if it's a slot
    if (
      this.isSlotLine(lineText) ||
      lineText.includes("slot_was_set") ||
      lineText.includes("requested_slot")
    ) {
      return this.getSlotHover(word, document);
    }

    // Check if it's an action
    if (this.isActionLine(lineText) || lineText.includes("action:")) {
      return this.getActionHover(word, document);
    }

    // Check if it's a response (utter_*)
    if (word.startsWith("utter_") || lineText.trim().startsWith(word + ":")) {
      return this.getResponseHover(word, document);
    }

    // Check if it's a form
    if (this.isFormLine(lineText) || lineText.includes("active_loop:")) {
      return this.getFormHover(word, document);
    }

    return undefined;
  }

  /**
   * Returns hover information for an intent.
   */
  private async getIntentHover(
    intentName: string,
    _document: vscode.TextDocument
  ): Promise<vscode.Hover | undefined> {
    const domains = Array.from(this.domainCache.values());
    const allIntents = this.getAllIntents(domains);

    if (!allIntents.has(intentName)) {
      return undefined;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`**Intent**: \`${intentName}\`\n\n`);
    markdown.appendMarkdown(`---\n\n`);

    // Find the definition location
    const definitionLocation = await this.findIntentDefinition(intentName);
    if (definitionLocation) {
      const fileLink = this.createFileLink(
        definitionLocation.uri,
        definitionLocation.range
      );
      markdown.appendMarkdown(`📍 [Go to definition](${fileLink})\n\n`);
    }

    // Find usage examples in NLU files
    const examples = await this.findIntentExamples(intentName);
    if (examples.length > 0) {
      markdown.appendMarkdown(`**Example utterances:**\n\n`);
      examples.slice(0, 3).forEach((example) => {
        markdown.appendMarkdown(`- ${example}\n`);
      });
      if (examples.length > 3) {
        markdown.appendMarkdown(`\n_...and ${examples.length - 3} more_\n`);
      }
    }

    return new vscode.Hover(markdown);
  }

  /**
   * Returns hover information for an entity.
   */
  private async getEntityHover(
    entityName: string,
    _document: vscode.TextDocument
  ): Promise<vscode.Hover | undefined> {
    const domains = Array.from(this.domainCache.values());
    const allEntities = this.getAllEntities(domains);

    if (!allEntities.has(entityName)) {
      return undefined;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`**Entity**: \`${entityName}\`\n\n`);
    markdown.appendMarkdown(`---\n\n`);

    // Find the definition location
    const definitionLocation = await this.findEntityDefinition(entityName);
    if (definitionLocation) {
      const fileLink = this.createFileLink(
        definitionLocation.uri,
        definitionLocation.range
      );
      markdown.appendMarkdown(`📍 [Go to definition](${fileLink})\n\n`);
    }

    // Check if it's used in any slots
    const usedInSlots = this.findSlotsUsingEntity(entityName, domains);
    if (usedInSlots.length > 0) {
      markdown.appendMarkdown(`**Used in slots:**\n\n`);
      usedInSlots.forEach((slot) => {
        markdown.appendMarkdown(`- \`${slot}\`\n`);
      });
    }

    return new vscode.Hover(markdown);
  }

  /**
   * Returns hover information for a slot.
   */
  private async getSlotHover(
    slotName: string,
    _document: vscode.TextDocument
  ): Promise<vscode.Hover | undefined> {
    const domains = Array.from(this.domainCache.values());
    const slotInfo = this.getSlotInfo(slotName, domains);

    if (!slotInfo) {
      return undefined;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`**Slot**: \`${slotName}\`\n\n`);
    markdown.appendMarkdown(`---\n\n`);

    // Find the definition location
    const definitionLocation = await this.findSlotDefinition(slotName);
    if (definitionLocation) {
      const fileLink = this.createFileLink(
        definitionLocation.uri,
        definitionLocation.range
      );
      markdown.appendMarkdown(`📍 [Go to definition](${fileLink})\n\n`);
    }

    // Show slot properties
    if (slotInfo.type) {
      markdown.appendMarkdown(`**Type**: \`${slotInfo.type}\`\n\n`);
    }

    if (slotInfo.influence_conversation !== undefined) {
      markdown.appendMarkdown(
        `**Influences conversation**: ${
          slotInfo.influence_conversation ? "✓" : "✗"
        }\n\n`
      );
    }

    if (slotInfo.mappings && slotInfo.mappings.length > 0) {
      markdown.appendMarkdown(`**Mappings**:\n\n`);
      slotInfo.mappings.forEach((mapping: any) => {
        const mappingType = mapping.type || "unknown";
        markdown.appendMarkdown(`- Type: \`${mappingType}\`\n`);
        if (mapping.entity) {
          markdown.appendMarkdown(`  - Entity: \`${mapping.entity}\`\n`);
        }
      });
    }

    return new vscode.Hover(markdown);
  }

  /**
   * Returns hover information for an action.
   */
  private async getActionHover(
    actionName: string,
    _document: vscode.TextDocument
  ): Promise<vscode.Hover | undefined> {
    const domains = Array.from(this.domainCache.values());
    const allActions = this.getAllActions(domains);

    if (!allActions.has(actionName)) {
      return undefined;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`**Action**: \`${actionName}\`\n\n`);
    markdown.appendMarkdown(`---\n\n`);

    // Determine if it's a custom action or built-in
    if (actionName.startsWith("action_")) {
      markdown.appendMarkdown(`**Type**: Custom action\n\n`);

      // Try to find the action in actions.py
      const actionPyLocation = await this.findCustomActionInPython(actionName);
      if (actionPyLocation) {
        const fileLink = this.createFileLink(
          actionPyLocation.uri,
          actionPyLocation.range
        );
        markdown.appendMarkdown(`📍 [View implementation](${fileLink})\n\n`);
        markdown.appendMarkdown(`💡 _Defined in Python action server_\n`);
      } else {
        markdown.appendMarkdown(
          `⚠️ _Implementation not found in actions.py_\n`
        );
      }
    } else if (actionName.startsWith("utter_")) {
      markdown.appendMarkdown(`**Type**: Response action\n\n`);
      markdown.appendMarkdown(
        `💡 _This action sends a response to the user_\n`
      );
    } else {
      markdown.appendMarkdown(`**Type**: Built-in action\n\n`);
      markdown.appendMarkdown(`💡 _Rasa core action_\n`);
    }

    // Find domain definition
    const definitionLocation = await this.findActionDefinition(actionName);
    if (definitionLocation) {
      const fileLink = this.createFileLink(
        definitionLocation.uri,
        definitionLocation.range
      );
      markdown.appendMarkdown(`📍 [Domain definition](${fileLink})\n\n`);
    }

    return new vscode.Hover(markdown);
  }

  /**
   * Returns hover information for a response.
   */
  private async getResponseHover(
    responseName: string,
    _document: vscode.TextDocument
  ): Promise<vscode.Hover | undefined> {
    const domains = Array.from(this.domainCache.values());
    const responseInfo = this.getResponseInfo(responseName, domains);

    if (!responseInfo) {
      return undefined;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`**Response**: \`${responseName}\`\n\n`);
    markdown.appendMarkdown(`---\n\n`);

    // Find the definition location
    const definitionLocation = await this.findResponseDefinition(responseName);
    if (definitionLocation) {
      const fileLink = this.createFileLink(
        definitionLocation.uri,
        definitionLocation.range
      );
      markdown.appendMarkdown(`📍 [Go to definition](${fileLink})\n\n`);
    }

    // Show response variations
    if (Array.isArray(responseInfo) && responseInfo.length > 0) {
      markdown.appendMarkdown(
        `**Response variations** (${responseInfo.length}):\n\n`
      );

      responseInfo.slice(0, 3).forEach((variation: any, index: number) => {
        if (variation.text) {
          markdown.appendMarkdown(`${index + 1}. "${variation.text}"\n`);
        }
        if (variation.image) {
          markdown.appendMarkdown(`   - 🖼️ Includes image\n`);
        }
        if (variation.buttons) {
          markdown.appendMarkdown(
            `   - 🔘 Includes ${variation.buttons.length} buttons\n`
          );
        }
      });

      if (responseInfo.length > 3) {
        markdown.appendMarkdown(
          `\n_...and ${responseInfo.length - 3} more variations_\n`
        );
      }
    }

    return new vscode.Hover(markdown);
  }

  /**
   * Returns hover information for a form.
   */
  private async getFormHover(
    formName: string,
    _document: vscode.TextDocument
  ): Promise<vscode.Hover | undefined> {
    const domains = Array.from(this.domainCache.values());
    const formInfo = this.getFormInfo(formName, domains);

    if (!formInfo) {
      return undefined;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`**Form**: \`${formName}\`\n\n`);
    markdown.appendMarkdown(`---\n\n`);

    // Find the definition location
    const definitionLocation = await this.findFormDefinition(formName);
    if (definitionLocation) {
      const fileLink = this.createFileLink(
        definitionLocation.uri,
        definitionLocation.range
      );
      markdown.appendMarkdown(`📍 [Go to definition](${fileLink})\n\n`);
    }

    // Show required slots
    if (formInfo.required_slots && Array.isArray(formInfo.required_slots)) {
      markdown.appendMarkdown(
        `**Required slots** (${formInfo.required_slots.length}):\n\n`
      );
      formInfo.required_slots.forEach((slot: string) => {
        markdown.appendMarkdown(`- \`${slot}\`\n`);
      });
    }

    markdown.appendMarkdown(
      `\n💡 _Forms are used to collect information from users_\n`
    );

    return new vscode.Hover(markdown);
  }

  // ========== Helper Methods ==========

  /**
   * Refreshes the domain cache if it's stale.
   */
  private async refreshDomainCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.CACHE_VALIDITY_MS) {
      return; // Cache is still valid
    }

    this.domainCache.clear();
    const domainFiles = this.projectService.getDomainFiles();

    for (const file of domainFiles) {
      const result = await this.yamlParser.parseFile<RasaDomain>(file.fsPath);
      if (result.success && result.data) {
        this.domainCache.set(file.fsPath, result.data);
      }
    }

    this.lastCacheUpdate = now;
  }

  /**
   * Gets all intents from all domain files.
   */
  private getAllIntents(domains: RasaDomain[]): Set<string> {
    const intents = new Set<string>();

    for (const domain of domains) {
      if (domain.intents) {
        for (const intent of domain.intents) {
          if (typeof intent === "string") {
            intents.add(intent);
          } else if (typeof intent === "object") {
            // Handle object format: {name: properties}
            Object.keys(intent).forEach((key) => intents.add(key));
          }
        }
      }
    }

    return intents;
  }

  /**
   * Gets all entities from all domain files.
   */
  private getAllEntities(domains: RasaDomain[]): Set<string> {
    const entities = new Set<string>();

    for (const domain of domains) {
      if (domain.entities) {
        for (const entity of domain.entities) {
          if (typeof entity === "string") {
            entities.add(entity);
          } else if (typeof entity === "object") {
            Object.keys(entity).forEach((key) => entities.add(key));
          }
        }
      }
    }

    return entities;
  }

  /**
   * Gets all actions from all domain files.
   */
  private getAllActions(domains: RasaDomain[]): Set<string> {
    const actions = new Set<string>();

    for (const domain of domains) {
      if (domain.actions) {
        domain.actions.forEach((action) => actions.add(action));
      }
      // Also add all responses as they are callable actions
      if (domain.responses) {
        Object.keys(domain.responses).forEach((response) =>
          actions.add(response)
        );
      }
    }

    return actions;
  }

  /**
   * Gets slot information from domains.
   */
  private getSlotInfo(
    slotName: string,
    domains: RasaDomain[]
  ): any | undefined {
    for (const domain of domains) {
      if (domain.slots && domain.slots[slotName]) {
        return domain.slots[slotName];
      }
    }
    return undefined;
  }

  /**
   * Gets response information from domains.
   */
  private getResponseInfo(
    responseName: string,
    domains: RasaDomain[]
  ): any | undefined {
    for (const domain of domains) {
      if (domain.responses && domain.responses[responseName]) {
        return domain.responses[responseName];
      }
    }
    return undefined;
  }

  /**
   * Gets form information from domains.
   */
  private getFormInfo(
    formName: string,
    domains: RasaDomain[]
  ): any | undefined {
    for (const domain of domains) {
      if (domain.forms && domain.forms[formName]) {
        return domain.forms[formName];
      }
    }
    return undefined;
  }

  /**
   * Finds slots that use a specific entity.
   */
  private findSlotsUsingEntity(
    entityName: string,
    domains: RasaDomain[]
  ): string[] {
    const slots: string[] = [];

    for (const domain of domains) {
      if (domain.slots) {
        for (const [slotName, slotInfo] of Object.entries(domain.slots)) {
          if (slotInfo.mappings && Array.isArray(slotInfo.mappings)) {
            for (const mapping of slotInfo.mappings) {
              if (mapping.entity === entityName) {
                slots.push(slotName);
                break;
              }
            }
          }
        }
      }
    }

    return slots;
  }

  /**
   * Finds the definition location of an intent.
   */
  private async findIntentDefinition(
    intentName: string
  ): Promise<vscode.Location | undefined> {
    return this.findDefinitionInDomain(intentName, "intents");
  }

  /**
   * Finds the definition location of an entity.
   */
  private async findEntityDefinition(
    entityName: string
  ): Promise<vscode.Location | undefined> {
    return this.findDefinitionInDomain(entityName, "entities");
  }

  /**
   * Finds the definition location of a slot.
   */
  private async findSlotDefinition(
    slotName: string
  ): Promise<vscode.Location | undefined> {
    return this.findDefinitionInDomain(slotName, "slots");
  }

  /**
   * Finds the definition location of an action.
   */
  private async findActionDefinition(
    actionName: string
  ): Promise<vscode.Location | undefined> {
    return this.findDefinitionInDomain(actionName, "actions");
  }

  /**
   * Finds the definition location of a response.
   */
  private async findResponseDefinition(
    responseName: string
  ): Promise<vscode.Location | undefined> {
    return this.findDefinitionInDomain(responseName, "responses");
  }

  /**
   * Finds the definition location of a form.
   */
  private async findFormDefinition(
    formName: string
  ): Promise<vscode.Location | undefined> {
    return this.findDefinitionInDomain(formName, "forms");
  }

  /**
   * Generic method to find a definition in domain files.
   */
  private async findDefinitionInDomain(
    name: string,
    section: string
  ): Promise<vscode.Location | undefined> {
    const domainFiles = this.projectService.getDomainFiles();

    for (const file of domainFiles) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const lines = text.split("\n");

        let inSection = false;
        let sectionIndent = -1;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) {
            continue;
          }

          const trimmed = line.trim();
          const currentIndent = line.search(/\S/);

          // Check if we're entering the target section
          if (trimmed === `${section}:`) {
            inSection = true;
            sectionIndent = currentIndent;
            continue;
          }

          // Check if we've left the section
          if (
            inSection &&
            currentIndent <= sectionIndent &&
            currentIndent >= 0 &&
            trimmed !== ""
          ) {
            inSection = false;
          }

          // Look for the name in the section
          if (inSection) {
            // Handle list format: - name or - name:
            if (trimmed === `- ${name}` || trimmed.startsWith(`- ${name}:`)) {
              const range = new vscode.Range(i, 0, i, line.length);
              return new vscode.Location(file, range);
            }
            // Handle object format: name: or name:
            if (trimmed === `${name}:` || trimmed.startsWith(`${name}:`)) {
              const range = new vscode.Range(i, 0, i, line.length);
              return new vscode.Location(file, range);
            }
          }
        }
      } catch (error) {
        this.log(`Error searching in ${file.fsPath}: ${error}`);
      }
    }

    return undefined;
  }

  /**
   * Finds examples for an intent in NLU files.
   */
  private async findIntentExamples(intentName: string): Promise<string[]> {
    const examples: string[] = [];
    const nluFiles = this.projectService.getNLUFiles();

    for (const file of nluFiles) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const lines = text.split("\n");

        let inIntent = false;
        let inExamples = false;

        for (const line of lines) {
          const trimmed = line.trim();

          // Check if we're in the target intent
          if (
            trimmed === `- intent: ${intentName}` ||
            trimmed === `intent: ${intentName}`
          ) {
            inIntent = true;
            continue;
          }

          // Check if we've left the intent
          if (inIntent && trimmed.startsWith("- intent:")) {
            break;
          }

          // Check if we're in examples section
          if (inIntent && trimmed === "examples: |") {
            inExamples = true;
            continue;
          }

          // Collect examples
          if (inIntent && inExamples && trimmed.startsWith("-")) {
            const example = trimmed.substring(1).trim();
            if (example) {
              examples.push(example);
            }
          }

          // Stop collecting if we hit another section
          if (
            inIntent &&
            inExamples &&
            trimmed &&
            !trimmed.startsWith("-") &&
            trimmed !== "examples: |"
          ) {
            break;
          }
        }

        if (examples.length >= 3) {
          break; // We have enough examples
        }
      } catch (error) {
        this.log(`Error reading NLU file ${file.fsPath}: ${error}`);
      }
    }

    return examples;
  }

  /**
   * Finds a custom action in Python files.
   */
  private async findCustomActionInPython(
    actionName: string
  ): Promise<vscode.Location | undefined> {
    try {
      // Look for actions.py or actions/*.py
      const pythonFiles = await vscode.workspace.findFiles(
        "**/actions/**/*.py",
        "**/node_modules/**"
      );

      for (const file of pythonFiles) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) {
            continue;
          }

          // Look for class definition or name() method
          if (
            line.includes(`class ${this.toPascalCase(actionName)}`) ||
            (line.includes(`name() -> Text:`) &&
              i > 0 &&
              text.includes(`"${actionName}"`))
          ) {
            const range = new vscode.Range(i, 0, i, line.length);
            return new vscode.Location(file, range);
          }
        }
      }
    } catch (error) {
      this.log(`Error searching Python files: ${error}`);
    }

    return undefined;
  }

  /**
   * Converts action_name to ActionName (Pascal case).
   */
  private toPascalCase(str: string): string {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  /**
   * Creates a clickable file link for VS Code.
   */
  private createFileLink(uri: vscode.Uri, range: vscode.Range): string {
    return `command:vscode.open?${encodeURIComponent(
      JSON.stringify([uri, { selection: range }])
    )}`;
  }

  // ========== Context Detection Methods ==========

  private isIntentLine(lineText: string): boolean {
    const trimmed = lineText.trim();
    return (
      trimmed.startsWith("- intent:") ||
      (/^\s*-?\s*\w+\s*$/.test(trimmed) && lineText.includes("intent"))
    );
  }

  private isEntityLine(lineText: string): boolean {
    const trimmed = lineText.trim();
    return trimmed.startsWith("- entity:") || trimmed.includes("entity:");
  }

  private isSlotLine(lineText: string): boolean {
    const trimmed = lineText.trim();
    return (
      trimmed.endsWith(":") &&
      !trimmed.startsWith("-") &&
      !trimmed.includes("intent") &&
      !trimmed.includes("action")
    );
  }

  private isActionLine(lineText: string): boolean {
    const trimmed = lineText.trim();
    return trimmed.startsWith("- action:") || trimmed.startsWith("- action_");
  }

  private isFormLine(lineText: string): boolean {
    const trimmed = lineText.trim();
    return trimmed.includes("active_loop:") || trimmed.startsWith("- form:");
  }

  private log(message: string): void {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }

  /**
   * Dispose of resources.
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}
