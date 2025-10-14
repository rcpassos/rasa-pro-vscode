# GitHub Copilot Instructions - Rasa Pro VS Code Extension

## 🎯 Project Overview

This is a VS Code extension that provides an integrated development experience for Rasa and Rasa Pro projects. The extension enhances productivity by offering smart autocomplete, validation, navigation, and CLI integration for Rasa YAML files and Python actions.

**Target Users:** Conversational AI Engineers, Data Scientists, QA Engineers working with Rasa Open Source or Rasa Pro.

## 🏗️ Architecture & Technical Stack

### Core Technologies

- **Language**: TypeScript
- **Platform**: VS Code Extension API (v1.105.0+)
- **Build**: TypeScript compiler with watch mode
- **Testing**: Mocha with `@vscode/test-electron`

### Key Dependencies (to be added)

- `js-yaml` - YAML parsing and validation
- `fast-glob` - File system scanning (for initial project scan)
- `child_process` - Rasa CLI integration (Node.js built-in)
- `vscode-languageclient` - Optional LSP support

**Note:** Use VS Code's built-in `createFileSystemWatcher` for file watching, NOT Chokidar

### File Structure

```
src/
├── extension.ts           # Main extension entry point
├── providers/            # IntelliSense providers
│   ├── completionProvider.ts
│   ├── diagnosticProvider.ts
│   └── hoverProvider.ts
├── services/             # Core business logic
│   ├── rasaProjectService.ts
│   ├── yamlParserService.ts
│   └── cliIntegrationService.ts
├── views/                # UI components
│   ├── explorerView.ts
│   └── outputChannel.ts
└── test/                 # Test files
```

## 🎯 MVP Feature Requirements (Priority Order)

### P0 Features (Core MVP)

1. **YAML IntelliSense & Validation**

   - Context-aware autocomplete for intents, entities, slots, actions, responses
   - Schema validation with inline error reporting
   - Hover documentation with definition links

2. **Domain Consistency Checker**

   - Detect missing/unused intents, actions, responses
   - Display issues in VS Code Problems panel with navigation

3. **Rasa CLI Integration**
   - Command palette commands: Train, Run Action Server, Shell, Test
   - Dedicated "Rasa Output" channel for logs

### P1 Features (Secondary MVP)

4. **Snippets Library**

   - YAML templates: intents, stories, responses, rules
   - Python action boilerplate

5. **Project Explorer Sidebar**
   - Tree view of Rasa components with click-to-navigate

## 📁 Rasa Project Structure Understanding

### Key File Types to Support

- `domain.yml` / `domain/` - Core domain configuration (can be split into multiple files)
- `nlu.yml` / `data/nlu/` - Training data and intents
- `stories.yml` / `data/stories/` - Conversation flows
- `rules.yml` / `data/rules/` - Deterministic conversation rules
- `config.yml` - Pipeline configuration
- `actions/actions.py` - Custom Python actions
- `endpoints.yml` - External service connections (action server, tracker store, etc.)
- `credentials.yml` - Messaging channel credentials
- `tests/` - Test conversation files

### Domain Schema Structure

```yaml
version: "3.1"

intents:
  - greet
  - goodbye
  - inform

entities:
  - name
  - location

slots:
  name:
    type: text
    influence_conversation: false
    mappings:
      - type: from_text
  location:
    type: text
    influence_conversation: true
    mappings:
      - type: from_entity
        entity: location

responses:
  utter_greet:
    - text: "Hello! How can I help you?"
    - text: "Hi there!"
  utter_goodbye:
    - text: "Bye!"

actions:
  - action_custom
  - utter_greet
  - utter_goodbye

forms:
  reservation_form:
    required_slots:
      - name
      - location
```

### Slot Types to Support

- `text` - Stores text values
- `bool` - Stores true/false
- `categorical` - Stores values from a predefined list
- `float` - Stores numerical values
- `list` - Stores lists of values
- `any` - Stores any value

## 🔧 Development Guidelines

### Code Style

- Use TypeScript strict mode
- Prefer async/await over promises
- Use VS Code API patterns consistently
- Follow extension naming conventions (`rasa-pro-vscode.commandName`)

### Code Quality Checks

**IMPORTANT:** Always run quality checks after every code change. Follow this workflow:

**Development Workflow:**

1. **During development** (after each code change):

   ```bash
   npm run check:quick  # Fast: Type-check + lint (~5s)
   ```

