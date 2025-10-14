# Hover Provider Testing Guide

## Overview

The Hover Provider provides intelligent hover information for Rasa YAML files. When users hover over Rasa elements (intents, entities, slots, actions, responses, and forms), they see:

- Element type identification
- Definition location with clickable links
- Related information (e.g., slot types, response variations)
- Usage examples

## Features Implemented

### 1. Intent Hover

**Shows:**

- Intent name
- Link to definition in domain file
- Example utterances from NLU files (up to 3)

**Test locations:**

- `data/stories.yml` - Hover over `intent: greet`
- `data/rules.yml` - Hover over any intent reference

### 2. Entity Hover

**Shows:**

- Entity name
- Link to definition in domain file
- List of slots that use this entity

**Test locations:**

- `domain.yml` - Hover over entities in the `entities:` section
- `data/nlu.yml` - Hover over entity names in slot mappings

### 3. Slot Hover

**Shows:**

- Slot name
- Link to definition in domain file
- Slot type (text, bool, categorical, etc.)
- Whether it influences conversation
- Slot mappings (type, entity, etc.)

**Test locations:**

- `domain.yml` - Hover over slot names in the `slots:` section
- `data/stories.yml` - Hover over `slot_was_set` references
- Forms - Hover over `requested_slot` references

### 4. Action Hover

**Shows:**

- Action name
- Action type (custom, response, or built-in)
- Link to domain definition
- For custom actions: Link to Python implementation in `actions.py`

**Test locations:**

- `domain.yml` - Hover over actions in the `actions:` section
- `data/stories.yml` - Hover over `action:` references
- Custom actions like `action_check_weather`

### 5. Response Hover

**Shows:**

- Response name
- Link to definition in domain file
- Number of response variations
- Preview of up to 3 response texts
- Indication of buttons, images, or other attachments

**Test locations:**

- `domain.yml` - Hover over response names like `utter_greet:`
- `data/stories.yml` - Hover over response actions

### 6. Form Hover

**Shows:**

- Form name
- Link to definition in domain file
- List of required slots
- Information about form purpose

**Test locations:**

- `domain.yml` - Hover over form names in the `forms:` section
- `data/stories.yml` - Hover over `active_loop:` references

## Manual Testing Steps

### Setup

1. Open the extension in VS Code
2. Press F5 to launch the Extension Development Host
3. Open a Rasa project (use `test-projects/basic-rasa-project` for testing)

### Test Scenarios

#### Scenario 1: Intent Hover

1. Open `test-projects/basic-rasa-project/data/stories.yml`
2. Hover over the word `greet` in `- intent: greet`
3. **Expected**: See hover popup with:
   - "**Intent**: `greet`"
   - Link to definition
   - Example utterances from NLU file

#### Scenario 2: Response Hover

1. Open `test-projects/basic-rasa-project/domain.yml`
2. Hover over `utter_greet` in the responses section
3. **Expected**: See hover popup with:
   - "**Response**: `utter_greet`"
   - Number of response variations
   - Preview of response texts

#### Scenario 3: Slot Hover

1. Open `test-projects/basic-rasa-project/domain.yml`
2. Hover over `name` in the slots section
3. **Expected**: See hover popup with:
   - "**Slot**: `name`"
   - Type: `text`
   - Influences conversation: ✗
   - Mappings information

#### Scenario 4: Action Hover

1. Open `test-projects/basic-rasa-project/data/stories.yml`
2. Hover over `utter_greet` in an action line
3. **Expected**: See hover popup with:
   - "**Action**: `utter_greet`"
   - Type: Response action
   - Link to domain definition

#### Scenario 5: Entity Hover

1. Open `test-projects/basic-rasa-project/domain.yml`
2. Hover over `location` in the entities section
3. **Expected**: See hover popup with:
   - "**Entity**: `location`"
   - Link to definition
   - "Used in slots: `location`"

#### Scenario 6: Form Hover

1. Open `test-projects/basic-rasa-project/domain.yml`
2. If a form exists, hover over the form name
3. **Expected**: See hover popup with:
   - "**Form**: `<form_name>`"
   - Link to definition
   - List of required slots

