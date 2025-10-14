# Manual Testing Guide - Project Detection

This guide walks through manually testing the Rasa project detection functionality.

## Prerequisites

1. VS Code installed
2. Extension compiled: `npm run compile`
3. Test projects created in `test-projects/` directory

---

## Test 1: Basic Rasa Project Detection

**Objective**: Verify that a standard Rasa project is correctly detected

### Steps:

1. Open VS Code
2. Press `F5` to launch Extension Development Host (or Run > Start Debugging)
3. In the new window: File > Open Folder
4. Navigate to `test-projects/basic-rasa-project/`
5. Click "Open"

### Expected Results:

- ✅ Extension activates
- ✅ Information message appears: "Rasa project detected!"
- ✅ Console log shows: "Rasa Pro extension activated successfully"

### Verify:

1. Open the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
2. Run command: "Rasa Pro: Hello World"
3. Should see message: "Rasa Pro extension active! Found X Rasa files."

### Check Output Channel:

1. View > Output
2. Select "Rasa Pro" from dropdown
3. Should see logs like:

```
[timestamp] Initializing Rasa Project Service...
[timestamp] Workspace root: /path/to/basic-rasa-project
[timestamp] ✓ Found required file: domain.yml
[timestamp] ✓ Found required file: config.yml
[timestamp] ✓ Rasa project detected!
[timestamp] Scanning project files...
[timestamp] Found X Rasa files
[timestamp] File watcher set up successfully
```

---

## Test 2: Split Domain Project Detection

**Objective**: Verify that projects with split domain files are detected

### Steps:

1. File > Open Folder
2. Navigate to `test-projects/split-domain-project/`
3. Click "Open"

### Expected Results:

- ✅ Extension activates
- ✅ Information message appears: "Rasa project detected!"
- ✅ All domain files (intents.yml, entities.yml, slots.yml, etc.) are recognized

### Verify:

1. Open "Rasa Pro" output channel
2. Check that files from `domain/` directory are listed:

```
[timestamp] Found X Rasa files
```

---

## Test 3: Invalid Project (No Domain)

**Objective**: Verify that projects without domain.yml are NOT detected

### Steps:

1. File > Open Folder
2. Navigate to `test-projects/invalid-project-no-domain/`
3. Click "Open"

### Expected Results:

- ✅ Extension activates but doesn't detect Rasa project
- ❌ NO information message about Rasa project
- ✅ Console shows: "No Rasa project detected in workspace"

### Verify:

1. Run command: "Rasa Pro: Hello World"
2. Should see generic message: "Hello from Rasa Pro extension!"
3. Check output channel:

```
[timestamp] Initializing Rasa Project Service...
[timestamp] Workspace root: /path/to/invalid-project-no-domain
[timestamp] Required file not found: domain.yml
[timestamp] ✗ No Rasa project detected in workspace
```

---

## Test 4: Invalid Project (Empty Domain)

**Objective**: Verify that projects with invalid domain structure are NOT detected

### Steps:

1. File > Open Folder
2. Navigate to `test-projects/invalid-project-empty-domain/`
3. Click "Open"

### Expected Results:

- ✅ Extension activates but doesn't detect Rasa project
- ❌ NO information message about Rasa project
- ✅ Output shows validation failed

### Verify:

1. Check output channel:

```
[timestamp] ✓ Found required file: domain.yml
[timestamp] ✓ Found required file: config.yml
[timestamp] ✗ Invalid domain structure detected
[timestamp] ✗ No Rasa project detected in workspace
```

---

## Test 5: File Watcher - Create File

**Objective**: Verify that file watcher detects new YAML files

### Steps:

1. Open `basic-rasa-project` in VS Code
2. Open "Rasa Pro" output channel
3. Create a new file: `data/test_nlu.yml`
4. Add some content:

```yaml
version: "3.1"

nlu:
  - intent: test_intent
    examples: |
      - test example
```

5. Save the file

### Expected Results:

- ✅ Output channel shows:

```
[timestamp] File created: /path/to/data/test_nlu.yml
[timestamp] Added file: data/test_nlu.yml
```

---

## Test 6: File Watcher - Modify File

**Objective**: Verify that file watcher detects file changes

### Steps:

1. Still in `basic-rasa-project`
2. Open `domain.yml`
3. Add a new intent to the list:

```yaml
intents:
  - greet
  - goodbye
  - test_new_intent # Add this line
```

4. Save the file

### Expected Results:

- ✅ Output channel shows:

```
[timestamp] File changed: /path/to/domain.yml
[timestamp] Refreshed file: domain.yml
```

---

## Test 7: File Watcher - Delete File

**Objective**: Verify that file watcher detects file deletions

### Steps:

1. Still in `basic-rasa-project`
2. Right-click on `data/test_nlu.yml` (created in Test 5)
3. Select "Delete"
4. Confirm deletion

### Expected Results:

- ✅ Output channel shows:

```
[timestamp] File deleted: /path/to/data/test_nlu.yml
[timestamp] Removed file: data/test_nlu.yml
```

---

## Test 8: Non-Rasa YAML File

**Objective**: Verify that non-Rasa YAML files are ignored

### Steps:

1. Still in `basic-rasa-project`
2. Create a new file: `random-config.yml`
3. Add content:

```yaml
some_key: some_value
```

4. Save the file

### Expected Results:

- ✅ File is created but NOT added to Rasa project files
- ✅ Output channel shows file changed event but NOT "Added file" message
- ✅ File pattern doesn't match Rasa patterns

---

## Test 9: Multiple File Operations

**Objective**: Verify file watcher handles rapid changes

### Steps:

1. Still in `basic-rasa-project`
2. Quickly perform these actions:
   - Modify `domain.yml`
   - Modify `config.yml`
   - Create `data/bulk_test.yml`
3. Save all files

### Expected Results:

- ✅ All events are logged in order
- ✅ No errors or crashes
- ✅ Extension remains responsive

---

## Test 10: Extension Deactivation

**Objective**: Verify proper cleanup when extension deactivates

### Steps:

1. With any test project open
2. Close the Extension Development Host window
3. Check for any errors in the main VS Code window's Developer Console

### Expected Results:

- ✅ No errors in console
- ✅ File watchers are disposed
- ✅ Clean shutdown

---

## Troubleshooting

### Extension doesn't activate

1. Check that you're running in Extension Development Host (F5)
2. Verify the extension compiled without errors: `npm run compile`
3. Check the Debug Console for activation errors

### File watcher events not appearing

1. Ensure "Rasa Pro" is selected in Output dropdown
2. Verify you're editing files in the workspace
3. Check that files match Rasa patterns (domain, data/, config, etc.)

### "Rasa project detected" doesn't appear

1. Verify both `domain.yml` and `config.yml` exist
2. Check `domain.yml` contains valid Rasa keys (intents, entities, slots, responses, actions, or forms)
3. Check output channel for specific error messages

---

## Checklist

After running all tests, verify:

- [ ] Basic project detection works
- [ ] Split domain detection works
- [ ] Invalid projects are rejected
- [ ] File creation is detected
- [ ] File modification is detected
- [ ] File deletion is detected
- [ ] Non-Rasa files are ignored
- [ ] Multiple operations work smoothly
- [ ] Clean deactivation occurs
- [ ] No errors in console
- [ ] Output logs are clear and helpful

---

## Next Steps

After manual testing is complete:

1. Run automated tests: `npm test`
2. Update TASKS.md to mark testing complete
3. Document any bugs or issues found
4. Move on to Phase 2: IntelliSense implementation
