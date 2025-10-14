# Quick Start: Testing Project Detection

## 🚀 5-Minute Test

Want to quickly verify the extension works? Follow these steps:

### 1. Compile the Extension

```bash
npm run compile
```

### 2. Launch Extension Development Host

In VS Code:

- Press `F5` (or Run > Start Debugging)
- A new VS Code window will open with your extension loaded

### 3. Open a Test Project

In the new window:

- File > Open Folder
- Navigate to: `test-projects/basic-rasa-project/`
- Click "Open"

### 4. Verify Detection

You should see:

- ✅ Information message: "Rasa project detected!"
- ✅ No errors in the Debug Console

### 5. Check the Output

- View > Output
- Select "Rasa Pro" from the dropdown
- You should see:

```
[timestamp] Initializing Rasa Project Service...
[timestamp] Workspace root: /path/to/basic-rasa-project
[timestamp] ✓ Found required file: domain.yml
[timestamp] ✓ Found required file: config.yml
[timestamp] ✓ Rasa project detected!
[timestamp] Scanning project files...
[timestamp] Found 5 Rasa files
[timestamp] File watcher set up successfully
```

### 6. Test File Watcher

- Open `domain.yml` in the editor
- Make a small change (add a space or newline)
- Save the file (`Cmd+S` / `Ctrl+S`)
- Check the "Rasa Pro" output - you should see:

```
[timestamp] File changed: /path/to/domain.yml
[timestamp] Refreshed file: domain.yml
```

### 7. Run the Test Command

- Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Win/Linux)
- Type: "Rasa Pro: Hello World"
- Click it
- You should see: "Rasa Pro extension active! Found 5 Rasa files."

---

## ✅ Success!

If all steps worked, your project detection is functioning correctly!

---

## 🧪 Run More Tests

### Try Other Projects

**Valid Split Domain:**

```
File > Open Folder > test-projects/split-domain-project/
```

Expected: "Rasa project detected!"

**Invalid (No Domain):**

```
File > Open Folder > test-projects/invalid-project-no-domain/
```

Expected: No detection message, console shows "No Rasa project detected"

**Invalid (Empty Domain):**

```
File > Open Folder > test-projects/invalid-project-empty-domain/
```

Expected: No detection message, console shows "Invalid domain structure"

---

## 🧪 Run Automated Tests

```bash
npm test
```

This runs all integration tests automatically.

---

## 📚 Need More Details?

- **Manual Testing**: See `docs/MANUAL_TESTING.md`
- **Test Projects**: See `test-projects/README.md`

---

## 🐛 Troubleshooting

### Extension doesn't activate

- Make sure you compiled first: `npm run compile`
- Check for errors in the Debug Console
- Verify you pressed F5 to launch Extension Development Host

### Can't see output logs

- Make sure "Rasa Pro" is selected in the Output dropdown
- Try View > Output if the panel isn't visible

### File watcher not working

- Make sure you're in a detected Rasa project
- Check that you're editing YAML files in recognized locations
- Verify changes are being saved

---

## ✨ What's Next?

Now that project detection is working, the extension can:

- ✅ Detect valid Rasa projects
- ✅ Scan and cache Rasa files
- ✅ Watch for file changes in real-time
- ✅ Filter Rasa-specific files from general YAML

**Ready for Phase 2**: IntelliSense providers! 🎯