#### Scenario 7: Navigation Links

1. Hover over any Rasa element
2. Click on the "Go to definition" link in the hover popup
3. **Expected**: File should open and cursor should jump to the definition

#### Scenario 8: Cross-File References

1. Open `test-projects/split-domain-project/data/stories.yml`
2. Hover over an intent or action
3. **Expected**: Hover should work even when domain is split across multiple files
4. **Expected**: "Go to definition" link should navigate to the correct file

#### Scenario 9: Non-YAML Files

1. Open a Python file or text file
2. Hover over any text
3. **Expected**: Rasa hover provider should NOT activate

#### Scenario 10: Undefined Elements

1. Open a YAML file
2. Hover over a comment line or undefined word
3. **Expected**: No hover popup or generic VS Code hover

## Performance Testing

### Cache Validation

The hover provider uses a 5-second cache to improve performance.

**Test:**

1. Hover over an intent in a stories file
2. Immediately hover over another intent
3. **Expected**: Second hover should be faster (cache hit)
4. Wait 6 seconds
5. Hover again
6. **Expected**: Cache should refresh

### Large Files

**Test:**

1. Create a domain file with 1000+ intents
2. Hover over various intents
3. **Expected**: Hover should appear within 200ms

## Edge Cases

### 1. Empty Domain File

1. Create a domain file with only `version: "3.1"`
2. Hover over any element
3. **Expected**: No crashes, graceful handling

### 2. Malformed YAML

1. Create a domain file with syntax errors
2. Hover over elements
3. **Expected**: Provider should handle errors gracefully

### 3. Missing NLU Files

1. Delete NLU files
2. Hover over intents in stories
3. **Expected**: Hover shows intent info but no examples

### 4. Custom Actions Without Python Implementation

1. Add a custom action to domain without creating it in `actions.py`
2. Hover over the action
3. **Expected**: Hover shows warning: "Implementation not found in actions.py"

## Automated Tests

Run the test suite:

```bash
npm test
```

Tests included:

- ✅ Intent hover in stories file
- ✅ Action hover in stories file
- ✅ Response hover in domain file
- ✅ Slot hover in domain file
- ✅ Entity hover in domain file
- ✅ Form hover (if available)
- ✅ Non-YAML files (should not activate)
- ✅ Undefined elements (graceful handling)

## Known Limitations

1. **Python Action Detection**: Only finds actions if they follow standard naming conventions (class name matches action name in PascalCase)
2. **Cache Duration**: Fixed at 5 seconds; cannot be configured
3. **NLU Examples**: Shows maximum of 3 examples in hover popup
4. **Multi-workspace**: Currently only supports first workspace folder

## Future Enhancements

- [ ] Add configuration for cache duration
- [ ] Show more metadata (e.g., intent/entity roles)
- [ ] Add snippet preview for stories/rules that use the element
- [ ] Support for Rasa Pro specific features
- [ ] Hover for checkpoints in stories
- [ ] Hover for OR conditions in stories

## Troubleshooting

### Hover Not Appearing

**Check:**

1. Is the file a YAML file?
2. Is the Rasa project detected? (Check status bar)
3. Are there errors in the Problems panel?
4. Check "Rasa Hover Provider" output channel for logs

### Navigation Links Not Working

**Check:**

1. Does the target file exist?
2. Is the file in the workspace?
3. Try manually opening the file first

### Slow Performance

**Check:**

1. File size (check `maxFileSize` configuration)
2. Number of domain files (split domains may be slower)
3. Check "Rasa Hover Provider" output channel for performance logs

## Configuration

Currently, the hover provider respects the following VS Code settings:

```json
{
  "rasa-pro-vscode.maxFileSize": 1048576 // Max file size in bytes (default: 1MB)
}
```

## Debugging

Enable detailed logging:

1. Open Command Palette (Cmd+Shift+P)
2. Run "Developer: Show Output"
3. Select "Rasa Hover Provider" from the dropdown
4. Hover over elements and watch the logs

Example log output:

```
[2025-10-14T10:30:45.123Z] Hover requested for word: "greet" at line 5
[2025-10-14T10:30:45.125Z] Found intent definition at domain.yml:12
```
