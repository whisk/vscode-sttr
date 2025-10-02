# STTR - String Transformer for VS Code

Transform selected text using the powerful [sttr](https://github.com/abhimanyu003/sttr) CLI utility directly within VS Code.

## Features

- **50+ String Transformations**: Encode/decode, hash, case conversion, formatting, and more
- **Context Menu Integration**: Right-click on selected text to transform it
- **Command Palette Access**: Use `Ctrl+Shift+P` to access STTR commands
- **Quick Selection Menu**: Browse and search through all available transformations
- **In-place Text Replacement**: Selected text is replaced with the transformed result

### Available Transformations

- **Encode/Decode**: Base64, URL, HTML, ASCII85, Morse, ROT13, Hex, and more
- **Hashing**: MD5, SHA1, SHA256, SHA512, BCrypt, XXH64
- **Case Conversion**: camelCase, PascalCase, kebab-case, snake_case, UPPER, lower
- **Text Processing**: Reverse, sort lines, unique lines, count words/chars/lines
- **Format Conversion**: JSON ↔ YAML, Markdown → HTML, JSON escape/unescape
- **Data Extraction**: Extract emails, URLs, IP addresses
- **Color Conversion**: Hex to RGB
- **And many more...**

## Requirements

You must have the `sttr` CLI utility installed on your system.

### Installation

**macOS (Homebrew - Recommended):**
```bash
brew install abhimanyu003/sttr/sttr
```

**Quick Install (macOS/Linux):**
```bash
curl -sfL https://raw.githubusercontent.com/abhimanyu003/sttr/main/install.sh | sh
```

**Windows (Winget):**
```cmd
winget install -e --id abhimanyu003.sttr
```

**Go Install (All Platforms):**
```bash
go install github.com/abhimanyu003/sttr@latest
```

For more installation options, visit: https://github.com/abhimanyu003/sttr

## Usage

### Method 1: Context Menu
1. Select text in any editor
2. Right-click and choose "Transform Text"
3. Select the desired transformation from the menu

### Method 2: Command Palette
1. Select text in any editor
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "STTR: Transform Text" and press Enter
4. Select the desired transformation from the menu

### Method 3: Browse All Commands
- Use `Ctrl+Shift+P` and run "STTR: Show Available Transformations" to see all available commands

## Known Issues

- The `sttr` CLI utility must be installed separately
- Some transformations may require specific input formats
- Binary data transformations work best with text representations

## Release Notes

### 0.1.0

Initial release of STTR VS Code Extension:
- Integration with sttr CLI utility
- 50+ string transformations
- Context menu and command palette support
- Cross-platform compatibility
- Automatic sttr binary detection

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