2. **After completing a feature**:

   ```bash
   npm test  # Run full test suite (~30s)
   ```

   - This catches regressions early
   - Validates integration with existing code
   - Documents expected behavior
   - Saves debugging time later

3. **Before committing**:
   ```bash
   npm run check  # Full compile + lint
   npm test       # Verify all tests pass
   ```

Available check scripts:

- `npm run check` - Full check (compiles to `./out` + lints) - Use before commits
- `npm run check:quick` - Quick check (type-checks without emitting + lints) - Use during development
- `npm test` - Run complete test suite with VS Code test runner

**Never commit code without running both checks and tests!**

### Why Run Tests After Every Feature?

1. **Catch Regressions Early** - Know immediately if new code breaks existing functionality
2. **Validate Integration** - Ensure new features work with the rest of the system
3. **Document Behavior** - Tests serve as living documentation
4. **Save Time** - Finding bugs during development is easier than debugging production issues
5. **Maintain Quality** - Keep code coverage high and bugs low

### Error Handling

- Gracefully handle missing Rasa files
- Provide helpful error messages in Problems panel
- Don't crash VS Code on malformed YAML
- Log diagnostic info to extension output channel

### Performance Requirements

- Parse/completion generation: <300ms for 1000+ intents
- Extension activation: <1 second
- IntelliSense response: <200ms
- Handle enterprise projects with 100+ YAML files

### Testing Strategy

- Unit tests for YAML parsing logic
- Integration tests for VS Code API interactions
- Mock Rasa CLI commands in tests
- Test with various Rasa project structures (flat, nested, split files)
- **Target Code Coverage**: Minimum 80% for core services, 70% overall
- Test edge cases: malformed YAML, missing files, large projects
- Performance benchmarks for completion and parsing

## 🚀 Implementation Phases

### Phase 1: Project Setup (Weeks 1-2)

- Rasa project detection (look for `domain.yml`, `config.yml`)
- YAML file parsing with `js-yaml`
- Basic file watching for changes

### Phase 2: IntelliSense (Weeks 3-4)

- Completion provider for intents, entities, slots
- Diagnostic provider for YAML validation
- Hover provider for definitions

### Phase 3: Domain Consistency (Weeks 5-6)

- Cross-file reference validation
- Unused/missing component detection
- Problems panel integration

### Phase 4: CLI Integration (Weeks 7-8)

- Command palette registration
- Terminal/process management
- Output channel for logs

### Phase 5: UI Components (Weeks 9-10)

- Project explorer tree view
- Snippet contributions
- Status bar indicators

## 💡 Coding Patterns & Best Practices

### Extension Activation

```typescript
export async function activate(context: vscode.ExtensionContext) {
  // Log activation
  console.log("Rasa Pro extension is activating...");

  const rasaProject = new RasaProjectService();
  await rasaProject.initialize();

  // Register providers only if Rasa project detected
  if (rasaProject.isRasaProject()) {
    registerProviders(context, rasaProject);
    vscode.window.showInformationMessage("Rasa project detected!");
  }
}
```

**Activation Events (package.json):**

```json
{
  "activationEvents": [
    "onLanguage:yaml",
    "workspaceContains:**/domain.yml",
    "workspaceContains:**/config.yml",
    "onCommand:rasa-pro-vscode.trainModel"
  ]
}
```

### Project Detection Logic

```typescript
export class RasaProjectService {
  async isRasaProject(): Promise<boolean> {
    // Check for required Rasa files
    const requiredFiles = ["domain.yml", "config.yml"];
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspaceRoot) return false;

    for (const file of requiredFiles) {
      const files = await vscode.workspace.findFiles(
        `**/${file}`,
        "**/node_modules/**",
        1
      );
      if (files.length === 0) return false;
    }

    return true;
  }
}
```

### Configuration Management

- Use VS Code workspace settings for Rasa-specific configs
- Support both global and project-level settings
- Default to Rasa standard conventions

**Extension Configuration Schema:**

```json
{
  "rasa-pro-vscode.rasaExecutable": {
    "type": "string",
    "default": "rasa",
    "description": "Path to Rasa CLI executable"
  },
  "rasa-pro-vscode.projectRoot": {
    "type": "string",
    "description": "Root directory of Rasa project (auto-detected if not specified)"
  },
  "rasa-pro-vscode.enableDiagnostics": {
    "type": "boolean",
    "default": true,
    "description": "Enable real-time validation and diagnostics"
  },
  "rasa-pro-vscode.maxFileSize": {
    "type": "number",
    "default": 1048576,
    "description": "Maximum file size (in bytes) for parsing (default: 1MB)"
  }
}
```

