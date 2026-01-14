import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const cpUtils = {
	spawn: cp.spawn,
	exec: cp.exec
};

export const fsUtils = {
	existsSync: fs.existsSync
};

// STTR transformation categories and commands
interface SttrCommand {
	label: string;
	command: string;
	description: string;
}

interface SttrCommandMap {
	[category: string]: SttrCommand[];
}

let currentSttrCommands: SttrCommandMap = {};
const COMMANDS_STORAGE_KEY = 'sttr_commands_v1';

export function activate(context: vscode.ExtensionContext) {
	console.log('STTR extension is now active!');

	// Load commands from storage
	const cachedCommands = context.globalState.get<SttrCommandMap>(COMMANDS_STORAGE_KEY);
	if (cachedCommands) {
		currentSttrCommands = cachedCommands;
	} else {
		// If no cache, try to refresh in background but don't block
		refreshSttrCommands(context).catch(err => console.error('Failed to refresh commands:', err));
	}

	// Register transform text command
	const transformTextCommand = vscode.commands.registerCommand('sttr.transformText', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found.');
			return;
		}

		const selection = editor.selection;
		if (selection.isEmpty) {
			vscode.window.showErrorMessage('Please select text to transform.');
			return;
		}

		const selectedText = editor.document.getText(selection);
		await showTransformationMenu(selectedText, editor, selection);
	});

	// Register show commands command
	const showCommandsCommand = vscode.commands.registerCommand('sttr.showCommands', async () => {
		await showAllCommands();
	});

	// Register refresh commands command
	const refreshCommandsCommand = vscode.commands.registerCommand('sttr.refreshCommands', async () => {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Refreshing STTR commands...',
			cancellable: false
		}, async () => {
			await refreshSttrCommands(context);
		});
	});

	context.subscriptions.push(transformTextCommand, showCommandsCommand, refreshCommandsCommand);
}

async function refreshSttrCommands(context: vscode.ExtensionContext) {
	try {
		const sttrPath = await getSttrBinaryPath();
		if (!sttrPath) {
			return; // Can't refresh if binary not found
		}

		const output = await new Promise<string>((resolve, reject) => {
			cpUtils.exec(`${sttrPath} -h`, (err, stdout) => {
				if (err) {
					reject(err);
				} else {
					resolve(stdout);
				}
			});
		});

		const newCommands = parseSttrHelpOutput(output);
		if (Object.keys(newCommands).length > 0) {
			currentSttrCommands = newCommands;
			await context.globalState.update(COMMANDS_STORAGE_KEY, newCommands);
		}
	} catch (error) {
		console.error('Error refreshing STTR commands:', error);
	}
}

