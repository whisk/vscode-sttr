import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { EventEmitter } from 'events';
import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
	let sandbox: sinon.SinonSandbox;

	setup(async () => {
		sandbox = sinon.createSandbox();
		// Ensure extension is active
		const ext = vscode.extensions.getExtension('alex-svetkin.sttr');
		if (ext && !ext.isActive) {
			await ext.activate();
		}
	});

	teardown(() => {
		sandbox.restore();
	});

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('alex-svetkin.sttr'));
	});

	test('Command sttr.transformText should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('sttr.transformText'), 'sttr.transformText command is not registered');
	});

	test('sttr.transformText should transform text when binary is found', async () => {
		// Create a new document to test on
		const document = await vscode.workspace.openTextDocument({
			content: 'hello world',
			language: 'plaintext'
		});
		const editor = await vscode.window.showTextDocument(document);

		// Select all text
		editor.selection = new vscode.Selection(0, 0, 0, 11);

		// Stub QuickPick to return 'upper' command
		const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
		showQuickPickStub.resolves({
			label: 'UPPER CASE',
			command: 'upper'
		} as any);

		// Stub cpUtils.exec to find sttr binary
		const execStub = sandbox.stub(myExtension.cpUtils, 'exec');
		execStub.yields(null, '/bin/sttr');

		// Stub cpUtils.spawn to simulate sttr execution
		const spawnStub = sandbox.stub(myExtension.cpUtils, 'spawn');

		const mockChildProcess = new EventEmitter() as any;
		mockChildProcess.stdout = new EventEmitter();
		mockChildProcess.stderr = new EventEmitter();
		mockChildProcess.stdin = {
			write: sandbox.stub(),
			end: sandbox.stub()
		};
		// Add kill for interface compliance if needed
		mockChildProcess.kill = sandbox.stub();

		spawnStub.returns(mockChildProcess);

		// Execute the command
		// Note: we don't await the command immediately or we might catch it before spawn is called?
		// Actually await is fine as long as setup is done before.
		const commandPromise = vscode.commands.executeCommand('sttr.transformText');

		// Wait a small delay to ensure spawn is called inside the async command execution
		await new Promise(resolve => setTimeout(resolve, 50));

		// Verify spawn was called
		assert.ok(spawnStub.called, 'cpUtils.spawn should be called');

		// Emit success from the child process
		mockChildProcess.stdout.emit('data', 'HELLO WORLD');
		mockChildProcess.emit('close', 0);

		// Wait for command to finish
		await commandPromise;

		// Verify result
		const text = editor.document.getText();
		assert.strictEqual(text, 'HELLO WORLD');
	});

	test('sttr.transformText should show error when binary is not found', async () => {
		// Create a new document
		const document = await vscode.workspace.openTextDocument({ content: 'test' });
		const editor = await vscode.window.showTextDocument(document);
		editor.selection = new vscode.Selection(0, 0, 0, 4);

		// Stub QuickPick
		sandbox.stub(vscode.window, 'showQuickPick').resolves({
			label: 'UPPER CASE',
			command: 'upper'
		} as any);

		// Stub cpUtils.exec to fail finding binary
		sandbox.stub(myExtension.cpUtils, 'exec').yields(new Error('not found'), '');

		// Stub fsUtils.existsSync to always return false (so common paths are also invalid)
		sandbox.stub(myExtension.fsUtils, 'existsSync').returns(false);

		// Stub showErrorMessage to resolve immediately (simulating user closing it)
		// We use callsFake or returns to let us assertions but prevent blocking
		const showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
		showErrorMessageStub.resolves(undefined);

		// Execute
		await vscode.commands.executeCommand('sttr.transformText');

		// Assert error message
		assert.ok(showErrorMessageStub.called, 'showErrorMessage should be called');
		// Check the first argument of the first call
		const errorMsg = showErrorMessageStub.firstCall.args[0] as string;
		assert.match(errorMsg, /STTR binary not found/, 'Error message should match expected');
	});
});
