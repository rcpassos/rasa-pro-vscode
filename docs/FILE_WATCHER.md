# File Watcher Implementation

## Overview

The Rasa Pro VS Code extension uses VS Code's built-in `createFileSystemWatcher()` API to monitor changes to YAML files in the workspace. This allows the extension to automatically update its internal state when Rasa configuration files are created, modified, or deleted.

## Why VS Code's Built-in Watcher?

We use `vscode.workspace.createFileSystemWatcher()` instead of external libraries like Chokidar because:

1. **Native Integration**: Automatically respects VS Code's file exclude settings
2. **Lighter Weight**: No additional dependencies to bundle
3. **Workspace-Aware**: Only watches files within the workspace
4. **Better Performance**: Optimized for VS Code's file system API
5. **Consistent Behavior**: Works the same across all platforms (Windows, macOS, Linux)

## Implementation Details

### Location

The file watcher is implemented in `src/services/rasaProjectService.ts` in the `setupFileWatcher()` method.

### Watched Pattern

```typescript
vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");
```

This pattern watches all YAML files (both `.yml` and `.yaml` extensions) recursively in the workspace.

### Event Handlers

The watcher registers three event handlers:

#### 1. `onDidChange` - File Modified

```typescript
this.fileWatcher.onDidChange((uri) => {
  this.log(`File changed: ${uri.fsPath}`);
  this.refreshFile(uri);
});
```

**Behavior**: Updates the internal cache when a file is modified.

#### 2. `onDidCreate` - File Created

```typescript
this.fileWatcher.onDidCreate((uri) => {
  this.log(`File created: ${uri.fsPath}`);
  this.addFile(uri);
});
```

**Behavior**:

- Adds the new file to the internal cache
- Re-initializes the service if it wasn't previously detected as a Rasa project (e.g., `domain.yml` was just created)

#### 3. `onDidDelete` - File Deleted

```typescript
this.fileWatcher.onDidDelete((uri) => {
  this.log(`File deleted: ${uri.fsPath}`);
  this.removeFile(uri);
});
```

**Behavior**: Removes the file from the internal cache.

## File Filtering

Not all YAML files are Rasa-related. The `isRasaFile()` method filters files based on these patterns:

```typescript
const rasaPatterns = [
  /^domain\.yml$/, // Root domain file
  /^domain\/.*\.ya?ml$/, // Domain directory files
  /^config\.yml$/, // Configuration
  /^data\/.*\.ya?ml$/, // Training data
  /^nlu\.yml$/, // NLU data
  /^stories\.yml$/, // Stories
  /^rules\.yml$/, // Rules
  /^endpoints\.yml$/, // Endpoints
  /^credentials\.yml$/, // Credentials
  /^tests\/.*\.ya?ml$/, // Test files
];
```

Only files matching these patterns are added to the project cache.

## Resource Management

The file watcher is properly disposed of when:

1. **Service Reinitialization**: If `setupFileWatcher()` is called again, the old watcher is disposed first
2. **Extension Deactivation**: The watcher is registered in `context.subscriptions`, so VS Code automatically disposes it

```typescript
dispose(): void {
  if (this.fileWatcher) {
    this.fileWatcher.dispose();
  }
  this.outputChannel.dispose();
}
```

## Performance Considerations

### Debouncing

Currently, the file watcher does NOT implement debouncing. This means:

- Every file change triggers an immediate update
- For bulk operations (e.g., git checkout), multiple events fire rapidly

**Future Enhancement**: Consider adding a debounce mechanism for high-frequency change events.

### File Size Limits

The extension respects the `rasa-pro-vscode.maxFileSize` configuration (default: 1MB) to avoid parsing extremely large files.

## Logging

All file watcher events are logged to the "Rasa Pro" output channel:

```
[2025-10-14T12:34:56.789Z] File changed: /path/to/domain.yml
[2025-10-14T12:35:01.234Z] File created: /path/to/data/nlu.yml
[2025-10-14T12:35:10.567Z] File deleted: /path/to/old_file.yml
```

To view logs:

1. Open the Output panel (View > Output)
2. Select "Rasa Pro" from the dropdown

## Testing the File Watcher

### Manual Testing

1. Open a Rasa project in VS Code
2. Activate the extension
3. Open the "Rasa Pro" output channel
4. Create, modify, or delete a YAML file
5. Verify that events are logged

### Automated Testing

Basic tests are in `src/test/rasaProjectService.test.ts`. The file watcher is tested indirectly through service initialization and file management tests.

**Limitation**: VS Code's file system watcher is hard to mock in unit tests. Integration tests are recommended.

## Known Limitations

1. **External Changes**: The watcher relies on VS Code's file system API, so it may not detect changes made by external tools while VS Code is closed
2. **Symlinks**: Behavior with symbolic links depends on the underlying file system
3. **Network Drives**: Performance may vary on network-mounted workspaces

## Future Improvements

- [ ] Add debouncing for rapid file changes
- [ ] Implement batch update mechanism for bulk operations
- [ ] Add configuration option to disable file watching
- [ ] Support watching Python action files (`actions/*.py`)
- [ ] Trigger re-validation of domain consistency on file changes

## References

- [VS Code FileSystemWatcher API](https://code.visualstudio.com/api/references/vscode-api#FileSystemWatcher)
- [VS Code Workspace API](https://code.visualstudio.com/api/references/vscode-api#workspace)
- [Glob Pattern Reference](https://code.visualstudio.com/docs/editor/glob-patterns)
