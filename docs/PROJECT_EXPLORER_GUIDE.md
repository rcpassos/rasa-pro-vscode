# Rasa Project Explorer - User Guide

The Rasa Project Explorer is a custom sidebar view that provides a structured, organized overview of all components in your Rasa project. It allows you to quickly navigate between different parts of your domain files.

## Features

### Organized Component View

The Project Explorer organizes your Rasa project into the following categories:

- **Intents** - All user intents defined in your domain
- **Entities** - All entities for information extraction
- **Slots** - All conversation state slots
- **Responses** - All bot response templates (utter\_\*)
- **Actions** - All custom actions (excludes utter\_\* responses)
- **Forms** - All form definitions

### Quick Navigation

- **Click any item** to jump directly to its definition in the YAML file
- Items show the filename they're defined in
- Categories display the count of items they contain

### Visual Indicators

Each component type has its own icon:

- 💬 Intents - comment-discussion icon
- 🔤 Entities - symbol-field icon
- 📦 Slots - symbol-variable icon
- 💭 Responses - comment icon
- 🚀 Actions - rocket icon
- 📋 Forms - list-tree icon

### Slot Type Information

Slots display their type alongside the filename:

- `my_slot` - `text · domain.yml`
- `user_age` - `float · domain.yml`

### Auto-Refresh

The explorer automatically refreshes when domain files are:

- Created
- Modified
- Deleted

You can also manually refresh using the refresh button in the view title bar.

## Usage

### Opening the Explorer

1. Click the **Rasa icon** in the Activity Bar (left sidebar)
2. The "Project Components" view will appear

The explorer only appears when a Rasa project is detected (contains `domain.yml` and `config.yml`).

### Navigating to Definitions

1. Expand a category (e.g., "Intents")
2. Click on any item name
3. VS Code will open the file and jump to that component's definition

### Refreshing the View

Click the **Refresh button** (↻) in the view title bar to manually refresh the component list.

## Supported Project Structures

The Project Explorer works with both:

### Flat Structure

```
project/
├── domain.yml          # All components in one file
├── config.yml
└── data/
```

### Split Domain Structure

```
project/
├── domain/
│   ├── intents.yml     # Intents only
│   ├── entities.yml    # Entities only
│   ├── slots.yml       # Slots only
│   ├── responses.yml   # Responses only
│   ├── actions.yml     # Actions only
│   └── forms.yml       # Forms only
├── config.yml
└── data/
```

## Tips

1. **Alphabetical Sorting** - All items within each category are sorted alphabetically for easy lookup

2. **Response vs Actions** - Response actions (starting with `utter_`) appear in the "Responses" category, not "Actions"

3. **Built-in Actions** - Standard Rasa actions like `action_listen`, `action_restart` are included if defined in your domain

4. **Split Files** - If components are split across multiple files (e.g., `domain/intents.yml` and `domain/slots.yml`), all will be aggregated in the explorer

## Troubleshooting

### Explorer Not Appearing

- Ensure your project contains both `domain.yml` and `config.yml`
- Try reloading the VS Code window (Command Palette → "Reload Window")

### Items Not Updating

- Click the Refresh button in the view title
- Save your domain file to trigger auto-refresh

### Can't Navigate to Definition

- Ensure the domain file hasn't been deleted or moved
- Check that the file is a valid YAML file

## Keyboard Shortcuts

While the explorer is focused:

- `↑/↓` - Navigate between items
- `←/→` - Collapse/expand categories
- `Enter` - Open selected item's definition

## Related Features

The Project Explorer integrates with other Rasa Pro extension features:

- **Hover Provider** - Hover over component names in YAML to see definitions
- **Completion Provider** - Autocomplete suggestions match items in the explorer
- **Diagnostics** - Errors shown in Problems panel for undefined components

---

For more information, see the [main extension README](../README.md).
