import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';

// STTR transformation categories and commands
const STTR_COMMANDS = {
	'Encode/Decode': [
		{ label: 'ASCII85 Encode', command: 'ascii85-encode', description: 'Encode text to ASCII85' },
		{ label: 'ASCII85 Decode', command: 'ascii85-decode', description: 'Decode ASCII85 text' },
		{ label: 'Base32 Encode', command: 'base32-encode', description: 'Encode text to Base32' },
		{ label: 'Base32 Decode', command: 'base32-decode', description: 'Decode Base32 text' },
		{ label: 'Base64 Encode', command: 'base64-encode', description: 'Encode text to Base64' },
		{ label: 'Base64 Decode', command: 'base64-decode', description: 'Decode Base64 text' },
		{ label: 'Base85 Encode', command: 'base85-encode', description: 'Encode text to Base85' },
		{ label: 'Base85 Decode', command: 'base85-decode', description: 'Decode Base85 text' },
		{ label: 'Base64 URL Encode', command: 'base64url-encode', description: 'Encode text to Base64 URL' },
		{ label: 'Base64 URL Decode', command: 'base64url-decode', description: 'Decode Base64 URL text' },
		{ label: 'HTML Encode', command: 'html-encode', description: 'Escape HTML entities' },
		{ label: 'HTML Decode', command: 'html-decode', description: 'Unescape HTML entities' },
		{ label: 'URL Encode', command: 'url-encode', description: 'Encode URL entities' },
		{ label: 'URL Decode', command: 'url-decode', description: 'Decode URL entities' },
		{ label: 'ROT13 Encode', command: 'rot13-encode', description: 'Encode text to ROT13' },
		{ label: 'Morse Encode', command: 'morse-encode', description: 'Encode text to Morse code' },
		{ label: 'Morse Decode', command: 'morse-decode', description: 'Decode Morse code' },
		{ label: 'Hex Encode', command: 'hex-encode', description: 'Encode text to Hex' },
		{ label: 'Hex Decode', command: 'hex-decode', description: 'Decode Hex to text' }
	],
	'Hash': [
		{ label: 'MD5', command: 'md5', description: 'Generate MD5 hash' },
		{ label: 'SHA1', command: 'sha1', description: 'Generate SHA1 hash' },
		{ label: 'SHA256', command: 'sha256', description: 'Generate SHA256 hash' },
		{ label: 'SHA512', command: 'sha512', description: 'Generate SHA512 hash' },
		{ label: 'BCrypt', command: 'bcrypt', description: 'Generate BCrypt hash' },
		{ label: 'XXH64', command: 'xxh64', description: 'Generate XXH64 hash' }
	],
	'String Case': [
		{ label: 'camelCase', command: 'camel', description: 'Transform to camelCase' },
		{ label: 'PascalCase', command: 'pascal', description: 'Transform to PascalCase' },
		{ label: 'kebab-case', command: 'kebab', description: 'Transform to kebab-case' },
		{ label: 'snake_case', command: 'snake', description: 'Transform to snake_case' },
		{ label: 'slug-case', command: 'slug', description: 'Transform to slug-case' },
		{ label: 'UPPER CASE', command: 'upper', description: 'Transform to UPPER CASE' },
		{ label: 'lower case', command: 'lower', description: 'Transform to lower case' },
		{ label: 'Title Case', command: 'title', description: 'Transform to Title Case' },
		{ label: 'Reverse Text', command: 'reverse', description: 'Reverse text' }
	],
	'Lines': [
		{ label: 'Count Lines', command: 'count-lines', description: 'Count number of lines' },
		{ label: 'Reverse Lines', command: 'reverse-lines', description: 'Reverse line order' },
		{ label: 'Shuffle Lines', command: 'shuffle-lines', description: 'Shuffle lines randomly' },
		{ label: 'Sort Lines', command: 'sort-lines', description: 'Sort lines alphabetically' },
		{ label: 'Unique Lines', command: 'unique-lines', description: 'Get unique lines' },
		{ label: 'Number Lines', command: 'number-lines', description: 'Add line numbers' }
	],
	'Format': [
		{ label: 'Format JSON', command: 'json', description: 'Format text as JSON' },
		{ label: 'JSON to YAML', command: 'json-yaml', description: 'Convert JSON to YAML' },
		{ label: 'YAML to JSON', command: 'yaml-json', description: 'Convert YAML to JSON' },
		{ label: 'JSON Escape', command: 'json-escape', description: 'Escape JSON string' },
		{ label: 'JSON Unescape', command: 'json-unescape', description: 'Unescape JSON string' },
		{ label: 'Markdown to HTML', command: 'markdown-html', description: 'Convert Markdown to HTML' }
	],
	'Extract': [
		{ label: 'Extract Emails', command: 'extract-emails', description: 'Extract email addresses' },
		{ label: 'Extract URLs', command: 'extract-urls', description: 'Extract URLs' },
		{ label: 'Extract IPs', command: 'extract-ip', description: 'Extract IP addresses' }
	],
	'Count': [
		{ label: 'Count Characters', command: 'count-chars', description: 'Count characters' },
		{ label: 'Count Words', command: 'count-words', description: 'Count words' },
		{ label: 'Count Lines', command: 'count-lines', description: 'Count lines' }
	],
	'Color': [
		{ label: 'Hex to RGB', command: 'hex-rgb', description: 'Convert hex color to RGB' }
	],
	'Other': [
		{ label: 'Remove Spaces', command: 'remove-spaces', description: 'Remove all spaces and newlines' },
		{ label: 'Remove Newlines', command: 'remove-newlines', description: 'Remove all newlines' },
		{ label: 'Escape Quotes', command: 'escape-quotes', description: 'Escape single and double quotes' },
		{ label: 'Zero Pad', command: 'zeropad', description: 'Pad number with zeros' }
	]
};

export function activate(context: vscode.ExtensionContext) {
	console.log('STTR extension is now active!');

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

	context.subscriptions.push(transformTextCommand, showCommandsCommand);
}

async function showTransformationMenu(selectedText: string, editor: vscode.TextEditor, selection: vscode.Selection) {
	// Create quick pick items from all categories
	const items: vscode.QuickPickItem[] = [];

	for (const [category, commands] of Object.entries(STTR_COMMANDS)) {
		// Add category separator
		items.push({
			label: `$(folder) ${category}`,
			kind: vscode.QuickPickItemKind.Separator
		});

		// Add commands in this category
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
	const items: string[] = [];

	for (const [category, commands] of Object.entries(STTR_COMMANDS)) {
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

## Winget
\`\`\`cmd
winget install -e --id abhimanyu003.sttr
\`\`\`

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
			const process = cp.spawn(sttrPath, [command], {
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
			cp.exec(cmd, (error, stdout) => {
				if (!error && stdout.trim()) {
					resolve(stdout.trim());
					return;
				}

				tried++;
				if (tried < commands.length) {
					tryCommand(commands[tried]);
				} else {
					// Try common installation paths
					const commonPaths = process.platform === 'win32'
						? ['C:\\Program Files\\sttr\\sttr.exe', 'C:\\sttr\\sttr.exe']
						: ['/usr/local/bin/sttr', '/opt/homebrew/bin/sttr', '/usr/bin/sttr', `${process.env.HOME}/.local/bin/sttr`, `${process.env.HOME}/go/bin/sttr`];

					for (const tryPath of commonPaths) {
						if (fs.existsSync(tryPath)) {
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