### File Watching

**Use VS Code's built-in file watcher (NOT Chokidar):**

```typescript
const watcher = vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");
watcher.onDidChange((uri) => rasaProject.refreshFile(uri));
watcher.onDidCreate((uri) => rasaProject.addFile(uri));
watcher.onDidDelete((uri) => rasaProject.removeFile(uri));

// Always dispose in deactivate()
context.subscriptions.push(watcher);
```

**Why not Chokidar?**

- VS Code API is native, lighter, and workspace-aware
- Chokidar adds unnecessary bundle size
- Only use Chokidar if watching files outside workspace

### CLI Command Pattern

```typescript
vscode.commands.registerCommand("rasa-pro-vscode.trainModel", async () => {
  const terminal = vscode.window.createTerminal("Rasa Training");
  terminal.sendText("rasa train");
  terminal.show();
});
```

## 🔍 Common Rasa Patterns to Support

### Intent Definitions

- Autocomplete intent names in stories/rules
- Validate intent references exist in `nlu.yml`
- Support intent groups and retrieval intents

### Entity Recognition

- Suggest entity names in training examples
- Validate entity references in slots/forms
- Support synonyms and lookup tables

### Response Templates

- Autocomplete response names (`utter_*`)
- Support conditional responses
- Validate response button payloads

### Action References

- Distinguish between built-in and custom actions
- Validate custom actions exist in `actions.py`
- Support action server endpoint validation

### Forms and Slot Mappings

- Validate required_slots reference existing slots
- Support form validation rules
- Auto-complete slot mapping types: `from_entity`, `from_text`, `from_intent`, `custom`
- Validate form activation conditions

### Stories and Rules

- Validate checkpoint references
- Support OR statements in stories
- Validate slot_was_set conditions
- Support active_loop for form handling

## 🚫 Out of Scope (Don't Implement in MVP)

- AI-powered story generation
- Rasa X/Pro server synchronization
- Conversation flow visualization
- Inline NLU testing console
- Real-time model training feedback

## 🎯 Success Metrics to Keep in Mind

- Extension startup < 1 second
- IntelliSense response < 200ms
- CLI command success rate > 95%
- Support projects with 100+ YAML files
- Zero VS Code crashes from extension

## ⚠️ Common Pitfalls to Avoid

### Performance Issues

- **Don't** parse all YAML files synchronously on activation
- **Don't** block the main thread with heavy operations
- **Do** use debouncing for file watcher events
- **Do** implement incremental parsing for large files

### YAML Parsing

- **Don't** assume YAML is always valid
- **Don't** crash on circular references in domain files
- **Do** handle split domain files across multiple directories
- **Do** support both `domain.yml` and `domain/` folder structures

### Extension Lifecycle

- **Don't** activate unless it's a Rasa project
- **Don't** register global event handlers without cleanup
- **Do** dispose of resources in `deactivate()`
- **Do** handle workspace folder changes gracefully

### CLI Integration

- **Don't** assume `rasa` is in PATH
- **Don't** run CLI commands without user feedback
- **Do** validate Rasa installation before running commands
- **Do** provide clear error messages when CLI fails

## 📦 Package.json Configuration

**Categories:** Use appropriate VS Code marketplace categories:

```json
{
  "categories": ["Programming Languages", "Linters", "Snippets", "Other"]
}
```

**Keywords for discoverability:**

- `rasa`, `rasa-pro`, `conversational-ai`, `chatbot`, `nlu`, `dialogue`, `yaml`, `assistant`

## 🔗 Key Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Rasa Open Source Docs](https://rasa.com/docs/rasa/)
- [Rasa Domain Format](https://rasa.com/docs/rasa/domain)
- [YAML Schema Validation](https://www.npmjs.com/package/js-yaml)

---

## 🎓 Remember

**Focus on developer productivity, maintain excellent performance, and provide a seamless integration with existing Rasa workflows.**

When implementing features:

1. Start with the happy path, then handle edge cases
2. Prioritize user feedback and error messages
3. Test with real Rasa projects of varying sizes
4. Keep the extension lightweight and fast
5. Document complex logic with clear comments