export function parseSttrHelpOutput(output: string): SttrCommandMap {
	const lines = output.split('\n');
	const commands: SttrCommandMap = {};
	let inCommandsSection = false;

	// Helper to find category for a command
	const findCategory = (cmd: string, desc: string): string => {
		// Heuristics for new commands
		const lowerCmd = cmd.toLowerCase();
		const lowerDesc = desc.toLowerCase();

		if (lowerCmd.includes('encode') || lowerCmd.includes('decode')) { return 'Encode/Decode'; }
		if (lowerDesc.includes('hash') || lowerDesc.includes('checksum') || lowerDesc.includes('digest')) { return 'Hash'; }
		if (lowerCmd.includes('case') || lowerCmd.includes('upper') || lowerCmd.includes('lower') || lowerCmd.includes('snake') || lowerCmd.includes('camel') || lowerCmd.includes('slug')) { return 'String Case'; }
		if (lowerCmd.includes('lines')) { return 'Lines'; }
		if (lowerCmd.includes('json') || lowerCmd.includes('yaml') || lowerCmd.includes('xml')) { return 'Format'; }
		if (lowerCmd.includes('extract')) { return 'Extract'; }
		if (lowerCmd.includes('count')) { return 'Count'; }
		if (lowerCmd.includes('color') || lowerCmd.includes('rgb') || lowerCmd.includes('hex')) { return 'Color'; }
		if (lowerCmd.includes('sort') || lowerCmd.includes('unique') || lowerCmd.includes('shuffle') || lowerCmd.includes('reverse')) { return 'Lines'; }

		return 'Other';
	};

	for (const line of lines) {
		if (line.trim().startsWith('Available Commands:')) {
			inCommandsSection = true;
			continue;
		}
		if (line.trim().startsWith('Flags:') || (inCommandsSection && line.trim() === '')) {
			inCommandsSection = false;
			continue;
		}

		if (inCommandsSection) {
			const match = line.match(/^\s+([a-zA-Z0-9.-]+)\s+(.+)$/);
			if (match) {
				const [, cmd, desc] = match;

				// Generate label: "ascii85-encode" -> "Ascii85 Encode"
				const label = cmd
					.split(/[-_]/)
					.map(word => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');

				const category = findCategory(cmd, desc);

				if (!commands[category]) {
					commands[category] = [];
				}

				commands[category].push({
					label,
					command: cmd,
					description: desc.trim()
				});
			}
		}
	}

	return commands;
}

async function showTransformationMenu(selectedText: string, editor: vscode.TextEditor, selection: vscode.Selection) {
	// Check if we have commands
	if (Object.keys(currentSttrCommands).length === 0) {
		const action = await vscode.window.showWarningMessage(
			'No STTR commands loaded. Try refreshing or check installation.',
			'Refresh Commands',
			'Install Instructions'
		);
		if (action === 'Refresh Commands') {
			vscode.commands.executeCommand('sttr.refreshCommands');
		} else if (action === 'Install Instructions') {
			showInstallInstructions();
		}
		return;
	}

	// Create quick pick items from all categories
	const items: vscode.QuickPickItem[] = [];

	for (const [category, commands] of Object.entries(currentSttrCommands)) {
		// Add category separator
		items.push({
			label: `$(folder) ${category}`,
			kind: vscode.QuickPickItemKind.Separator
		});

		// Add commands in this category
		// Sort commands alphabetically within category
		commands.sort((a, b) => a.label.localeCompare(b.label));

		for (const cmd of commands) {
			items.push({
				label: `$(symbol-string) ${cmd.label}`,
				description: cmd.description,
				detail: `sttr ${cmd.command}`,
				// Store the command separately to avoid conflicts
				command: cmd.command
			} as any);
		}
	}

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: 'Select a transformation to apply',
		matchOnDescription: true,
		matchOnDetail: true
	});

	if (selected && (selected as any).command) {
		await executeSttrCommand((selected as any).command, selectedText, editor, selection);
	}
}

async function showAllCommands() {
	if (Object.keys(currentSttrCommands).length === 0) {
		const action = await vscode.window.showWarningMessage(
			'No STTR commands loaded.',
			'Refresh Commands'
		);
		if (action === 'Refresh Commands') {
			vscode.commands.executeCommand('sttr.refreshCommands');
		}
		return;
	}

	const items: string[] = [];

	for (const [category, commands] of Object.entries(currentSttrCommands)) {
		items.push(`\n**${category}:**`);
		for (const cmd of commands) {
			items.push(`• ${cmd.label} (\`sttr ${cmd.command}\`) - ${cmd.description}`);
		}
	}

	const content = `# STTR Available Transformations\n\n${items.join('\n')}`;

	const doc = await vscode.workspace.openTextDocument({
		content,
		language: 'markdown'
	});

	await vscode.window.showTextDocument(doc);
}

async function showInstallInstructions() {
	const platform = process.platform;
	let instructions = '';

	if (platform === 'darwin') {
		instructions = `# Install STTR on macOS

## Homebrew (Recommended)
\`\`\`bash
brew install abhimanyu003/sttr/sttr
\`\`\`

## Quick Install Script
\`\`\`bash
curl -sfL https://raw.githubusercontent.com/abhimanyu003/sttr/main/install.sh | sh
\`\`\`

## Go Install
\`\`\`bash
go install github.com/abhimanyu003/sttr@latest
\`\`\`

After installation, restart VS Code and try the STTR commands again.`;
	} else if (platform === 'linux') {
		instructions = `# Install STTR on Linux

## Quick Install Script
\`\`\`bash
curl -sfL https://raw.githubusercontent.com/abhimanyu003/sttr/main/install.sh | sh
\`\`\`

## Snap
\`\`\`bash
sudo snap install sttr
\`\`\`

## Arch Linux
\`\`\`bash
yay -S sttr-bin
\`\`\`

## Go Install
\`\`\`bash
go install github.com/abhimanyu003/sttr@latest
\`\`\`

After installation, restart VS Code and try the STTR commands again.`;
	} else if (platform === 'win32') {
		instructions = `# Install STTR on Windows

## Winget (Recommended)
\`\`\`cmd
winget install -e --id abhimanyu003.sttr
\`\`\`
*The extension will automatically detect WinGet installations.*

## Scoop
\`\`\`powershell
scoop bucket add sttr https://github.com/abhimanyu003/scoop-bucket.git
scoop install sttr
\`\`\`

## Webi
\`\`\`powershell
curl.exe https://webi.ms/sttr | powershell
\`\`\`

## Go Install
\`\`\`cmd
go install github.com/abhimanyu003/sttr@latest
\`\`\`

After installation, restart VS Code and try the STTR commands again.`;
	} else {
		instructions = `# Install STTR

## Go Install (Universal)
\`\`\`bash
go install github.com/abhimanyu003/sttr@latest
\`\`\`

## Download Binary
Visit: https://github.com/abhimanyu003/sttr/releases/latest

After installation, restart VS Code and try the STTR commands again.`;
	}

	const doc = await vscode.workspace.openTextDocument({
		content: instructions,
		language: 'markdown'
	});

	await vscode.window.showTextDocument(doc);
}

