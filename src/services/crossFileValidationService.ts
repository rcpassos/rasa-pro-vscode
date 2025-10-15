import * as vscode from "vscode";
import { RasaProjectService } from "./rasaProjectService";
import {
  YamlParserService,
  RasaStories,
  RasaRules,
  RasaNLU,
} from "./yamlParserService";

/**
 * Represents a cross-file validation issue
 */
export interface CrossFileIssue {
  type:
    | "undefined-intent"
    | "undefined-entity"
    | "undefined-action"
    | "undefined-slot"
    | "undefined-response"
    | "unused-intent"
    | "unused-entity"
    | "unused-slot"
    | "unused-response";
  message: string;
  severity: vscode.DiagnosticSeverity;
  itemName: string;
  referencedIn?: string[];
  definedIn?: string[];
}

/**
 * Aggregated project data from all Rasa files
 */
interface ProjectData {
  // Domain data
  intents: Set<string>;
  entities: Set<string>;
  slots: Set<string>;
  responses: Set<string>;
  actions: Set<string>;
  forms: Set<string>;

  // NLU data
  nluIntents: Set<string>;

  // Stories/Rules references
  storyIntents: Set<string>;
  storyActions: Set<string>;
  storySlots: Set<string>;
  storyForms: Set<string>;

  ruleIntents: Set<string>;
  ruleActions: Set<string>;
  ruleSlots: Set<string>;
  ruleForms: Set<string>;

  // File locations for better error reporting
  intentFiles: Map<string, string[]>;
  actionFiles: Map<string, string[]>;
  responseFiles: Map<string, string[]>;
  slotFiles: Map<string, string[]>;
  entityFiles: Map<string, string[]>;
}

/**
 * Service for validating cross-file references in Rasa projects.
 * Detects undefined and unused components across domain, NLU, stories, and rules files.
 */
export class CrossFileValidationService {
  private yamlParser: YamlParserService;
  private projectService: RasaProjectService;
  private outputChannel: vscode.OutputChannel;

  constructor(projectService: RasaProjectService) {
    this.projectService = projectService;
    this.yamlParser = YamlParserService.getInstance();
    this.outputChannel = vscode.window.createOutputChannel(
      "Rasa Cross-File Validation"
    );
  }

