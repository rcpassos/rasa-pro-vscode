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
- `fast-glob` - File system scanning
- `child_process` - Rasa CLI integration
- `vscode-languageclient` - Optional LSP support

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

- `domain.yml` - Core domain configuration
- `nlu.yml` - Training data and intents
- `stories.yml` - Conversation flows
- `rules.yml` - Deterministic conversation rules
- `config.yml` - Pipeline configuration
- `actions.py` - Custom Python actions
- `endpoints.yml` - External service configurations

### Domain Schema Structure

```yaml
intents:
  - greet
  - goodbye
entities:
  - name
slots:
  name:
    type: text
responses:
  utter_greet:
    - text: "Hello!"
actions:
  - action_custom
```

## 🔧 Development Guidelines

### Code Style

- Use TypeScript strict mode
- Prefer async/await over promises
- Use VS Code API patterns consistently
- Follow extension naming conventions (`rasa-pro-vscode.commandName`)

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
- Test with various Rasa project structures

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
  const rasaProject = new RasaProjectService();
  await rasaProject.initialize();

  // Register providers only if Rasa project detected
  if (rasaProject.isRasaProject()) {
    registerProviders(context, rasaProject);
  }
}
```

### Configuration Management

- Use VS Code workspace settings for Rasa-specific configs
- Support both global and project-level settings
- Default to Rasa standard conventions

### File Watching

```typescript
const watcher = vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");
watcher.onDidChange((uri) => rasaProject.refreshFile(uri));
```

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

## 🔗 Key Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Rasa Open Source Docs](https://rasa.com/docs/rasa/)
- [Rasa Domain Format](https://rasa.com/docs/rasa/domain)
- [YAML Schema Validation](https://www.npmjs.com/package/js-yaml)

Remember: Focus on developer productivity, maintain excellent performance, and provide a seamless integration with existing Rasa workflows.
