import * as vscode from "vscode";
import * as path from "path";
import { RasaProjectService } from "../services/rasaProjectService";
import { YamlParserService } from "../services/yamlParserService";

/**
 * Represents different types of Rasa components in the tree
 */
export enum RasaItemType {
  Intent = "intent",
  Entity = "entity",
  Slot = "slot",
  Response = "response",
  Action = "action",
  Form = "form",
  Category = "category",
}

/**
 * Tree item representing a Rasa component
 */
export class RasaTreeItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    public readonly itemType: RasaItemType,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public override readonly resourceUri?: vscode.Uri,
    public readonly lineNumber?: number,
    public readonly children?: RasaTreeItem[]
  ) {
    super(label, collapsibleState);

    // Set tooltip
    this.tooltip = this.getTooltip();

    // Set icon
    this.iconPath = this.getIcon();

    // Set context value for command filtering
    this.contextValue = itemType;

    // Set description (shows on the right side)
    this.description = this.getDescription();

    // Set command to navigate to definition when clicked
    if (resourceUri && lineNumber !== undefined) {
      this.command = {
        command: "vscode.open",
        title: "Open Definition",
        arguments: [
          resourceUri,
          {
            selection: new vscode.Range(
              new vscode.Position(lineNumber, 0),
              new vscode.Position(lineNumber, 0)
            ),
          },
        ],
      };
    }
  }

  /**
   * Get tooltip text based on item type
   */
  private getTooltip(): string {
    switch (this.itemType) {
      case RasaItemType.Intent:
        return `Intent: ${this.label}`;
      case RasaItemType.Entity:
        return `Entity: ${this.label}`;
      case RasaItemType.Slot:
        return `Slot: ${this.label}`;
      case RasaItemType.Response:
        return `Response: ${this.label}`;
      case RasaItemType.Action:
        return `Action: ${this.label}`;
      case RasaItemType.Form:
        return `Form: ${this.label}`;
      case RasaItemType.Category:
        return this.label;
      default:
        return this.label;
    }
  }

  /**
   * Get icon based on item type
   */
  private getIcon(): vscode.ThemeIcon {
    switch (this.itemType) {
      case RasaItemType.Intent:
        return new vscode.ThemeIcon("comment-discussion");
      case RasaItemType.Entity:
        return new vscode.ThemeIcon("symbol-field");
      case RasaItemType.Slot:
        return new vscode.ThemeIcon("symbol-variable");
      case RasaItemType.Response:
        return new vscode.ThemeIcon("comment");
      case RasaItemType.Action:
        return new vscode.ThemeIcon("rocket");
      case RasaItemType.Form:
        return new vscode.ThemeIcon("list-tree");
      case RasaItemType.Category:
        return new vscode.ThemeIcon("folder");
      default:
        return new vscode.ThemeIcon("file");
    }
  }

  /**
   * Get description text (shown on the right side of the item)
   */
  private getDescription(): string | undefined {
    if (this.itemType === RasaItemType.Category && this.children) {
      return `(${this.children.length})`;
    }
    if (this.resourceUri) {
      const fileName = path.basename(this.resourceUri.fsPath);
      return fileName;
    }
    return undefined;
  }
}

/**
 * Data provider for the Rasa Project Explorer tree view
 */
