# STTR - String Transformer for VS Code

Transform selected text using the powerful [sttr CLI utility](https://github.com/abhimanyu003/sttr) directly within VS Code.

## Features

- **80+ string transformations** including encoding, hashing, case conversion, and formatting
- **Context menu integration** - Right-click on selected text to transform
- **Command palette support** - Access via `STTR: Transform Text`
- **Comprehensive transformations** organized by category:
  - Encode/Decode (Base64, URL, HTML, Hex, Morse, etc.)
  - Hash functions (MD5, SHA1, SHA256, BCrypt, etc.)
  - String case (camelCase, PascalCase, kebab-case, etc.)
  - Line operations (sort, reverse, unique, count)
  - Format conversion (JSON, YAML, Markdown)
  - Text extraction (emails, URLs, IPs)
  - And much more!

## Requirements

This extension requires the `sttr` CLI utility to be installed on your system.

### Installation Instructions

**macOS (Homebrew - Recommended):**
```bash
brew install abhimanyu003/sttr/sttr
```

**Windows (Winget):**
```cmd
winget install -e --id abhimanyu003.sttr
```

**Linux (Quick Install):**
```bash
curl -sfL https://raw.githubusercontent.com/abhimanyu003/sttr/main/install.sh | sh
```

**Universal (Go):**
```bash
go install github.com/abhimanyu003/sttr@latest
```

For more installation options, visit the [sttr GitHub repository](https://github.com/abhimanyu003/sttr).

## Usage

1. **Select text** in any editor
2. **Right-click** and choose "Transform Text" from the context menu
   - OR use the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and search for "STTR: Transform Text"
3. **Choose a transformation** from the quick pick menu
4. The selected text will be **replaced** with the transformed result

## Available Transformations

### Encode/Decode
- ASCII85, Base32, Base64, Base85, Base64 URL
- HTML entities, URL encoding
- ROT13, Morse code, Hex

### Hash Functions
- MD5, SHA1, SHA256, SHA512
- BCrypt, XXH64

### String Case
- camelCase, PascalCase, kebab-case, snake_case
- UPPER CASE, lower case, Title Case
- Reverse text, slug-case

### Line Operations
- Sort, reverse, shuffle lines
- Count lines, unique lines
- Add line numbers

### Format Conversion
- JSON formatting and escaping
- JSON ↔ YAML conversion
- Markdown to HTML

### Text Extraction
- Extract emails, URLs, IP addresses

### And More!
- Remove spaces/newlines
- Escape quotes, zero padding
- Character/word/line counting
- Color conversion (Hex to RGB)

## Commands

- `STTR: Transform Text` - Transform selected text
- `STTR: Show Available Transformations` - View all available transformations

## Extension Settings

This extension does not contribute any VS Code settings. All transformations are handled by the sttr CLI utility.

## Known Issues

- The sttr CLI utility must be installed and available in your system PATH
- Some transformations may not work with empty or invalid input

## Release Notes

### 0.1.0

Initial release of STTR - String Transformer extension.

## Contributing

Issues and feature requests are welcome! Please visit the [GitHub repository](https://github.com/whisk/vscode-sttr).

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

The sttr CLI utility is developed by [abhimanyu003](https://github.com/abhimanyu003/sttr) and is also MIT licensed.