  /**
   * Validate all cross-file references in the project
   */
  public async validateProject(): Promise<Map<string, CrossFileIssue[]>> {
    this.log("Starting cross-file validation...");

    const issuesByFile = new Map<string, CrossFileIssue[]>();

    if (!this.projectService.isRasaProject()) {
      this.log("Not a Rasa project, skipping validation");
      return issuesByFile;
    }

    try {
      // Aggregate data from all files
      const projectData = await this.aggregateProjectData();

      // Detect issues
      const issues = this.detectIssues(projectData);

      // Group issues by file
      this.groupIssuesByFile(issues, projectData, issuesByFile);

      this.log(
        `Cross-file validation complete: found ${issues.length} issue(s)`
      );
    } catch (error) {
      this.log(
        `Error during cross-file validation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return issuesByFile;
  }

  /**
   * Aggregate all data from domain, NLU, stories, and rules files
   */
  private async aggregateProjectData(): Promise<ProjectData> {
    const data: ProjectData = {
      intents: new Set(),
      entities: new Set(),
      slots: new Set(),
      responses: new Set(),
      actions: new Set(),
      forms: new Set(),
      nluIntents: new Set(),
      storyIntents: new Set(),
      storyActions: new Set(),
      storySlots: new Set(),
      storyForms: new Set(),
      ruleIntents: new Set(),
      ruleActions: new Set(),
      ruleSlots: new Set(),
      ruleForms: new Set(),
      intentFiles: new Map(),
      actionFiles: new Map(),
      responseFiles: new Map(),
      slotFiles: new Map(),
      entityFiles: new Map(),
    };

    // Parse domain files
    await this.parseDomainFiles(data);

    // Parse NLU files
    await this.parseNLUFiles(data);

    // Parse stories files
    await this.parseStoriesFiles(data);

    // Parse rules files
    await this.parseRulesFiles(data);

    this.log(
      `Aggregated: ${data.intents.size} intents, ${data.entities.size} entities, ` +
        `${data.slots.size} slots, ${data.responses.size} responses, ${data.actions.size} actions`
    );

    return data;
  }

  /**
   * Parse all domain files and extract definitions
   */
  private async parseDomainFiles(data: ProjectData): Promise<void> {
    const domainFiles = this.projectService.getDomainFiles();

    for (const uri of domainFiles) {
      try {
        const result = await this.yamlParser.parseDomain(uri.fsPath);

        if (result.success && result.data) {
          const domain = result.data;

          // Extract intents
          const intents = this.yamlParser.extractIntents(domain);
          intents.forEach((intent) => {
            data.intents.add(intent);
            this.addToMap(data.intentFiles, intent, uri.fsPath);
          });

          // Extract entities
          const entities = this.yamlParser.extractEntities(domain);
          entities.forEach((entity) => {
            data.entities.add(entity);
            this.addToMap(data.entityFiles, entity, uri.fsPath);
          });

          // Extract slots
          const slots = this.yamlParser.extractSlots(domain);
          slots.forEach((slot) => {
            data.slots.add(slot);
            this.addToMap(data.slotFiles, slot, uri.fsPath);
          });

          // Extract responses
          const responses = this.yamlParser.extractResponses(domain);
          responses.forEach((response) => {
            data.responses.add(response);
            this.addToMap(data.responseFiles, response, uri.fsPath);
          });

          // Extract actions
          const actions = this.yamlParser.extractActions(domain);
          actions.forEach((action) => {
            data.actions.add(action);
            this.addToMap(data.actionFiles, action, uri.fsPath);
          });

          // Extract forms
          const forms = this.yamlParser.extractForms(domain);
          forms.forEach((form) => data.forms.add(form));

          this.log(`Parsed domain file: ${uri.fsPath}`);
        }
      } catch (error) {
        this.log(
          `Error parsing domain file ${uri.fsPath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * Parse all NLU files and extract intent references
   */
  private async parseNLUFiles(data: ProjectData): Promise<void> {
    const nluFiles = this.projectService.getNLUFiles();

    for (const uri of nluFiles) {
      try {
        const result = await this.yamlParser.parseNLU(uri.fsPath);

        if (result.success && result.data) {
          const nlu = result.data as RasaNLU;

          if (nlu.nlu) {
            nlu.nlu.forEach((item) => {
              if (item.intent) {
                data.nluIntents.add(item.intent);
              }
            });
          }

          this.log(`Parsed NLU file: ${uri.fsPath}`);
        }
      } catch (error) {
        this.log(
          `Error parsing NLU file ${uri.fsPath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * Parse all stories files and extract references
   */
  private async parseStoriesFiles(data: ProjectData): Promise<void> {
    const storiesFiles = this.projectService.getStoriesFiles();

    for (const uri of storiesFiles) {
      try {
        const result = await this.yamlParser.parseStories(uri.fsPath);

        if (result.success && result.data) {
          const stories = result.data as RasaStories;

          if (stories.stories) {
            stories.stories.forEach((story) => {
              if (story.steps) {
                this.extractStepReferences(story.steps, data, "story");
              }
            });
          }

          this.log(`Parsed stories file: ${uri.fsPath}`);
        }
      } catch (error) {
        this.log(
          `Error parsing stories file ${uri.fsPath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * Parse all rules files and extract references
   */
  private async parseRulesFiles(data: ProjectData): Promise<void> {
    const rulesFiles = this.projectService.getRulesFiles();

    for (const uri of rulesFiles) {
      try {
        const result = await this.yamlParser.parseRules(uri.fsPath);

        if (result.success && result.data) {
          const rules = result.data as RasaRules;

          if (rules.rules) {
            rules.rules.forEach((rule) => {
              if (rule.steps) {
                this.extractStepReferences(rule.steps, data, "rule");
              }
            });
          }

          this.log(`Parsed rules file: ${uri.fsPath}`);
        }
      } catch (error) {
        this.log(
          `Error parsing rules file ${uri.fsPath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * Extract references from story/rule steps
   */
  private extractStepReferences(
    steps: any[],
    data: ProjectData,
    type: "story" | "rule"
  ): void {
    const intentsSet = type === "story" ? data.storyIntents : data.ruleIntents;
    const actionsSet = type === "story" ? data.storyActions : data.ruleActions;
    const slotsSet = type === "story" ? data.storySlots : data.ruleSlots;
    const formsSet = type === "story" ? data.storyForms : data.ruleForms;

    steps.forEach((step) => {
      // Extract intent references
      if (step.intent) {
        intentsSet.add(step.intent);
      }

      // Extract action references
      if (step.action) {
        actionsSet.add(step.action);
      }

      // Extract form references (active_loop)
      if (step.active_loop && step.active_loop !== null) {
        formsSet.add(step.active_loop);
      }

      // Extract slot references (slot_was_set)
      if (step.slot_was_set) {
        if (Array.isArray(step.slot_was_set)) {
          step.slot_was_set.forEach((slot: any) => {
            if (typeof slot === "object") {
              Object.keys(slot).forEach((slotName) => slotsSet.add(slotName));
            }
          });
        } else if (typeof step.slot_was_set === "object") {
          Object.keys(step.slot_was_set).forEach((slotName) =>
            slotsSet.add(slotName)
          );
        }
      }
    });
  }

  /**
   * Detect all cross-file issues
   */
  private detectIssues(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];

    // Check for undefined intents referenced in stories/rules
    issues.push(...this.checkUndefinedIntents(data));

    // Check for undefined actions referenced in stories/rules
    issues.push(...this.checkUndefinedActions(data));

    // Check for undefined slots referenced in stories/rules
    issues.push(...this.checkUndefinedSlots(data));

    // Check for undefined forms referenced in stories/rules
    issues.push(...this.checkUndefinedForms(data));

    // Check for unused intents in domain
    issues.push(...this.checkUnusedIntents(data));

    // Check for unused responses in domain
    issues.push(...this.checkUnusedResponses(data));

    // Check for unused entities in domain
    issues.push(...this.checkUnusedEntities(data));

    // Check for unused slots in domain
    issues.push(...this.checkUnusedSlots(data));

    return issues;
  }

  /**
   * Check for undefined intents referenced in stories/rules
   */
  private checkUndefinedIntents(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];
    const referencedIntents = new Set([
      ...data.storyIntents,
      ...data.ruleIntents,
    ]);

    referencedIntents.forEach((intent) => {
      if (!data.intents.has(intent)) {
        issues.push({
          type: "undefined-intent",
          message: `Intent '${intent}' is referenced in stories/rules but not defined in domain`,
          severity: vscode.DiagnosticSeverity.Error,
          itemName: intent,
        });
      }
    });

    return issues;
  }

  /**
   * Check for undefined actions referenced in stories/rules
   */
  private checkUndefinedActions(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];
    const referencedActions = new Set([
      ...data.storyActions,
      ...data.ruleActions,
    ]);

    referencedActions.forEach((action) => {
      // Skip built-in actions
      if (this.isBuiltInAction(action)) {
        return;
      }

      // Check if it's a response (utter_*) - should be in responses
      if (action.startsWith("utter_")) {
        if (!data.responses.has(action)) {
          issues.push({
            type: "undefined-response",
            message: `Response action '${action}' is referenced in stories/rules but not defined in domain responses`,
            severity: vscode.DiagnosticSeverity.Error,
            itemName: action,
          });
        }
      }
      // Check if it's a custom action or form
      else if (!data.actions.has(action) && !data.forms.has(action)) {
        issues.push({
          type: "undefined-action",
          message: `Action '${action}' is referenced in stories/rules but not defined in domain actions or forms`,
          severity: vscode.DiagnosticSeverity.Error,
          itemName: action,
        });
      }
    });

    return issues;
  }

  /**
   * Check for undefined slots referenced in stories/rules
   */
  private checkUndefinedSlots(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];
    const referencedSlots = new Set([...data.storySlots, ...data.ruleSlots]);

    referencedSlots.forEach((slot) => {
      if (!data.slots.has(slot)) {
        issues.push({
          type: "undefined-slot",
          message: `Slot '${slot}' is referenced in stories/rules but not defined in domain`,
          severity: vscode.DiagnosticSeverity.Error,
          itemName: slot,
        });
      }
    });

    return issues;
  }

  /**
   * Check for undefined forms referenced in stories/rules
   */
  private checkUndefinedForms(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];
    const referencedForms = new Set([...data.storyForms, ...data.ruleForms]);

    referencedForms.forEach((form) => {
      if (!data.forms.has(form)) {
        issues.push({
          type: "undefined-action",
          message: `Form '${form}' is referenced in stories/rules (active_loop) but not defined in domain`,
          severity: vscode.DiagnosticSeverity.Error,
          itemName: form,
        });
      }
    });

    return issues;
  }

  /**
   * Check for unused intents in domain
   */
  private checkUnusedIntents(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];

    data.intents.forEach((intent) => {
      // Check if intent is used in NLU data
      const hasNLU = data.nluIntents.has(intent);

      // Check if intent is used in stories/rules
      const usedInStories =
        data.storyIntents.has(intent) || data.ruleIntents.has(intent);

      if (!hasNLU && !usedInStories) {
        issues.push({
          type: "unused-intent",
          message: `Intent '${intent}' is defined in domain but not used in NLU data or stories/rules`,
          severity: vscode.DiagnosticSeverity.Warning,
          itemName: intent,
          definedIn: data.intentFiles.get(intent) || [],
        });
      } else if (!hasNLU) {
        issues.push({
          type: "unused-intent",
          message: `Intent '${intent}' is defined in domain but has no training examples in NLU data`,
          severity: vscode.DiagnosticSeverity.Warning,
          itemName: intent,
          definedIn: data.intentFiles.get(intent) || [],
        });
      }
    });

    return issues;
  }

  /**
   * Check for unused responses in domain
   */
  private checkUnusedResponses(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];
    const referencedResponses = new Set([
      ...data.storyActions,
      ...data.ruleActions,
    ]);

    data.responses.forEach((response) => {
      if (!referencedResponses.has(response)) {
        issues.push({
          type: "unused-response",
          message: `Response '${response}' is defined in domain but never used in stories/rules`,
          severity: vscode.DiagnosticSeverity.Information,
          itemName: response,
          definedIn: data.responseFiles.get(response) || [],
        });
      }
    });

    return issues;
  }

  /**
   * Check for unused entities in domain
   */
  private checkUnusedEntities(_data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];

    // Entities are typically used in NLU data and slot mappings
    // For now, we'll mark this as low priority (Information level)
    // since entities might be used in NLU examples without explicit references

    // This is a placeholder for future enhancement
    // Could check if entity is used in:
    // - NLU training data (entity annotations)
    // - Slot mappings (from_entity)
    // - Forms (entity extraction)

    return issues;
  }

  /**
   * Check for unused slots in domain
   */
  private checkUnusedSlots(data: ProjectData): CrossFileIssue[] {
    const issues: CrossFileIssue[] = [];
    const referencedSlots = new Set([...data.storySlots, ...data.ruleSlots]);

    data.slots.forEach((slot) => {
      // Check if slot is used in forms
      const usedInForms = this.isSlotUsedInForms(slot, data);

      if (!referencedSlots.has(slot) && !usedInForms) {
        issues.push({
          type: "unused-slot",
          message: `Slot '${slot}' is defined in domain but never referenced in stories/rules or forms`,
          severity: vscode.DiagnosticSeverity.Information,
          itemName: slot,
          definedIn: data.slotFiles.get(slot) || [],
        });
      }
    });

    return issues;
  }

  /**
   * Check if a slot is used in any form
   */
  private isSlotUsedInForms(_slot: string, _data: ProjectData): boolean {
    // This is a simplified check - in a full implementation,
    // we would parse form required_slots from domain files
    // For now, we'll return false and let the user know via unused-slot warnings
    return false;
  }

  /**
   * Check if an action is a built-in Rasa action
   */
  private isBuiltInAction(action: string): boolean {
    const builtInActions = [
      "action_listen",
      "action_restart",
      "action_session_start",
      "action_default_fallback",
      "action_deactivate_loop",
      "action_revert_fallback_events",
      "action_default_ask_affirmation",
      "action_default_ask_rephrase",
      "action_back",
      "action_unlikely_intent",
    ];

    return builtInActions.includes(action);
  }

  /**
   * Group issues by the files where they should be reported
   */
  private groupIssuesByFile(
    issues: CrossFileIssue[],
    _data: ProjectData,
    issuesByFile: Map<string, CrossFileIssue[]>
  ): void {
    // Group undefined issues - report in the files that reference them
    const storiesFiles = this.projectService.getStoriesFiles();
    const rulesFiles = this.projectService.getRulesFiles();

    issues.forEach((issue) => {
      if (
        issue.type === "undefined-intent" ||
        issue.type === "undefined-action" ||
        issue.type === "undefined-slot" ||
        issue.type === "undefined-response"
      ) {
        // Add to all stories/rules files (they might all reference it)
        [...storiesFiles, ...rulesFiles].forEach((uri) => {
          const path = uri.fsPath;
          if (!issuesByFile.has(path)) {
            issuesByFile.set(path, []);
          }
          issuesByFile.get(path)!.push(issue);
        });
      }
      // Unused issues - report in the files where they're defined
      else if (
        issue.type === "unused-intent" ||
        issue.type === "unused-response" ||
        issue.type === "unused-entity" ||
        issue.type === "unused-slot"
      ) {
        if (issue.definedIn && issue.definedIn.length > 0) {
          issue.definedIn.forEach((filePath) => {
            if (!issuesByFile.has(filePath)) {
              issuesByFile.set(filePath, []);
            }
            issuesByFile.get(filePath)!.push(issue);
          });
        }
      }
    });
  }

  /**
   * Helper to add items to a map with arrays
   */
  private addToMap(map: Map<string, string[]>, key: string, value: string) {
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(value);
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
    this.outputChannel.dispose();
  }
}
