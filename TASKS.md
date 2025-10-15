# Development Tasks - Rasa Pro VS Code Extension

**Last Updated:** 2025-10-13

---

## 📋 Phase 1: Project Setup

### Setup & Configuration

- [x] Install dependencies: `js-yaml`, `fast-glob`
- [x] Update `package.json` with proper metadata (displayName, description, categories, keywords)
- [x] Configure TypeScript strict mode in `tsconfig.json`
- [x] Set up activation events in `package.json`

### Core Services

- [x] Create `src/services/rasaProjectService.ts` - Project detection logic
- [x] Create `src/services/yamlParserService.ts` - YAML parsing with js-yaml
- [x] Implement file watcher using `vscode.workspace.createFileSystemWatcher()` (NOT Chokidar)
- [x] Test project detection with sample Rasa projects

---

## 📋 Phase 2: IntelliSense

### Completion Provider

- [x] Create `src/providers/completionProvider.ts`
- [x] Implement intent autocomplete
- [x] Implement entity autocomplete
- [x] Implement slot autocomplete
- [x] Implement action autocomplete
- [x] Implement response (`utter_*`) autocomplete

### Diagnostic Provider

- [x] Create `src/providers/diagnosticProvider.ts`
- [x] Validate YAML syntax errors
- [x] Validate Rasa schema structure
- [x] Display errors in Problems panel

### Hover Provider

- [x] Create `src/providers/hoverProvider.ts`
- [x] Show definitions on hover
- [x] Add navigation links to definitions

---

## 📋 Phase 3: Domain Consistency

### Cross-File Validation

- [x] Detect undefined intents referenced in stories/rules
- [x] Detect unused intents in domain
- [x] Detect undefined actions
- [x] Detect unused responses
- [x] Detect missing slot definitions
- [x] Detect undefined slots in stories/rules
- [x] Detect undefined forms in stories/rules (active_loop)
- [x] Handle built-in Rasa actions (action_listen, action_restart, etc.)

### Problems Panel Integration

- [x] Link errors to specific files and line numbers
- [x] Add quick-fix suggestions where possible (via diagnostic codes)
- [x] Support split domain files validation
- [x] Debounced validation to improve performance

---

## 📋 Phase 4: CLI Integration

### Command Palette Commands

- [x] Register command: `Rasa: Train Model`
- [x] Register command: `Rasa: Run Action Server`
- [x] Register command: `Rasa: Shell`
- [x] Register command: `Rasa: Test`
- [x] Validate Rasa installation before running commands

### Output Management

- [x] Create dedicated "Rasa Output" channel
- [x] Stream CLI output to output channel
- [x] Handle CLI errors gracefully
- [x] Add status bar indicators during operations

---

## 📋 Phase 5: UI Components

### Project Explorer

- [ ] Create `src/views/explorerView.ts`
- [ ] Build tree view for intents
- [ ] Build tree view for entities
- [ ] Build tree view for slots
- [ ] Build tree view for responses
- [ ] Build tree view for actions
- [ ] Implement click-to-navigate functionality

### Snippets

- [ ] Create YAML snippet: Intent example
- [ ] Create YAML snippet: Story template
- [ ] Create YAML snippet: Rule template
- [ ] Create YAML snippet: Response template
- [ ] Create Python snippet: Custom action boilerplate
- [ ] Register snippets in `package.json`

---

## 📋 Phase 6: Testing & Release

### Testing

- [ ] Write unit tests for `rasaProjectService`
- [ ] Write unit tests for `yamlParserService`
- [ ] Write integration tests for completion provider
- [ ] Write integration tests for diagnostics
- [ ] Test with real Rasa projects (small, medium, large)
- [ ] Achieve 80% code coverage for core services

### Documentation

- [ ] Update README.md with features and usage
- [ ] Add screenshots/GIFs of features
- [ ] Document configuration settings
- [ ] Create CHANGELOG.md
- [ ] Write contribution guidelines

### Release

- [ ] Package extension with `vsce package`
- [ ] Test .vsix installation locally
- [ ] Publish to VS Code Marketplace
- [ ] Create GitHub release with notes

---

## 🎯 Quick Wins (Can be done anytime)

- [ ] Add extension icon
- [ ] Set up GitHub Actions for CI/CD
- [ ] Add ESLint rules enforcement
- [ ] Add Prettier for code formatting
- [ ] Create issue templates for GitHub

---

## 📝 Notes

- Keep PRD and Copilot Instructions updated as requirements evolve
- Focus on performance: <1s activation, <200ms IntelliSense
- Test edge cases: malformed YAML, missing files, large projects
- Prioritize P0 features before P1 features
