import * as assert from "assert";
import * as vscode from "vscode";
import { RasaProjectService } from "../services/rasaProjectService";
import { RasaExplorerProvider, RasaItemType } from "../views/explorerView";

suite("Explorer View Test Suite", () => {
  let rasaProjectService: RasaProjectService;
  let explorerProvider: RasaExplorerProvider;

  setup(async () => {
    rasaProjectService = new RasaProjectService();
    await rasaProjectService.initialize();
    explorerProvider = new RasaExplorerProvider(rasaProjectService);
  });

  teardown(() => {
    rasaProjectService.dispose();
  });

  test("Should create explorer provider", () => {
    assert.ok(explorerProvider, "Explorer provider should be created");
  });

  test("Should handle non-Rasa project gracefully", async () => {
    const rootItems = await explorerProvider.getChildren();
    // Should return empty array for non-Rasa project or categories if it is a Rasa project
    assert.ok(Array.isArray(rootItems), "Should return an array");
  });

  test("Should return getTreeItem with proper structure", async () => {
    const rootItems = await explorerProvider.getChildren();

    if (rootItems.length > 0) {
      const firstItem = rootItems[0];
      if (firstItem) {
        const treeItem = explorerProvider.getTreeItem(firstItem);

        assert.ok(treeItem.label, "Tree item should have a label");
        assert.ok(treeItem.iconPath, "Tree item should have an icon");
      }
    }
  });

  test("Should provide root categories for Rasa project", async () => {
    if (rasaProjectService.isRasaProject()) {
      const rootItems = await explorerProvider.getChildren();

      assert.ok(rootItems.length > 0, "Should have root categories");

      // Check that categories are properly structured
      rootItems.forEach((category) => {
        assert.ok(category.label, "Category should have a label");
        assert.strictEqual(
          category.itemType,
          RasaItemType.Category,
          "Root items should be categories"
        );
        assert.ok(
          category.iconPath instanceof vscode.ThemeIcon,
          "Category should have a ThemeIcon"
        );
      });
    }
  });

  test("Should refresh data when refresh() is called", () => {
    assert.doesNotThrow(() => {
      explorerProvider.refresh();
    }, "Refresh should not throw errors");
  });

  test("Should list children for categories", async () => {
    if (rasaProjectService.isRasaProject()) {
      const rootItems = await explorerProvider.getChildren();

      if (rootItems.length > 0) {
        const firstCategory = rootItems[0];
        const children = await explorerProvider.getChildren(firstCategory);

        // Children should be an array (can be empty)
        assert.ok(Array.isArray(children), "Children should be an array");

        // If there are children, verify they have proper structure
        children.forEach((child) => {
          assert.ok(child.label, "Child should have a label");
          assert.notStrictEqual(
            child.itemType,
            RasaItemType.Category,
            "Child should not be a category"
          );
        });
      }
    }
  });

  test("Should return empty children for non-category items", async () => {
    if (rasaProjectService.isRasaProject()) {
      const rootItems = await explorerProvider.getChildren();

      for (const category of rootItems) {
        const items = await explorerProvider.getChildren(category);

        if (items.length > 0) {
          const firstItem = items[0];
          const children = await explorerProvider.getChildren(firstItem);

          assert.strictEqual(
            children.length,
            0,
            "Non-category items should have no children"
          );
          break;
        }
      }
    }
  });

  test("Should create tree items with navigation commands", async () => {
    if (rasaProjectService.isRasaProject()) {
      const rootItems = await explorerProvider.getChildren();

      for (const category of rootItems) {
        const items = await explorerProvider.getChildren(category);

        items.forEach((item) => {
          if (item.resourceUri) {
            assert.ok(
              item.command,
              "Item with resourceUri should have a command"
            );
            assert.strictEqual(
              item.command.command,
              "vscode.open",
              "Command should be vscode.open"
            );
          }
        });

        if (items.length > 0) {
          break;
        }
      }
    }
  });
});
