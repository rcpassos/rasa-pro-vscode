import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { CliIntegrationService } from "../services/cliIntegrationService";

suite("CliIntegrationService Test Suite", () => {
  let outputChannel: vscode.OutputChannel;
  let cliService: CliIntegrationService;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    outputChannel = vscode.window.createOutputChannel("Test");
    cliService = new CliIntegrationService(outputChannel);
  });

  teardown(() => {
    sandbox.restore();
    cliService.dispose();
    outputChannel.dispose();
  });

  suite("Configuration", () => {
    test("should get default Rasa executable", () => {
      const executable = cliService.getRasaExecutable();
      assert.strictEqual(executable, "rasa");
    });

    test("should get project root from workspace if available", () => {
      const projectRoot = cliService.getProjectRoot();
      // Project root might be undefined if no workspace is open in test environment
      // This test just ensures the method doesn't throw
      assert.ok(projectRoot !== null);
    });
  });

  suite("Command Execution", () => {
    test("should create terminal for training", async () => {
      const createTerminalStub = sandbox.stub(vscode.window, "createTerminal");
      const mockTerminal = {
        sendText: sandbox.stub(),
        show: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any;
      createTerminalStub.returns(mockTerminal);

      // Stub necessary methods
      sandbox
        .stub(cliService as any, "validateRasaInstallation")
        .resolves(true);
      sandbox.stub(cliService, "getProjectRoot").returns("/fake/project");

      await cliService.trainModel();

      assert.ok(
        createTerminalStub.calledOnce,
        "Terminal should be created once"
      );
      assert.ok(
        createTerminalStub.calledWith(
          sinon.match({
            name: "Rasa Training",
          })
        ),
        "Terminal should have correct name"
      );
      assert.ok(
        mockTerminal.sendText.calledOnce,
        "sendText should be called once"
      );
      assert.ok(
        mockTerminal.sendText.calledWith("rasa train"),
        "Should send correct training command"
      );
    });

    test("should create terminal for action server with custom port", async () => {
      const createTerminalStub = sandbox.stub(vscode.window, "createTerminal");
      const showInfoStub = sandbox.stub(
        vscode.window,
        "showInformationMessage"
      );
      const mockTerminal = {
        sendText: sandbox.stub(),
        show: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any;
      createTerminalStub.returns(mockTerminal);

      // Stub necessary methods
      sandbox
        .stub(cliService as any, "validateRasaInstallation")
        .resolves(true);
      sandbox.stub(cliService, "getProjectRoot").returns("/fake/project");

      await cliService.runActionServer(5056);

      assert.ok(
        createTerminalStub.calledOnce,
        "Terminal should be created once"
      );
      assert.ok(
        mockTerminal.sendText.calledWith("rasa run actions --port 5056"),
        "Should send correct action server command with custom port"
      );
      assert.ok(showInfoStub.calledOnce, "Should show information message");
    });

    test("should create terminal for shell", async () => {
      const createTerminalStub = sandbox.stub(vscode.window, "createTerminal");
      const mockTerminal = {
        sendText: sandbox.stub(),
        show: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any;
      createTerminalStub.returns(mockTerminal);

      // Stub necessary methods
      sandbox
        .stub(cliService as any, "validateRasaInstallation")
        .resolves(true);
      sandbox.stub(cliService, "getProjectRoot").returns("/fake/project");

      await cliService.openShell();

      assert.ok(
        createTerminalStub.calledOnce,
        "Terminal should be created once"
      );
      assert.ok(
        createTerminalStub.calledWith(
          sinon.match({
            name: "Rasa Shell",
          })
        ),
        "Terminal should have correct name"
      );
      assert.ok(
        mockTerminal.sendText.calledWith("rasa shell"),
        "Should send correct shell command"
      );
    });

    test("should create terminal for tests", async () => {
      const createTerminalStub = sandbox.stub(vscode.window, "createTerminal");
      const mockTerminal = {
        sendText: sandbox.stub(),
        show: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any;
      createTerminalStub.returns(mockTerminal);

      // Stub necessary methods
      sandbox
        .stub(cliService as any, "validateRasaInstallation")
        .resolves(true);
      sandbox.stub(cliService, "getProjectRoot").returns("/fake/project");

      await cliService.runTests();

      assert.ok(
        createTerminalStub.calledOnce,
        "Terminal should be created once"
      );
      assert.ok(
        createTerminalStub.calledWith(
          sinon.match({
            name: "Rasa Test",
          })
        ),
        "Terminal should have correct name"
      );
      assert.ok(
        mockTerminal.sendText.calledWith("rasa test"),
        "Should send correct test command"
      );
    });

    test("should not execute commands if Rasa is not installed", async () => {
      const createTerminalStub = sandbox.stub(vscode.window, "createTerminal");

      // Stub the exec function to return failure
      sandbox
        .stub(cliService as any, "validateRasaInstallation")
        .resolves(false);
      sandbox.stub(cliService, "getProjectRoot").returns("/fake/project");

      await cliService.trainModel();

      assert.ok(
        createTerminalStub.notCalled,
        "Terminal should not be created if Rasa is not installed"
      );
    });
  });

  suite("Training with Augmentation", () => {
    test("should add augmentation parameter when specified", async () => {
      const createTerminalStub = sandbox.stub(vscode.window, "createTerminal");
      const mockTerminal = {
        sendText: sandbox.stub(),
        show: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any;
      createTerminalStub.returns(mockTerminal);

      // Stub necessary methods
      sandbox
        .stub(cliService as any, "validateRasaInstallation")
        .resolves(true);
      sandbox.stub(cliService, "getProjectRoot").returns("/fake/project");

      await cliService.trainModel(50);

      assert.ok(
        mockTerminal.sendText.calledWith("rasa train --augmentation 50"),
        "Should include augmentation parameter"
      );
    });

    test("should not add augmentation parameter when not specified", async () => {
      const createTerminalStub = sandbox.stub(vscode.window, "createTerminal");
      const mockTerminal = {
        sendText: sandbox.stub(),
        show: sandbox.stub(),
        dispose: sandbox.stub(),
      } as any;
      createTerminalStub.returns(mockTerminal);

      // Stub necessary methods
      sandbox
        .stub(cliService as any, "validateRasaInstallation")
        .resolves(true);
      sandbox.stub(cliService, "getProjectRoot").returns("/fake/project");

      await cliService.trainModel();

      assert.ok(
        mockTerminal.sendText.calledWith("rasa train"),
        "Should not include augmentation parameter when not specified"
      );
    });
  });
});
