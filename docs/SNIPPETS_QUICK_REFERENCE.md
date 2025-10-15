# Rasa Snippets - Quick Reference Card

## 🎯 Most Used Snippets

### YAML - Top 10

| Prefix                    | Description           | Use Case                      |
| ------------------------- | --------------------- | ----------------------------- |
| `rasa-intent`             | Basic intent          | Creating NLU training data    |
| `rasa-story`              | Basic story           | Defining conversation flows   |
| `rasa-rule`               | Basic rule            | Adding deterministic behavior |
| `rasa-response`           | Response template     | Bot responses                 |
| `rasa-response-buttons`   | Response with buttons | User choices                  |
| `rasa-slot-text`          | Text slot             | Storing user info             |
| `rasa-form`               | Form definition       | Multi-step data collection    |
| `rasa-rule-form-activate` | Activate form         | Starting a form               |
| `rasa-rule-form-submit`   | Submit form           | Completing a form             |
| `rasa-domain`             | Complete domain       | New project setup             |

### Python - Top 5

| Prefix                 | Description       | Use Case            |
| ---------------------- | ----------------- | ------------------- |
| `rasa-imports`         | Import statements | Starting actions.py |
| `rasa-action`          | Basic action      | Custom logic        |
| `rasa-action-slot`     | Action with slots | Stateful actions    |
| `rasa-action-api`      | API integration   | External services   |
| `rasa-form-validation` | Form validator    | Input validation    |

## 📋 Complete List by Category

### 🗣️ NLU (2)

- `rasa-intent` - Basic intent
- `rasa-intent-entities` - Intent with entities

### 📖 Stories (3)

- `rasa-story` - Basic story
- `rasa-story-slot` - Story with slots
- `rasa-story-checkpoint` - Story with checkpoints

### 📏 Rules (5)

- `rasa-rule` - Basic rule
- `rasa-rule-condition` - Rule with conditions
- `rasa-rule-form-activate` - Activate form
- `rasa-rule-form-submit` - Submit form

### 💬 Responses (5)

- `rasa-response` - Basic response
- `rasa-response-variations` - Multiple variations
- `rasa-response-buttons` - With buttons
- `rasa-response-image` - With image
- `rasa-response-custom` - Custom payload

### 📦 Slots (5)

- `rasa-slot-text` - Text slot
- `rasa-slot-categorical` - Categorical slot
- `rasa-slot-bool` - Boolean slot
- `rasa-slot-float` - Float slot
- `rasa-slot-list` - List slot

### 📝 Forms (2)

- `rasa-form` - Basic form
- `rasa-form-ignore` - Form with ignored intents

### 🏷️ Entities (3)

- `rasa-entity-synonyms` - Synonyms
- `rasa-entity-lookup` - Lookup table
- `rasa-regex` - Regex pattern

### 📄 Templates (2)

- `rasa-domain` - Complete domain.yml
- `rasa-config` - Complete config.yml

### 🐍 Actions (10)

- `rasa-imports` - Import statements
- `rasa-action` - Basic action
- `rasa-action-slot` - With slots
- `rasa-action-utter` - With utterance
- `rasa-action-api` - API call
- `rasa-action-db` - Database query
- `rasa-action-events` - Multiple events
- `rasa-action-log` - With logging
- `rasa-action-knowledge` - Knowledge base

### ✅ Validation (1)

- `rasa-form-validation` - Form validator

### 🧪 Testing (1)

- `rasa-test-story` - Test story

## 🎨 Workflow Templates

### New Project Setup

```
1. rasa-domain        → domain.yml
2. rasa-config        → config.yml
3. rasa-intent        → data/nlu.yml (repeat)
4. rasa-story         → data/stories.yml (repeat)
```

### Adding a Form

```
1. rasa-form                 → domain/forms.yml
2. rasa-slot-*               → domain/slots.yml (for each slot)
3. rasa-rule-form-activate   → data/rules.yml
4. rasa-rule-form-submit     → data/rules.yml
5. rasa-form-validation      → actions/actions.py
```

### API Integration

```
1. rasa-imports       → actions/actions.py (top of file)
2. rasa-action-api    → actions/actions.py
3. rasa-slot-*        → domain/slots.yml (for result)
4. rasa-story         → data/stories.yml (conversation)
```

### Custom Action

```
1. rasa-imports       → actions/actions.py (if new file)
2. rasa-action-slot   → actions/actions.py
3. rasa-response      → domain/responses.yml
4. rasa-story         → data/stories.yml
```

## ⌨️ Keyboard Tips

- **Trigger**: Type prefix + `Tab`
- **Next Field**: `Tab`
- **Previous Field**: `Shift+Tab`
- **Exit Snippet**: `Esc`
- **Accept Suggestion**: `Enter` or `Tab`

## 🔍 Discovery

**In VS Code:**

1. Start typing `rasa-`
2. IntelliSense shows all available snippets
3. Hover over snippet for preview

**Or use:**

- Command Palette → "Insert Snippet"
- Then search for "rasa"

## 📏 Naming Convention

All snippets follow this pattern:

```
rasa-{category}[-{variant}]

Examples:
- rasa-slot-text
- rasa-action-api
- rasa-rule-form-activate
```

## 💾 Quick Save

After using snippets, save common combinations as custom snippets:

1. Open Command Palette
2. "Configure User Snippets"
3. Select language (yaml/python)
4. Add your own based on project patterns

---

**Print this page** or keep it handy while developing! 🚀

**Total Snippets**: 40+ (26 YAML + 14 Python)
