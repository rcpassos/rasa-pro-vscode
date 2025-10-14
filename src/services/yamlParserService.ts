import * as vscode from "vscode";
import * as yaml from "js-yaml";
import * as fs from "fs/promises";

/**
 * Represents parsed Rasa domain data
 */
export interface RasaDomain {
  version?: string;
  intents?: string[] | Array<{ [key: string]: any }>;
  entities?: string[] | Array<{ [key: string]: any }>;
  slots?: { [key: string]: any };
  responses?: { [key: string]: any };
  actions?: string[];
  forms?: { [key: string]: any };
  session_config?: any;
}

/**
 * Represents parsed Rasa NLU data
 */
export interface RasaNLU {
  version?: string;
  nlu?: Array<{
    intent?: string;
    examples?: string;
  }>;
}

/**
 * Represents parsed Rasa stories
 */
export interface RasaStories {
  version?: string;
  stories?: Array<{
    story?: string;
    steps?: any[];
  }>;
}

/**
 * Represents parsed Rasa rules
 */
export interface RasaRules {
  version?: string;
  rules?: Array<{
    rule?: string;
    steps?: any[];
  }>;
}

/**
 * Represents parsed Rasa config
 */
export interface RasaConfig {
  version?: string;
  language?: string;
  pipeline?: any[];
  policies?: any[];
}

/**
 * Result of YAML parsing operation
 */
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  filePath: string;
}

/**
 * YAML validation error details
 */
export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
  severity: vscode.DiagnosticSeverity;
}

/**
 * Service for parsing and validating Rasa YAML files
 */
