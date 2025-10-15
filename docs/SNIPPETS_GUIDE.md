# Rasa Snippets - Complete Guide

The Rasa Pro VS Code extension includes **40+ intelligent code snippets** to accelerate your Rasa development workflow. These snippets cover YAML configuration files and Python custom actions.

## 🚀 Quick Start

Type a snippet prefix in a YAML or Python file and press `Tab` to expand it. Use `Tab` to jump between placeholders.

## 📋 YAML Snippets

### NLU Intents

#### `rasa-intent` - Basic Intent

```yaml
- intent: intent_name
  examples: |
    - example text
    - another example
    - yet another example
```

#### `rasa-intent-entities` - Intent with Entity Annotations

```yaml
- intent: intent_name
  examples: |
    - I want to book a [table](booking_type) for [4](number) people
    - Reserve a [table](booking_type) for [2](number) guests
    - Book a [room](booking_type) for [tonight](date)
```

### Stories

#### `rasa-story` - Basic Story

```yaml
- story: story_name
  steps:
    - intent: greet
    - action: utter_greet
    - intent: inform
    - action: utter_acknowledge
```

#### `rasa-story-slot` - Story with Slot Conditions

```yaml
- story: story_with_slot
  steps:
    - intent: inform
    - slot_was_set:
        - slot_name: slot_value
    - action: utter_response
```

#### `rasa-story-checkpoint` - Story with Checkpoint

```yaml
- story: story_name
  steps:
    - checkpoint: checkpoint_name
    - intent: intent_name
    - action: action_name
```

### Rules

#### `rasa-rule` - Basic Rule

```yaml
- rule: rule_name
  steps:
    - intent: intent_name
    - action: action_name
```

#### `rasa-rule-condition` - Rule with Conditions

```yaml
- rule: rule_name
  condition:
    - slot_was_set:
        - slot_name: slot_value
  steps:
    - intent: intent_name
    - action: action_name
```

#### `rasa-rule-form-activate` - Activate Form Rule

```yaml
- rule: Activate form_name
  steps:
    - intent: intent_name
    - action: form_name
    - active_loop: form_name
```

#### `rasa-rule-form-submit` - Submit Form Rule

```yaml
- rule: Submit form_name
  condition:
    - active_loop: form_name
  steps:
    - action: form_name
    - active_loop: null
    - slot_was_set:
        - requested_slot: null
    - action: utter_submit
```

### Responses

#### `rasa-response` - Basic Response

```yaml
utter_response_name:
  - text: "Response text here"
```

#### `rasa-response-variations` - Response with Multiple Variations

```yaml
utter_response_name:
  - text: "First variation"
  - text: "Second variation"
  - text: "Third variation"
```

#### `rasa-response-buttons` - Response with Buttons

```yaml
utter_response_name:
  - text: "Choose an option:"
    buttons:
      - title: "Button 1"
        payload: "/intent_1"
      - title: "Button 2"
        payload: "/intent_2"
```

#### `rasa-response-image` - Response with Image

```yaml
utter_response_name:
  - text: "Response text"
    image: "https://example.com/image.png"
```

#### `rasa-response-custom` - Response with Custom Payload

```yaml
utter_response_name:
  - text: "Response text"
    custom:
      key: "value"
```

### Domain Slots

#### `rasa-slot-text` - Text Slot

```yaml
slot_name:
  type: text
  influence_conversation: true
  mappings:
    - type: from_text
```

#### `rasa-slot-categorical` - Categorical Slot

```yaml
slot_name:
  type: categorical
  values:
    - value1
    - value2
    - value3
  influence_conversation: true
  mappings:
    - type: from_entity
```

#### `rasa-slot-bool` - Boolean Slot

```yaml
slot_name:
  type: bool
  influence_conversation: true
  mappings:
    - type: from_intent
```

#### `rasa-slot-float` - Float Slot

