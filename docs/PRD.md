# 🧩 Product Requirements Document (PRD)

**Product Name:** Rasa Pro VS Code Extension  
**Version:** 1.0 (MVP)  
**Owner:** rcpassos  
**Date:** 2025-10-13

---

## 1. 🎯 Overview

The **Rasa Pro VS Code Extension** provides a rich, integrated development experience for Rasa and Rasa Pro projects.  
It enhances productivity by offering smart autocomplete, validation, and navigation across Rasa YAML files and Python actions — directly within VS Code.

**Goal:**  
Reduce context-switching and manual debugging for Rasa developers by integrating core Rasa authoring, validation, and training workflows into VS Code.

---

## 2. 👥 Target Users & Personas

### 🎯 Primary Persona:

**“The Conversational AI Engineer”**

- Works daily with Rasa Open Source or Rasa Pro.
- Uses VS Code as their main IDE.
- Struggles with YAML consistency, command-line overhead, and project navigation.

**Pain Points:**

- Frequent YAML schema mismatches (e.g., undefined intents or responses).
- Switching between terminal and editor for training/testing.
- Difficulty visualizing and managing intents, actions, and responses.

### 🧠 Secondary Personas:

- **Data Scientist / NLU Trainer:** Focused on training data and intent examples.
- **QA Engineer:** Tests conversation flows using Rasa CLI.
- **Enterprise Developer:** Integrates Rasa Pro pipelines, versioning, and deployments.

---

## 3. 🚀 Product Objectives

| Objective                           | Description                                                  | Success Metric                                                 |
| ----------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| Improve Rasa developer productivity | Reduce time spent debugging YAML and domain mismatches       | 50% reduction in validation errors before training             |
| Simplify project management         | Provide an integrated explorer for Rasa entities             | 70% of users navigate using the sidebar instead of file search |
| Integrate Rasa CLI in-editor        | Allow users to train and test models without leaving VS Code | 90% of test users no longer open an external terminal          |
| Increase onboarding speed           | Provide snippets and templates for common Rasa patterns      | New users build first bot 30% faster                           |

---

## 4. 🧱 Scope (MVP v1.0)

### ✅ In Scope (MVP)

1. **YAML IntelliSense & Validation**

   - Autocomplete for intents, entities, slots, actions, and responses.
   - Schema validation and inline errors.
   - Hover documentation linking to definitions.

2. **Domain Consistency Checker**

   - Validate project for missing or unused intents/actions/responses.
   - Display issues in VS Code Problems panel with file/line links.

3. **Rasa Command Palette Integration**

   - Commands: `Rasa: Train Model`, `Rasa: Run Action Server`, `Rasa: Shell`, `Rasa: Test`.
   - Log output in dedicated “Rasa Output” channel.

4. **Snippets Library**

   - Predefined YAML and Python snippets:
     - Intent example
     - Story template
     - Response template
     - Custom action boilerplate

5. **Rasa Project Explorer Sidebar**

   - Tree view listing intents, entities, slots, responses, and actions.
   - Click to navigate to source definition.

6. **Extension Configuration Settings**
   - `rasa-pro-vscode.rasaExecutable` - Path to Rasa CLI
   - `rasa-pro-vscode.projectRoot` - Root directory for Rasa project
   - `rasa-pro-vscode.enableDiagnostics` - Toggle validation
   - `rasa-pro-vscode.maxFileSize` - Limit for parsing large files

---

### ❌ Out of Scope (for MVP)

- AI-based story or response generation.
- Rasa X / Rasa Pro server sync.
- Visualization of conversation graphs.
- Inline NLU testing console.

---

## 5. ⚙️ Functional Requirements

| ID  | Feature                    | Description                                                    | Priority |
| --- | -------------------------- | -------------------------------------------------------------- | -------- |
| F1  | YAML IntelliSense          | Context-aware autocomplete for domain, NLU, stories, and rules | P0       |
| F2  | Schema Validation          | Validate YAML syntax and Rasa structure inline                 | P0       |
| F3  | Domain Consistency Checker | Detect missing or unused definitions                           | P0       |
| F4  | Rasa CLI Integration       | Run core CLI commands from command palette                     | P1       |
| F5  | Snippets Library           | Provide predefined YAML/Python templates                       | P1       |
| F6  | Project Explorer           | Tree view for Rasa components                                  | P1       |