export class RasaExplorerProvider
  implements vscode.TreeDataProvider<RasaTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    RasaTreeItem | undefined | null | void
  > = new vscode.EventEmitter<RasaTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    RasaTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private yamlParser: YamlParserService;
  private categories: Map<RasaItemType, RasaTreeItem[]> = new Map();

  constructor(private rasaProjectService: RasaProjectService) {
    this.yamlParser = YamlParserService.getInstance();
    this.initializeCategories();
  }

  /**
   * Initialize empty categories
   */
  private initializeCategories(): void {
    this.categories.set(RasaItemType.Intent, []);
    this.categories.set(RasaItemType.Entity, []);
    this.categories.set(RasaItemType.Slot, []);
    this.categories.set(RasaItemType.Response, []);
    this.categories.set(RasaItemType.Action, []);
    this.categories.set(RasaItemType.Form, []);
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item representation
   */
  getTreeItem(element: RasaTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for a tree item
   */
  async getChildren(element?: RasaTreeItem): Promise<RasaTreeItem[]> {
    if (!this.rasaProjectService.isRasaProject()) {
      return [];
    }

    // Root level - show categories
    if (!element) {
      return this.getRootCategories();
    }

    // Category level - show items in that category
    if (element.itemType === RasaItemType.Category) {
      return element.children || [];
    }

    // Item level - no children
    return [];
  }

  /**
   * Get root category items
   */
  private async getRootCategories(): Promise<RasaTreeItem[]> {
    // Refresh data from domain files
    await this.refreshData();

    const categories: RasaTreeItem[] = [];

    // Create category items with their children
    const intents = this.categories.get(RasaItemType.Intent) || [];
    if (intents.length > 0) {
      categories.push(
        new RasaTreeItem(
          "Intents",
          RasaItemType.Category,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          undefined,
          intents
        )
      );
    }

    const entities = this.categories.get(RasaItemType.Entity) || [];
    if (entities.length > 0) {
      categories.push(
        new RasaTreeItem(
          "Entities",
          RasaItemType.Category,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          undefined,
          entities
        )
      );
    }

    const slots = this.categories.get(RasaItemType.Slot) || [];
    if (slots.length > 0) {
      categories.push(
        new RasaTreeItem(
          "Slots",
          RasaItemType.Category,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          undefined,
          slots
        )
      );
    }

    const responses = this.categories.get(RasaItemType.Response) || [];
    if (responses.length > 0) {
      categories.push(
        new RasaTreeItem(
          "Responses",
          RasaItemType.Category,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          undefined,
          responses
        )
      );
    }

    const actions = this.categories.get(RasaItemType.Action) || [];
    if (actions.length > 0) {
      categories.push(
        new RasaTreeItem(
          "Actions",
          RasaItemType.Category,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          undefined,
          actions
        )
      );
    }

    const forms = this.categories.get(RasaItemType.Form) || [];
    if (forms.length > 0) {
      categories.push(
        new RasaTreeItem(
          "Forms",
          RasaItemType.Category,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          undefined,
          forms
        )
      );
    }

    return categories;
  }

  /**
   * Refresh data by parsing all domain files
   */
  private async refreshData(): Promise<void> {
    // Clear existing data
    this.initializeCategories();

    // Get all domain files
    const domainFiles = this.rasaProjectService.getDomainFiles();

    // Parse each domain file
    for (const domainUri of domainFiles) {
      await this.parseDomainFile(domainUri);
    }
  }

  /**
   * Parse a single domain file and extract components
   */
  private async parseDomainFile(uri: vscode.Uri): Promise<void> {
    const result = await this.yamlParser.parseDomain(uri.fsPath);

    if (!result.success || !result.data) {
      return;
    }

    const domain = result.data;

    // Extract intents
    if (domain.intents) {
      await this.extractIntents(domain.intents, uri);
    }

    // Extract entities
    if (domain.entities) {
      await this.extractEntities(domain.entities, uri);
    }

    // Extract slots
    if (domain.slots) {
      await this.extractSlots(domain.slots, uri);
    }

    // Extract responses
    if (domain.responses) {
      await this.extractResponses(domain.responses, uri);
    }

    // Extract actions
    if (domain.actions) {
      await this.extractActions(domain.actions, uri);
    }

    // Extract forms
    if (domain.forms) {
      await this.extractForms(domain.forms, uri);
    }
  }

  /**
   * Extract intents from domain data
   */
  private async extractIntents(
    intents: string[] | Array<{ [key: string]: any }>,
    uri: vscode.Uri
  ): Promise<void> {
    const intentItems = this.categories.get(RasaItemType.Intent) || [];

    for (const intent of intents) {
      const intentName =
        typeof intent === "string" ? intent : Object.keys(intent)[0];
      if (intentName) {
        const lineNumber = await this.findLineNumber(uri, intentName);
        intentItems.push(
          new RasaTreeItem(
            intentName,
            RasaItemType.Intent,
            vscode.TreeItemCollapsibleState.None,
            uri,
            lineNumber
          )
        );
      }
    }

    // Sort alphabetically
    intentItems.sort((a, b) => a.label.localeCompare(b.label));
    this.categories.set(RasaItemType.Intent, intentItems);
  }

  /**
   * Extract entities from domain data
   */
  private async extractEntities(
    entities: string[] | Array<{ [key: string]: any }>,
    uri: vscode.Uri
  ): Promise<void> {
    const entityItems = this.categories.get(RasaItemType.Entity) || [];

    for (const entity of entities) {
      const entityName =
        typeof entity === "string" ? entity : Object.keys(entity)[0];
      if (entityName) {
        const lineNumber = await this.findLineNumber(uri, entityName);
        entityItems.push(
          new RasaTreeItem(
            entityName,
            RasaItemType.Entity,
            vscode.TreeItemCollapsibleState.None,
            uri,
            lineNumber
          )
        );
      }
    }

    // Sort alphabetically
    entityItems.sort((a, b) => a.label.localeCompare(b.label));
    this.categories.set(RasaItemType.Entity, entityItems);
  }

  /**
   * Extract slots from domain data
   */
  private async extractSlots(
    slots: { [key: string]: any },
    uri: vscode.Uri
  ): Promise<void> {
    const slotItems = this.categories.get(RasaItemType.Slot) || [];

    for (const slotName of Object.keys(slots)) {
      const lineNumber = await this.findLineNumber(uri, slotName);
      const slotType = slots[slotName]?.type || "any";

      const item = new RasaTreeItem(
        slotName,
        RasaItemType.Slot,
        vscode.TreeItemCollapsibleState.None,
        uri,
        lineNumber
      );
      // Add slot type to description
      item.description = `${slotType} · ${item.description}`;

      slotItems.push(item);
    }

    // Sort alphabetically
    slotItems.sort((a, b) => a.label.localeCompare(b.label));
    this.categories.set(RasaItemType.Slot, slotItems);
  }

  /**
   * Extract responses from domain data
   */
  private async extractResponses(
    responses: { [key: string]: any },
    uri: vscode.Uri
  ): Promise<void> {
    const responseItems = this.categories.get(RasaItemType.Response) || [];

    for (const responseName of Object.keys(responses)) {
      const lineNumber = await this.findLineNumber(uri, responseName);
      responseItems.push(
        new RasaTreeItem(
          responseName,
          RasaItemType.Response,
          vscode.TreeItemCollapsibleState.None,
          uri,
          lineNumber
        )
      );
    }

    // Sort alphabetically
    responseItems.sort((a, b) => a.label.localeCompare(b.label));
    this.categories.set(RasaItemType.Response, responseItems);
  }

  /**
   * Extract actions from domain data
   */
  private async extractActions(
    actions: string[],
    uri: vscode.Uri
  ): Promise<void> {
    const actionItems = this.categories.get(RasaItemType.Action) || [];

    for (const actionName of actions) {
      // Skip response actions (they're already in responses)
      if (actionName.startsWith("utter_")) {
        continue;
      }

      const lineNumber = await this.findLineNumber(uri, actionName);
      actionItems.push(
        new RasaTreeItem(
          actionName,
          RasaItemType.Action,
          vscode.TreeItemCollapsibleState.None,
          uri,
          lineNumber
        )
      );
    }

    // Sort alphabetically
    actionItems.sort((a, b) => a.label.localeCompare(b.label));
    this.categories.set(RasaItemType.Action, actionItems);
  }

  /**
   * Extract forms from domain data
   */
  private async extractForms(
    forms: { [key: string]: any },
    uri: vscode.Uri
  ): Promise<void> {
    const formItems = this.categories.get(RasaItemType.Form) || [];

    for (const formName of Object.keys(forms)) {
      const lineNumber = await this.findLineNumber(uri, formName);
      formItems.push(
        new RasaTreeItem(
          formName,
          RasaItemType.Form,
          vscode.TreeItemCollapsibleState.None,
          uri,
          lineNumber
        )
      );
    }

    // Sort alphabetically
    formItems.sort((a, b) => a.label.localeCompare(b.label));
    this.categories.set(RasaItemType.Form, formItems);
  }

  /**
   * Find the line number of a component in a YAML file
   */
  private async findLineNumber(uri: vscode.Uri, name: string): Promise<number> {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const text = document.getText();
      const lines = text.split("\n");

      // Look for the component name in the file
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match patterns like:
        // - intent_name
        // intent_name:
        // - name: intent_name
        if (
          line &&
          (line.includes(`- ${name}`) ||
            line.includes(`${name}:`) ||
            line.includes(`"${name}"`) ||
            line.includes(`'${name}'`))
        ) {
          return i;
        }
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }
}

/**
 * Manages the Rasa Project Explorer view
 */
export class RasaExplorerView {
  private treeView: vscode.TreeView<RasaTreeItem>;
  private treeDataProvider: RasaExplorerProvider;

  constructor(
    context: vscode.ExtensionContext,
    rasaProjectService: RasaProjectService
  ) {
    this.treeDataProvider = new RasaExplorerProvider(rasaProjectService);

    this.treeView = vscode.window.createTreeView("rasaExplorer", {
      treeDataProvider: this.treeDataProvider,
      showCollapseAll: true,
    });

    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand(
      "rasa-pro-vscode.refreshExplorer",
      () => {
        this.treeDataProvider.refresh();
      }
    );

    context.subscriptions.push(this.treeView, refreshCommand);

    // Auto-refresh when domain files change
    const watcher = vscode.workspace.createFileSystemWatcher(
      "**/domain{.yml,/**/*.yml,/**/*.yaml}"
    );

    watcher.onDidChange(() => this.treeDataProvider.refresh());
    watcher.onDidCreate(() => this.treeDataProvider.refresh());
    watcher.onDidDelete(() => this.treeDataProvider.refresh());

    context.subscriptions.push(watcher);
  }

  /**
   * Reveal an item in the tree view
   */
  async reveal(item: RasaTreeItem): Promise<void> {
    await this.treeView.reveal(item, {
      select: true,
      focus: true,
    });
  }

  /**
   * Get the tree view instance
   */
  getTreeView(): vscode.TreeView<RasaTreeItem> {
    return this.treeView;
  }
}
