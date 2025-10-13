# Development Tasks - Rasa Pro VS Code Extension

**Last Updated:** 2025-10-13

---

## 📋 Phase 1: Project Setup (Weeks 1-2)

### Setup & Configuration

- [ ] Install dependencies: `js-yaml`, `fast-glob`
- [ ] Update `package.json` with proper metadata (displayName, description, categories, keywords)
- [ ] Configure TypeScript strict mode in `tsconfig.json`
- [ ] Set up activation events in `package.json`

### Core Services

- [ ] Create `src/services/rasaProjectService.ts` - Project detection logic
- [ ] Create `src/services/yamlParserService.ts` - YAML parsing with js-yaml
- [ ] Implement file watcher using `vscode.workspace.createFileSystemWatcher()` (NOT Chokidar)
- [ ] Test project detection with sample Rasa projects

---

## 📋 Phase 2: IntelliSense (Weeks 3-4)

### Completion Provider

- [ ] Create `src/providers/completionProvider.ts`
- [ ] Implement intent autocomplete
- [ ] Implement entity autocomplete
- [ ] Implement slot autocomplete
- [ ] Implement action autocomplete
- [ ] Implement response (`utter_*`) autocomplete

### Diagnostic Provider

- [ ] Create `src/providers/diagnosticProvider.ts`
- [ ] Validate YAML syntax errors
- [ ] Validate Rasa schema structure
- [ ] Display errors in Problems panel

### Hover Provider

- [ ] Create `src/providers/hoverProvider.ts`
- [ ] Show definitions on hover
- [ ] Add navigation links to definitions

---

## 📋 Phase 3: Domain Consistency (Weeks 5-6)

### Cross-File Validation

- [ ] Detect undefined intents referenced in stories/rules
- [ ] Detect unused intents in domain
- [ ] Detect undefined actions
- [ ] Detect unused responses
- [ ] Detect missing slot definitions

### Problems Panel Integration

- [ ] Link errors to specific files and line numbers
- [ ] Add quick-fix suggestions where possible
- [ ] Support split domain files validation

---

## 📋 Phase 4: CLI Integration (Weeks 7-8)

### Command Palette Commands

- [ ] Register command: `Rasa: Train Model`
- [ ] Register command: `Rasa: Run Action Server`
- [ ] Register command: `Rasa: Shell`
- [ ] Register command: `Rasa: Test`
- [ ] Validate Rasa installation before running commands

### Output Management

- [ ] Create dedicated "Rasa Output" channel
- [ ] Stream CLI output to output channel
- [ ] Handle CLI errors gracefully
- [ ] Add status bar indicators during operations

---

## 📋 Phase 5: UI Components (Weeks 9-10)

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

## 📋 Phase 6: Testing & Release (Weeks 11-12)

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

## 📊 Progress Tracking

**Phase 1:** ⬜️⬜️⬜️⬜️ 0/4 completed  
**Phase 2:** ⬜️⬜️⬜️ 0/3 completed  
**Phase 3:** ⬜️⬜️ 0/2 completed  
**Phase 4:** ⬜️⬜️ 0/2 completed  
**Phase 5:** ⬜️⬜️ 0/2 completed  
**Phase 6:** ⬜️⬜️⬜️ 0/3 completed

**Overall Progress:** 0% (0/16 sections)

---

## 📝 Notes

- Keep PRD and Copilot Instructions updated as requirements evolve
- Focus on performance: <1s activation, <200ms IntelliSense
- Test edge cases: malformed YAML, missing files, large projects
- Prioritize P0 features before P1 features
