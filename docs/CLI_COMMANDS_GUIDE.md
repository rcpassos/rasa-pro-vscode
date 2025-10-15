# Quick Start: Using Rasa CLI Commands in VS Code

## 🚀 Available Commands

Once you have the Rasa Pro extension installed and a Rasa project open, you can access these commands directly from VS Code.

## 📋 How to Access Commands

### Method 1: Command Palette (Recommended)

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Rasa:"
3. Select the command you want to run

### Method 2: Quick Access

All commands are available in the Command Palette under the "Rasa" category.

---

## 🎯 Command Reference

### 1. Train Model

**Command**: `Rasa: Train Model`

**What it does**:

- Trains your Rasa NLU and dialogue models
- Creates a new model in the `models/` directory
- Shows progress in the terminal

**Usage**:

1. Open Command Palette
2. Select "Rasa: Train Model"
3. Watch the training progress in the terminal

**Terminal Output**:

```bash
🚀 Starting: rasa train
📁 Project: /path/to/your/project
────────────────────────────────────────────────────────────
# Rasa training output follows...
```

---

### 2. Run Action Server

**Command**: `Rasa: Run Action Server`

**What it does**:

- Starts the Rasa action server
- Allows custom Python actions to be executed
- Default port: 5055 (customizable)

**Usage**:

1. Open Command Palette
2. Select "Rasa: Run Action Server"
3. Enter port number (or press Enter for default 5055)
4. Server starts in a new terminal

**Terminal Output**:

```bash
🎬 Starting: rasa run actions --port 5055
📁 Project: /path/to/your/project
────────────────────────────────────────────────────────────
# Action server logs follow...
```

**Note**: The action server will continue running in the background. Close the terminal to stop it.

---

### 3. Interactive Shell

**Command**: `Rasa: Interactive Shell`

**What it does**:

- Opens an interactive conversation interface
- Test your bot directly in VS Code
- Great for quick testing during development

**Usage**:

1. Open Command Palette
2. Select "Rasa: Interactive Shell"
3. Start chatting with your bot in the terminal

**Terminal Output**:

```bash
💬 Starting: rasa shell
📁 Project: /path/to/your/project
────────────────────────────────────────────────────────────
Your input ➤  hello
# Bot response follows...
```

**Tips**:

- Type `/stop` to exit the shell
- Use this to quickly test intent recognition and responses

---

### 4. Run Tests

**Command**: `Rasa: Run Tests`

**What it does**:

- Executes all your Rasa test stories
- Validates conversation flows
- Checks NLU model accuracy

**Usage**:

1. Open Command Palette
2. Select "Rasa: Run Tests"
3. View test results in the terminal

**Terminal Output**:

```bash
🧪 Starting: rasa test
📁 Project: /path/to/your/project
────────────────────────────────────────────────────────────
# Test results follow...
```

---

## ⚙️ Configuration

### Custom Rasa Executable Path

If Rasa is not in your PATH or you're using a virtual environment:

1. Open VS Code Settings (Cmd+, or Ctrl+,)
2. Search for "Rasa Executable"
3. Set custom path:

```json
{
  "rasa-pro-vscode.rasaExecutable": "/path/to/venv/bin/rasa"
}
```

### Custom Project Root

If your Rasa project is in a subdirectory:

```json
{
  "rasa-pro-vscode.projectRoot": "${workspaceFolder}/my-rasa-project"
}
```

---

## 🔍 Status Bar Indicators

While commands are running, you'll see status indicators in the bottom-left status bar:

- 🔄 `Training Rasa model...` - Model training in progress
- 🧪 `Running Rasa tests...` - Tests executing

---

## ⚠️ Prerequisites

Before using these commands, ensure:

1. ✅ Rasa is installed: `pip install rasa`
2. ✅ A valid Rasa project is open in VS Code
3. ✅ Required files exist: `domain.yml`, `config.yml`

### Check Rasa Installation

Run in your terminal:

```bash
rasa --version
```

If you see an error, install Rasa:

```bash
pip install rasa
```

---

## 🐛 Troubleshooting

### "Rasa is not installed"

**Solution**: Install Rasa or configure the executable path in settings.

```bash
pip install rasa
```

### "No workspace folder found"

**Solution**: Open your Rasa project folder in VS Code:

- File → Open Folder → Select your Rasa project

### Commands not appearing

**Solution**: Ensure you have a valid Rasa project open:

- Check that `domain.yml` and `config.yml` exist
- Reload VS Code: Cmd+Shift+P → "Developer: Reload Window"

---

## 💡 Pro Tips

1. **Use Terminals for Long Operations**: Training and testing open in terminals so you can continue working while they run.

2. **Monitor Output**: The "Rasa" output channel shows detailed logs for all operations.

3. **Quick Iteration**: Use the Interactive Shell for rapid testing without restarting your bot.

4. **Test Before Deploy**: Always run `Rasa: Run Tests` before deploying your model.

5. **Keyboard Shortcuts**: Consider creating custom keyboard shortcuts for frequently used commands:
   - Open Keyboard Shortcuts: Cmd+K Cmd+S (Mac) or Ctrl+K Ctrl+S (Windows/Linux)
   - Search for "Rasa: Train Model"
   - Add your preferred shortcut

---

## 📺 Quick Demo

**Typical Workflow**:

1. Make changes to your Rasa files
2. Run `Rasa: Train Model` (Cmd+Shift+P)
3. Test with `Rasa: Interactive Shell`
4. Run `Rasa: Run Tests` to validate
5. Deploy with confidence!

---

## 🆘 Need Help?

- [Rasa Documentation](https://rasa.com/docs/rasa/)
- [Rasa Community Forum](https://forum.rasa.com/)
- [Extension Issues](https://github.com/rcpassos/rasa-pro-vscode/issues)

---

**Happy Building! 🚀**