async function executeSttrCommand(command: string, inputText: string, editor: vscode.TextEditor, selection: vscode.Selection) {
	try {
		// Get the sttr binary path
		const sttrPath = await getSttrBinaryPath();

		if (!sttrPath) {
			const action = await vscode.window.showErrorMessage(
				'STTR binary not found. Please install the sttr CLI utility.',
				'Install Instructions',
				'Open GitHub'
			);

			if (action === 'Install Instructions') {
				showInstallInstructions();
			} else if (action === 'Open GitHub') {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/abhimanyu003/sttr'));
			}
			return;
		}

		// Execute sttr command
		const result = await new Promise<string>((resolve, reject) => {
			const process = cpUtils.spawn(sttrPath, [command], {
				stdio: ['pipe', 'pipe', 'pipe']
			});

			let stdout = '';
			let stderr = '';

			process.stdout.on('data', (data) => {
				stdout += data.toString();
			});

			process.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			process.on('close', (code) => {
				if (code === 0) {
					resolve(stdout);
				} else {
					reject(new Error(`sttr command failed (exit code ${code}): ${stderr}`));
				}
			});

			process.on('error', (error) => {
				reject(error);
			});

			// Send input text to sttr
			process.stdin.write(inputText);
			process.stdin.end();
		});

		// Replace selected text with transformed result
		await editor.edit(editBuilder => {
			editBuilder.replace(selection, result.trim());
		});

		vscode.window.showInformationMessage(`Text transformed using: sttr ${command}`);

	} catch (error) {
		vscode.window.showErrorMessage(`Error executing sttr command: ${error}`);
	}
}

async function getSttrBinaryPath(): Promise<string | null> {
	return new Promise((resolve) => {
		// Try different methods to find sttr binary
		const commands = process.platform === 'win32' ? ['where sttr'] : ['which sttr', 'command -v sttr'];

		let tried = 0;

		const tryCommand = (cmd: string) => {
			cpUtils.exec(cmd, (error, stdout) => {
				if (!error && stdout.trim()) {
					resolve(stdout.trim());
					return;
				}

				tried++;
				if (tried < commands.length) {
					tryCommand(commands[tried]);
				} else {
					// Try common installation paths
					let commonPaths: string[] = [];

					if (process.platform === 'win32') {
						const userProfile = process.env.USERPROFILE || process.env.HOME;
						commonPaths = [
							'C:\\Program Files\\sttr\\sttr.exe',
							'C:\\sttr\\sttr.exe'
						];

						// Add WinGet installation paths
						if (userProfile) {
							const wingetPackagesDir = path.join(userProfile, 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');

							// Try the exact path
							commonPaths.push(path.join(wingetPackagesDir, 'abhimanyu003.sttr_Microsoft.Winget.Source_8wekyb3d8bbwe', 'sttr.exe'));
						}
					} else {
						commonPaths = [
							'/usr/local/bin/sttr',
							'/opt/homebrew/bin/sttr',
							'/usr/bin/sttr',
						];
					}

					for (const tryPath of commonPaths) {
						if (fsUtils.existsSync(tryPath)) {
							resolve(tryPath);
							return;
						}
					}

					resolve(null);
				}
			});
		};

		tryCommand(commands[0]);
	});
}

export function deactivate() {}
