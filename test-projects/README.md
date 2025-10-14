# Test Projects for Rasa Pro VS Code Extension

This directory contains sample Rasa projects used for testing the extension's project detection and file parsing capabilities.

## Project Structure

### 1. `basic-rasa-project/`

**Purpose**: Test standard Rasa project detection  
**Structure**: Single `domain.yml` file with all domain configuration  
**Files**:

- `domain.yml` - Complete domain with intents, entities, slots, responses, actions, and forms
- `config.yml` - Pipeline and policy configuration
- `data/nlu.yml` - Training examples for intents
- `data/stories.yml` - Conversation stories
- `data/rules.yml` - Conversation rules

**Expected Result**: ✅ Should be detected as a valid Rasa project

---

### 2. `split-domain-project/`

**Purpose**: Test split domain file detection  
**Structure**: Domain split into multiple files in `domain/` directory  
**Files**:

- `domain/intents.yml` - Intent definitions
- `domain/entities.yml` - Entity definitions
- `domain/slots.yml` - Slot definitions
- `domain/responses.yml` - Response templates
- `domain/actions.yml` - Action definitions
- `config.yml` - Pipeline and policy configuration

**Expected Result**: ✅ Should be detected as a valid Rasa project

---

### 3. `invalid-project-no-domain/`

**Purpose**: Test detection failure when domain.yml is missing  
**Structure**: Has `config.yml` and training data but no domain  
**Files**:

- `config.yml` - Pipeline and policy configuration
- `data/nlu.yml` - Training examples (but no domain)

**Expected Result**: ❌ Should NOT be detected as a Rasa project

---

### 4. `invalid-project-empty-domain/`

**Purpose**: Test validation of domain structure  
**Structure**: Has required files but domain.yml doesn't contain valid Rasa structure  
**Files**:

- `domain.yml` - Empty/invalid domain (no intents, entities, etc.)
- `config.yml` - Pipeline and policy configuration

**Expected Result**: ❌ Should NOT be detected as a Rasa project (fails validation)

---

## Using These Projects for Testing

### Manual Testing

1. Open VS Code
2. File > Open Folder
3. Navigate to one of the test projects
4. The extension should activate and display the appropriate message
5. Check the "Rasa Pro" output channel for logs

### Automated Testing

Run the integration tests:

```bash
npm test
```

The tests in `src/test/integration/projectDetection.test.ts` will automatically verify:

- Project detection logic
- File pattern matching
- File type categorization
- File watcher initialization

### Expected Behavior

| Project                        | Detection       | Message                  |
| ------------------------------ | --------------- | ------------------------ |
| `basic-rasa-project`           | ✅ Detected     | "Rasa project detected!" |
| `split-domain-project`         | ✅ Detected     | "Rasa project detected!" |
| `invalid-project-no-domain`    | ❌ Not Detected | No message               |
| `invalid-project-empty-domain` | ❌ Not Detected | No message               |

---

## Testing File Watcher

To test the file watcher functionality:

1. Open `basic-rasa-project` in VS Code
2. Open the "Rasa Pro" output channel
3. Perform these actions:
   - **Create**: Add a new file `data/new_nlu.yml`
   - **Modify**: Edit `domain.yml`
   - **Delete**: Remove a file from `data/`
4. Verify events are logged in the output channel

Expected logs:

```
[timestamp] File created: /path/to/data/new_nlu.yml
[timestamp] File changed: /path/to/domain.yml
[timestamp] File deleted: /path/to/data/old_file.yml
```

---

## Adding New Test Projects

To add a new test scenario:

1. Create a new directory: `test-projects/your-test-name/`
2. Add the necessary Rasa files
3. Update this README with the project description
4. Add test cases in `src/test/integration/projectDetection.test.ts`

### Common Test Scenarios to Consider

- ✅ Rasa Pro specific features (e.g., CALM configuration)
- ✅ Different Rasa versions (2.x vs 3.x structure)
- ✅ Large projects with 100+ files
- ✅ Mixed YAML/YML extensions
- ✅ Nested directory structures
- ✅ Projects with custom actions
- ✅ Projects with forms and slot mappings

---

## Cleanup

These test projects are for development only and should not be packaged with the extension release.

To clean up:

```bash
# From the project root
rm -rf test-projects/
```

---

## Notes

- All test projects use Rasa 3.x format (`version: "3.1"`)
- Test projects are excluded from git via `.gitignore` (if configured)
- File watching only works when the extension is active
- Project detection runs once on activation and when workspace changes