```yaml
slot_name:
  type: float
  min_value: 0.0
  max_value: 1.0
  influence_conversation: true
  mappings:
    - type: from_entity
      entity: entity_name
```

#### `rasa-slot-list` - List Slot

```yaml
slot_name:
  type: list
  influence_conversation: true
  mappings:
    - type: from_entity
```

### Forms

#### `rasa-form` - Basic Form

```yaml
form_name:
  required_slots:
    - slot1
    - slot2
```

#### `rasa-form-ignore` - Form with Ignored Intents

```yaml
form_name:
  ignored_intents:
    - chitchat
    - faq
  required_slots:
    - slot1
    - slot2
```

### Entity Features

#### `rasa-entity-synonyms` - Entity Synonyms

```yaml
- synonym: synonym_value
  examples: |
    - variation1
    - variation2
    - variation3
```

#### `rasa-entity-lookup` - Entity Lookup Table

```yaml
- lookup: entity_name
  examples: |
    - value1
    - value2
    - value3
```

#### `rasa-regex` - Regex Pattern

```yaml
- regex: pattern_name
  examples: |
    - \d{3}-\d{3}-\d{4}
```

### Complete Files

#### `rasa-domain` - Complete Domain File

Creates a full domain.yml template with intents, entities, slots, responses, actions, and session config.

#### `rasa-config` - Complete Config File

Creates a full config.yml template with pipeline and policies configured.

---

## 🐍 Python Snippets

### Custom Actions

#### `rasa-imports` - Import Statements

```python
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker, FormValidationAction
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction, AllSlotsReset
import logging

logger = logging.getLogger(__name__)
```

#### `rasa-action` - Basic Custom Action

```python
class ActionName(Action):
    """Action description"""

    def name(self) -> Text:
        return "action_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Your action code here

        return []
```

#### `rasa-action-slot` - Action with Slot

```python
class ActionName(Action):
    """Action description"""

    def name(self) -> Text:
        return "action_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Get slot value
        slot_name = tracker.get_slot("slot_name")

        # Your action code here

        # Set slot
        return [SlotSet("result_slot", value)]
```

#### `rasa-action-utter` - Action with Message

```python
class ActionName(Action):
    """Action description"""

    def name(self) -> Text:
        return "action_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Your action code here

        dispatcher.utter_message(text="Response message")

        return []
```

#### `rasa-action-api` - Action with Async API Call

```python
class ActionName(Action):
    """Action description"""

    def name(self) -> Text:
        return "action_name"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Get slot value
        param = tracker.get_slot("param")

        # Make API call
        url = "https://api.example.com/endpoint"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params={"param": param}) as response:
                if response.status == 200:
                    data = await response.json()
                    # Process data
                    dispatcher.utter_message(text=f"Result: {data}")
                else:
                    dispatcher.utter_message(text="Sorry, I couldn't fetch the data.")

        return []
```

#### `rasa-action-db` - Action with Database

```python
class ActionName(Action):
    """Action description"""

    def name(self) -> Text:
        return "action_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Get slot value
        param = tracker.get_slot("param")

        # Database query
        try:
            # Connect to database
            # connection = db.connect()
            # result = connection.query(param)

            dispatcher.utter_message(text=f"Found: {result}")
        except Exception as e:
            logger.error(f"Database error: {e}")
            dispatcher.utter_message(text="Sorry, something went wrong.")

        return []
```

#### `rasa-action-events` - Action with Multiple Events

```python
class ActionName(Action):
    """Action description"""

    def name(self) -> Text:
        return "action_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Your action code here

        return [
            SlotSet("slot_name", value),
            FollowupAction("action_name")
        ]
```

#### `rasa-action-log` - Action with Logging

```python
class ActionName(Action):
    """Action description"""

    def name(self) -> Text:
        return "action_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        logger.info(f"Running action: {self.name()}")
        logger.debug(f"Tracker state: {tracker.current_state()}")

        # Your action code here

        logger.info("Action completed successfully")

        return []
```