export class YamlParserService {
  private static instance: YamlParserService;
  private outputChannel: vscode.OutputChannel;
  private maxFileSize: number;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Rasa YAML Parser");
    // Get max file size from config (default 1MB)
    const config = vscode.workspace.getConfiguration("rasa-pro-vscode");
    this.maxFileSize = config.get<number>("maxFileSize") || 1048576;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): YamlParserService {
    if (!YamlParserService.instance) {
      YamlParserService.instance = new YamlParserService();
    }
    return YamlParserService.instance;
  }

  /**
   * Parse a YAML file and return typed result
   */
  public async parseFile<T = any>(filePath: string): Promise<ParseResult<T>> {
    try {
      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        return {
          success: false,
          error: `File size (${stats.size} bytes) exceeds maximum allowed (${this.maxFileSize} bytes)`,
          filePath,
        };
      }

      // Read file content
      const content = await fs.readFile(filePath, "utf-8");

      // Parse YAML
      const data = yaml.load(content, {
        filename: filePath,
        onWarning: (warning: yaml.YAMLException) => {
          this.outputChannel.appendLine(
            `Warning in ${filePath}: ${warning.message}`
          );
        },
      }) as T;

      return {
        success: true,
        data,
        filePath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(
        `Error parsing ${filePath}: ${errorMessage}`
      );

      return {
        success: false,
        error: errorMessage,
        filePath,
      };
    }
  }

  /**
   * Parse YAML content from a string
   */
  public parseContent<T = any>(
    content: string,
    sourceName: string = "unknown"
  ): ParseResult<T> {
    try {
      const data = yaml.load(content, {
        filename: sourceName,
        onWarning: (warning: yaml.YAMLException) => {
          this.outputChannel.appendLine(
            `Warning in ${sourceName}: ${warning.message}`
          );
        },
      }) as T;

      return {
        success: true,
        data,
        filePath: sourceName,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(
        `Error parsing ${sourceName}: ${errorMessage}`
      );

      return {
        success: false,
        error: errorMessage,
        filePath: sourceName,
      };
    }
  }

  /**
   * Parse a Rasa domain file (domain.yml or files in domain/ directory)
   */
  public async parseDomain(filePath: string): Promise<ParseResult<RasaDomain>> {
    return this.parseFile<RasaDomain>(filePath);
  }

  /**
   * Parse a Rasa NLU file
   */
  public async parseNLU(filePath: string): Promise<ParseResult<RasaNLU>> {
    return this.parseFile<RasaNLU>(filePath);
  }

  /**
   * Parse a Rasa stories file
   */
  public async parseStories(
    filePath: string
  ): Promise<ParseResult<RasaStories>> {
    return this.parseFile<RasaStories>(filePath);
  }

  /**
   * Parse a Rasa rules file
   */
  public async parseRules(filePath: string): Promise<ParseResult<RasaRules>> {
    return this.parseFile<RasaRules>(filePath);
  }

  /**
   * Parse a Rasa config file
   */
  public async parseConfig(filePath: string): Promise<ParseResult<RasaConfig>> {
    return this.parseFile<RasaConfig>(filePath);
  }

  /**
   * Validate YAML syntax and structure
   */
  public validateYaml(content: string, filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      yaml.load(content, {
        filename: filePath,
        onWarning: (warning: yaml.YAMLException) => {
          errors.push({
            message: warning.message,
            line: warning.mark?.line,
            column: warning.mark?.column,
            severity: vscode.DiagnosticSeverity.Warning,
          });
        },
      });
    } catch (error: unknown) {
      if (error instanceof yaml.YAMLException) {
        errors.push({
          message: error.message,
          line: error.mark?.line,
          column: error.mark?.column,
          severity: vscode.DiagnosticSeverity.Error,
        });
      } else {
        errors.push({
          message: error instanceof Error ? error.message : String(error),
          severity: vscode.DiagnosticSeverity.Error,
        });
      }
    }

    return errors;
  }

  /**
   * Validate Rasa domain structure
   */
  public validateDomain(domain: RasaDomain): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check version
    if (!domain.version) {
      errors.push({
        message: "Missing required field: version",
        severity: vscode.DiagnosticSeverity.Error,
      });
    }

    // Validate slots structure
    if (domain.slots) {
      for (const [slotName, slotConfig] of Object.entries(domain.slots)) {
        if (typeof slotConfig !== "object" || slotConfig === null) {
          errors.push({
            message: `Invalid slot configuration for '${slotName}'. Slots must be objects.`,
            severity: vscode.DiagnosticSeverity.Error,
          });
          continue;
        }

        // Check for required slot fields
        if (!slotConfig.type) {
          errors.push({
            message: `Missing 'type' field in slot '${slotName}'`,
            severity: vscode.DiagnosticSeverity.Error,
          });
        }

        // Validate slot type
        const validSlotTypes = [
          "text",
          "bool",
          "categorical",
          "float",
          "list",
          "any",
        ];
        if (slotConfig.type && !validSlotTypes.includes(slotConfig.type)) {
          errors.push({
            message: `Invalid slot type '${
              slotConfig.type
            }' for slot '${slotName}'. Must be one of: ${validSlotTypes.join(
              ", "
            )}`,
            severity: vscode.DiagnosticSeverity.Error,
          });
        }

        // Validate mappings if present
        if (slotConfig.mappings && !Array.isArray(slotConfig.mappings)) {
          errors.push({
            message: `Invalid 'mappings' field in slot '${slotName}'. Must be an array.`,
            severity: vscode.DiagnosticSeverity.Error,
          });
        }
      }
    }

    // Validate responses structure
    if (domain.responses) {
      for (const [responseName, responseConfig] of Object.entries(
        domain.responses
      )) {
        if (!Array.isArray(responseConfig)) {
          errors.push({
            message: `Invalid response '${responseName}'. Responses must be arrays.`,
            severity: vscode.DiagnosticSeverity.Error,
          });
          continue;
        }

        // Check that response variations have text or custom field
        responseConfig.forEach((variation: any, index: number) => {
          if (typeof variation !== "object" || variation === null) {
            errors.push({
              message: `Invalid response variation ${index} in '${responseName}'`,
              severity: vscode.DiagnosticSeverity.Error,
            });
          } else if (!variation.text && !variation.custom) {
            errors.push({
              message: `Response variation ${index} in '${responseName}' must have 'text' or 'custom' field`,
              severity: vscode.DiagnosticSeverity.Warning,
            });
          }
        });
      }
    }

    // Validate forms structure
    if (domain.forms) {
      for (const [formName, formConfig] of Object.entries(domain.forms)) {
        if (typeof formConfig !== "object" || formConfig === null) {
          errors.push({
            message: `Invalid form configuration for '${formName}'`,
            severity: vscode.DiagnosticSeverity.Error,
          });
          continue;
        }

        // Check for ignored_intents if present
        if (
          formConfig.ignored_intents &&
          !Array.isArray(formConfig.ignored_intents)
        ) {
          errors.push({
            message: `'ignored_intents' in form '${formName}' must be an array`,
            severity: vscode.DiagnosticSeverity.Error,
          });
        }

        // Check for required_slots if present
        if (
          formConfig.required_slots &&
          !Array.isArray(formConfig.required_slots)
        ) {
          errors.push({
            message: `'required_slots' in form '${formName}' must be an array`,
            severity: vscode.DiagnosticSeverity.Error,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Extract intents from domain data
   */
  public extractIntents(domain: RasaDomain): string[] {
    if (!domain.intents) {
      return [];
    }

    return domain.intents
      .map((intent) => {
        if (typeof intent === "string") {
          return intent;
        } else if (typeof intent === "object") {
          // Handle object format like { name: "intent_name", use_entities: [] }
          return Object.keys(intent)[0] || "";
        }
        return "";
      })
      .filter(Boolean);
  }

  /**
   * Extract entities from domain data
   */
  public extractEntities(domain: RasaDomain): string[] {
    if (!domain.entities) {
      return [];
    }

    return domain.entities
      .map((entity) => {
        if (typeof entity === "string") {
          return entity;
        } else if (typeof entity === "object") {
          return Object.keys(entity)[0] || "";
        }
        return "";
      })
      .filter(Boolean);
  }

  /**
   * Extract slot names from domain data
   */
  public extractSlots(domain: RasaDomain): string[] {
    if (!domain.slots) {
      return [];
    }
    return Object.keys(domain.slots);
  }

  /**
   * Extract response names from domain data
   */
  public extractResponses(domain: RasaDomain): string[] {
    if (!domain.responses) {
      return [];
    }
    return Object.keys(domain.responses);
  }

  /**
   * Extract action names from domain data
   */
  public extractActions(domain: RasaDomain): string[] {
    return domain.actions || [];
  }

  /**
   * Extract form names from domain data
   */
  public extractForms(domain: RasaDomain): string[] {
    if (!domain.forms) {
      return [];
    }
    return Object.keys(domain.forms);
  }

  /**
   * Get the output channel for logging
   */
  public getOutputChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }
}