---

## 6. 💻 Technical Requirements

| Area                        | Details                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| **Platform**                | Visual Studio Code (latest stable)                                                        |
| **Language**                | TypeScript                                                                                |
| **Frameworks/Dependencies** | `vscode` API, `js-yaml`, `fast-glob`, `child_process`, `vscode-languageclient` (optional) |
| **File Types Supported**    | `.yml`, `.yaml`, `.py`                                                                    |
| **Supported OS**            | Windows, macOS, Linux                                                                     |
| **Minimum Rasa Version**    | Rasa Open Source 3.x+, Rasa Pro compatible                                                |
| **Testing**                 | VS Code integration tests via `@vscode/test-electron`, Mocha unit tests                   |
| **Activation Events**       | `onLanguage:yaml`, `workspaceContains:**/domain.yml`, `workspaceContains:**/config.yml`   |
| **Code Coverage Target**    | Minimum 80% for core services, 70% overall                                                |

---

## 7. 🔒 Non-Functional Requirements

| Type              | Requirement                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| **Performance**   | Parsing and completion generation under 300ms for 1000+ intents                  |
| **Scalability**   | Should handle enterprise-scale Rasa projects with 100+ YAML files                |
| **Usability**     | Autocomplete and diagnostics should work seamlessly as users type                |
| **Reliability**   | Must not crash VS Code or block file save operations                             |
| **Security**      | No remote API calls or telemetry without explicit consent                        |
| **Extensibility** | Architecture must allow future AI-powered features (e.g., auto story generation) |

---

## 8. 🧭 User Flow

1. User opens a Rasa project in VS Code.
2. Extension activates, detects Rasa file structure, and builds in-memory model.
3. User edits YAML files:
   - Autocomplete appears.
   - Errors and warnings show in Problems panel.
4. User runs `Rasa: Train Model` from Command Palette.
   - Training logs appear in “Rasa Output” panel.
5. User expands the “Rasa Explorer” sidebar to navigate to intents/responses.
6. User inserts new templates with snippet shortcuts.

---

## 9. 📊 Success Metrics

| Metric                                       | Target     |
| -------------------------------------------- | ---------- |
| Extension startup latency                    | < 1 second |
| IntelliSense response time                   | < 200ms    |
| CLI command success rate                     | > 95%      |
| Active installs (first 3 months)             | 500+       |
| User satisfaction rating (internal feedback) | ≥ 4.5 / 5  |

---

## 10. 📅 Roadmap (3-Month MVP Plan)

| Phase       | Duration   | Deliverables                                      |
| ----------- | ---------- | ------------------------------------------------- |
| **Phase 1** | Week 1–2   | Project setup, Rasa file detection & YAML parsing |
| **Phase 2** | Week 3–4   | IntelliSense + Validation                         |
| **Phase 3** | Week 5–6   | Domain Consistency Checker                        |
| **Phase 4** | Week 7–8   | Command Palette integration                       |
| **Phase 5** | Week 9–10  | Snippets + Project Explorer UI                    |
| **Phase 6** | Week 11–12 | Testing, docs, and VS Marketplace release         |

---

## 11. 🧰 Future Enhancements (Post-MVP)

- AI-powered story and response generation.
- NLU data visualization and balancing tools (intent distribution, entity coverage).
- Integrated NLU testing console with inline predictions.
- Rasa X / Pro server synchronization.
- Team collaboration features (e.g., shared annotations).
- Form validation and slot mapping helpers.
- Interactive conversation flow diagrams.
- Performance profiling for custom actions.
- Multi-language NLU support helpers.

---

## 12. 📘 References

- [Rasa Open Source Docs](https://rasa.com/docs/rasa/)
- [Rasa Pro Docs](https://rasa.com/docs/rasa-pro/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/)
- [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)
