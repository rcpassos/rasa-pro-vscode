# Diagnostic Provider Testing Guide

## Overview

The Diagnostic Provider validates Rasa YAML files and reports errors/warnings in the VS Code Problems panel. It provides real-time feedback on:

1. **YAML syntax errors** - Invalid YAML structure
2. **Rasa schema validation** - Domain structure validation (version, slots, responses, forms)
3. **Cross-file references** - (Planned) Undefined/unused components

## Manual Testing

### Prerequisites

1. Open the extension in debug mode (F5)
2. Open a Rasa project in the Extension Development Host window

### Test Cases

#### 1. YAML Syntax Errors

**Test:** Create invalid YAML syntax

```yaml
# Create a file: test-domain.yml
version: "3.1"
intents:
  - greet
  - goodbye
    - invalid_indent # This will cause a YAML error
```

**Expected:** Red squiggly line under the invalid indentation with error message in Problems panel

#### 2. Missing Version Field

**Test:** Domain file without version

```yaml
# domain.yml
intents:
  - greet

responses:
  utter_greet:
    - text: "Hello!"
```

**Expected:** Error diagnostic: "Missing required field: version"

#### 3. Invalid Slot Type

**Test:** Slot with invalid type

```yaml
# domain.yml
version: "3.1"

slots:
  my_slot:
    type: invalid_type # Should be: text, bool, categorical, float, list, or any
    influence_conversation: false
    mappings:
      - type: from_text
```

**Expected:** Error: "Invalid slot type 'invalid_type' for slot 'my_slot'. Must be one of: text, bool, categorical, float, list, any"

#### 4. Invalid Response Structure

**Test:** Response as string instead of array

```yaml
# domain.yml
version: "3.1"

responses:
  utter_greet: "This should be an array" # Wrong format
```

**Expected:** Error: "Invalid response 'utter_greet'. Responses must be arrays."

#### 5. Valid Domain (No Errors)

**Test:** Properly formatted domain file

```yaml
# domain.yml
version: "3.1"

intents:
  - greet
  - goodbye

entities:
  - name

slots:
  name:
    type: text
    influence_conversation: false
    mappings:
      - type: from_text

responses:
  utter_greet:
    - text: "Hello!"
  utter_goodbye:
    - text: "Goodbye!"

actions:
  - action_custom
```

**Expected:** No errors or warnings in Problems panel

#### 6. Real-time Validation

**Test:** Type invalid YAML and watch diagnostics update

1. Open a domain.yml file
2. Start typing an invalid slot configuration
3. Watch the Problems panel update in real-time as you type

**Expected:** Diagnostics appear/disappear as you fix/introduce errors

#### 7. File System Watcher

**Test:** External file changes

1. Open a domain.yml in VS Code
2. Edit the file externally (e.g., in another editor)
3. Save the external changes

**Expected:** Diagnostics update automatically when file changes are detected

#### 8. Configuration - Disable Diagnostics

**Test:** Disable validation via settings

1. Open Settings (Cmd+, on macOS)
2. Search for "Rasa Pro"
3. Uncheck "Enable Diagnostics"
4. Open a file with errors

**Expected:** No diagnostics shown in Problems panel

### Automated Testing

Run the test suite:

```bash
npm test
```

The test suite includes:

- YAML syntax error detection
- Missing version field detection
- Invalid slot type detection
- Invalid response structure detection
- Valid domain validation
- Clear diagnostics functionality
- Configuration-based enablement

## Implementation Details

### Key Features

1. **Real-time Validation**

   - Listens to `onDidChangeTextDocument` events
   - Updates diagnostics as you type (with appropriate debouncing)

2. **File System Watching**

   - Uses `vscode.workspace.createFileSystemWatcher()`
   - Watches `**/*.{yml,yaml}` patterns
   - Updates on create, change, delete events

3. **Smart File Detection**

   - Only validates Rasa-related YAML files
   - Recognizes: domain.yml, config.yml, data/nlu.yml, data/stories.yml, data/rules.yml, etc.

4. **Error Location**

   - Attempts to pinpoint exact line/column from YAML parser
   - Falls back to keyword search if precise location unavailable
   - Highlights relevant code sections

5. **Configurable**
   - Can be enabled/disabled via `rasa-pro-vscode.enableDiagnostics` setting
   - Respects workspace-specific settings

### Architecture

```
RasaDiagnosticProvider
├── Event Handlers
│   ├── onDidChangeTextDocument - Real-time validation
│   ├── onDidOpenTextDocument - Validate on open
│   ├── onDidCloseTextDocument - Clear diagnostics
│   └── FileSystemWatcher - External changes
├── Validation Pipeline
│   ├── 1. YAML Syntax Validation (via js-yaml)
│   ├── 2. Rasa Schema Validation (domain, config, etc.)
│   └── 3. Cross-file References (TODO)
└── Diagnostic Collection
    ├── Convert errors to VS Code Diagnostics
    ├── Set ranges with line/column info
    └── Display in Problems panel
```

### Future Enhancements

1. **Cross-file Validation** (Phase 3)

   - Detect undefined intents in stories/rules
   - Find unused responses
   - Validate action references
   - Check form slot references

2. **Quick Fixes**

   - Add CodeAction provider for auto-fixes
   - "Add missing version field"
   - "Convert response to array format"
   - "Fix slot type"

3. **Additional File Types**

   - Validate stories.yml structure
   - Validate rules.yml structure
   - Validate NLU data format
   - Validate config.yml pipeline/policies

4. **Performance Optimizations**
   - Debounce validation on rapid typing
   - Cache parsed domain data
   - Incremental validation for large files

## Troubleshooting

### Diagnostics Not Showing

1. Check if extension is activated (look for "Rasa project detected!" message)
2. Verify file is recognized as Rasa YAML (check file path/name)
3. Check if diagnostics are enabled in settings
4. Look at "Rasa Diagnostics" output channel for logs

### Incorrect Error Locations

- The provider attempts to use line/column from YAML parser
- If unavailable, it searches for keywords in the error message
- Some errors may point to line 0 if location can't be determined

### Extension Not Activating

- Ensure workspace contains `domain.yml` and `config.yml`
- Check activation events in package.json
- Look at Extension Host logs (Help > Toggle Developer Tools)

## Output Channels

The diagnostic provider logs to the "Rasa Diagnostics" output channel:

1. Open Output panel (View > Output)
2. Select "Rasa Diagnostics" from dropdown
3. View validation logs and error details

Example log output:

```
[10:30:45] Validating domain.yml...
[10:30:45] Found 2 syntax error(s) in domain.yml
[10:30:50] Validation complete for domain.yml: 0 error(s), 1 warning(s)
```
