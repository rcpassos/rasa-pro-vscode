# Completion Provider Testing Guide

This guide explains how to manually test the **RasaCompletionProvider** functionality.

## Prerequisites

1. Open VS Code Extension Development Host (F5)
2. Open the `test-projects/basic-rasa-project` folder as workspace
3. Open any YAML file in the project

## Test Cases

### 1. Intent Completions

**Test in stories.yml:**

1. Open `data/stories.yml`
2. Add a new story step:
   ```yaml
   - story: test completion
     steps:
       - intent: | # Type here and trigger IntelliSense with Ctrl+Space
   ```
3. **Expected:** Should show completions: `greet`, `goodbye`, `mood_great`, `mood_unhappy`, etc.

**Test in domain.yml:**

1. Open `domain.yml`
2. Go to the `intents:` section
3. Add a new line with `- ` (dash + space)
4. **Expected:** Should show all available intents

### 2. Entity Completions

**Test in domain.yml:**

1. Open `domain.yml`
2. Go to the `entities:` section
3. Add a new line with `- `
4. **Expected:** Should show available entities (if any are defined)

**Test in slot mappings:**

1. Open `domain.yml`
2. In a slot configuration, add:
   ```yaml
   slots:
     location:
       type: text
       mappings:
         - type: from_entity
           entity: | # Type here
   ```
3. **Expected:** Should show entity completions

### 3. Slot Completions

**Test in stories with slot_was_set:**

1. Open `data/stories.yml`
2. Add a slot condition:
   ```yaml
   - story: slot test
     steps:
       - slot_was_set:
           - | # Type slot name here
   ```
3. **Expected:** Should show all slot names

**Test in forms (required_slots):**

1. Open `domain.yml`
2. In a form configuration:
   ```yaml
   forms:
     booking_form:
       required_slots:
         - | # Type here
   ```
3. **Expected:** Should show all slot names

### 4. Action Completions

**Test in stories:**

1. Open `data/stories.yml`
2. Add an action step:
   ```yaml
   - story: action test
     steps:
       - action: | # Type here
   ```
3. **Expected:** Should show both custom actions and responses (utter\_\*)

### 5. Response Completions

**Test with utter\_ prefix:**

1. Open `data/stories.yml`
2. Type:
   ```yaml
   - action: utter_| # Start typing "utter_"
   ```
3. **Expected:** Should show only response templates (utter_greet, utter_goodbye, etc.)

### 6. Slot Type Completions

**Test in domain.yml:**

1. Open `domain.yml`
2. Add a new slot:
   ```yaml
   slots:
     my_slot:
       type: | # Type here
   ```
3. **Expected:** Should show: `text`, `bool`, `categorical`, `float`, `list`, `any`
4. **Verify:** Each completion should have detailed documentation

### 7. Slot Mapping Type Completions

**Test in domain.yml:**

1. Open `domain.yml`
2. In a slot's mappings:
   ```yaml
   slots:
     location:
       type: text
       mappings:
         - type: | # Type here
   ```
3. **Expected:** Should show: `from_entity`, `from_text`, `from_intent`, `custom`
4. **Verify:** Each has documentation with examples

### 8. Form Completions

**Test in stories with active_loop:**

1. Open `data/stories.yml`
2. Add a form activation:
   ```yaml
   - story: form test
     steps:
       - active_loop: | # Type here
   ```
3. **Expected:** Should show available form names

### 9. Trigger Characters

**Test automatic triggering:**

1. Type `- intent:` and add a space after the colon
2. **Expected:** Completions should appear automatically (triggered by `:` or space)

### 10. Non-YAML Files

**Verify no interference:**

1. Create or open a `.py` file in the project
2. Type some Python code
3. **Expected:** Should NOT show Rasa completions

## Performance Tests

### Cache Performance

1. Open `data/stories.yml`
2. Type `- intent: ` and trigger completions
3. Note the response time
4. Delete what you typed and type it again
5. **Expected:** Second completion should be as fast or faster (using cache)

### Large File Handling

1. Create a large YAML file with 100+ intents in domain
2. Test completion performance
3. **Expected:** Should respond in <200ms

## Completion Item Details

Verify each completion shows:

- **Label:** The item name
- **Detail:** Type (Intent, Entity, Slot, Action, Response, etc.)
- **Documentation:** Description of what it is
- **Kind:** Appropriate icon (value, field, method, text, etc.)

## Debug Mode

To see detailed logs:

1. Open **View → Output**
2. Select **"Rasa Completion Provider"** from the dropdown
3. Watch logs as you trigger completions
4. Verify:
   - Cache refresh messages
   - Completion context detection
   - Domain file parsing

## Common Issues

### No Completions Showing

- Check that you're in a YAML file
- Ensure the Rasa project was detected (check "Rasa Pro" output channel)
- Try manually triggering with `Ctrl+Space` (or `Cmd+Space` on Mac)
- Verify domain files exist and are valid YAML

### Wrong Completions

- Check the context (intents vs actions vs slots)
- Verify your cursor position
- Look at the output channel logs for context detection

### Slow Completions

- Check file sizes (default max: 1MB)
- Look for YAML parsing errors in output
- Clear cache by reloading the window

## Test Checklist

- [ ] Intent completions in stories work
- [ ] Intent completions in domain work
- [ ] Entity completions in domain work
- [ ] Entity completions in slot mappings work
- [ ] Slot completions in slot_was_set work
- [ ] Slot completions in form required_slots work
- [ ] Action completions in stories work
- [ ] Response completions with utter\_ prefix work
- [ ] Slot type completions show all 6 types
- [ ] Slot mapping type completions show all 4 types
- [ ] Form completions in active_loop work
- [ ] Trigger characters work (`:`, `-`, space)
- [ ] No completions in non-YAML files
- [ ] Cache improves performance
- [ ] Completion details are shown correctly

## Success Criteria

✅ All completion types working correctly
✅ Response time <200ms
✅ Appropriate context detection
✅ No false positives in non-Rasa YAML sections
✅ Detailed documentation shown
✅ Cache functioning properly