#### `rasa-action-knowledge` - Knowledge Base Action

```python
class ActionName(Action):
    """Knowledge base action description"""

    def name(self) -> Text:
        return "action_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Extract entities
        entities = tracker.latest_message.get("entities", [])

        # Knowledge base query logic

        if entities:
            # Process entities and query knowledge base
            dispatcher.utter_message(text=f"Information about {entities}")
        else:
            dispatcher.utter_message(text="What would you like to know?")

        return []
```

### Form Validation

#### `rasa-form-validation` - Custom Form Validation

```python
class ValidateFormName(FormValidationAction):
    """Form validation description"""

    def name(self) -> Text:
        return "validate_form_name"

    def validate_slot_name(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        """Validate slot_name value."""

        # Validation logic
        if slot_value is valid:
            return {"slot_name": slot_value}
        else:
            dispatcher.utter_message(text="Invalid value, please try again.")
            return {"slot_name": None}
```

### Testing

#### `rasa-test-story` - Test Story

```yaml
- story: test_story_name
  steps:
    - user: |
        user message
      intent: intent_name
    - action: action_name
    - action: utter_response
    - slot_was_set:
        - slot_name: expected_value
```

---

## 💡 Tips & Best Practices

### Using Snippets Effectively

1. **Tab Navigation** - Use `Tab` to move between placeholders
2. **Shift+Tab** - Move back to previous placeholder
3. **Escape** - Exit snippet mode
4. **Multiple Cursors** - Some snippets work with multi-cursor editing

### Common Patterns

**Quick Domain Setup:**

1. Type `rasa-domain` for full domain template
2. Fill in your project's specific values
3. Use individual snippets to add more components

**Fast Action Development:**

1. Start with `rasa-imports` for standard imports
2. Use `rasa-action` for basic structure
3. Expand with `rasa-action-slot`, `rasa-action-api`, etc.

**Efficient Story Writing:**

1. Use `rasa-story` for basic flows
2. Add `rasa-story-slot` for conditional logic
3. Use `rasa-story-checkpoint` for reusable conversation blocks

### Snippet Combinations

**Form Creation Workflow:**

```
1. rasa-form (in domain.yml)
2. rasa-slot-text (for each required slot)
3. rasa-rule-form-activate
4. rasa-rule-form-submit
5. rasa-form-validation (in actions.py)
```

**API Integration Workflow:**

```
1. rasa-action-api (create async action)
2. rasa-slot-* (create slots for API params/results)
3. rasa-story (create conversation flow)
```

---

## 🔧 Customization

### Adding Your Own Snippets

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Configure User Snippets"
3. Select "yaml" or "python"
4. Add your custom snippets following VS Code snippet syntax

### Snippet Variables

Snippets support these special variables:

- `${1:default}` - First tab stop with default value
- `${1|option1,option2|}` - Choice selection
- `$0` - Final cursor position

---

## 📚 Related Resources

- [Rasa Documentation](https://rasa.com/docs/rasa/)
- [Rasa SDK Documentation](https://rasa.com/docs/action-server/)
- [VS Code Snippets Guide](https://code.visualstudio.com/docs/editor/userdefinedsnippets)

---

## 🐛 Troubleshooting

**Snippets Not Appearing:**

- Ensure you're in a `.yml` file for YAML snippets or `.py` file for Python snippets
- Check that IntelliSense is enabled in VS Code settings
- Try reloading the window (`Cmd+R` / `Ctrl+R`)

**Tab Key Not Working:**

- Make sure you're in snippet mode (type prefix first)
- Check for conflicting keybindings in VS Code settings

**Wrong Language Detected:**

- Save file with correct extension (`.yml`, `.yaml`, or `.py`)
- Set language mode manually in bottom-right corner of VS Code

---

**Total Snippets:** 40+ (26 YAML + 14 Python)

For more information, see the [main extension README](../README.md).
