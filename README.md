# tex2any

A powerful and user-friendly Python wrapper around LaTeXML for converting LaTeX documents to various formats.

## Features

- **Multiple Output Formats**: Convert LaTeX to HTML, HTML5, XHTML, Markdown, plain text, EPUB, JSON, and XML
- **Built-in Themes**: Professional themes including clean, dark mode, floating table of contents, and light/dark toggle
- **Custom Styling**: Support for custom CSS files with full control over LaTeXML's default styles
- **Simple CLI**: Intuitive command-line interface with sensible defaults
- **Pure Python**: No Python dependencies required (only system tools)

## Installation

### From PyPI (when published)

```bash
pip install tex2any
```

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/queelius/tex2any.git
cd tex2any

# Install in editable mode
pip install -e .

# Or install normally
pip install .
```

## System Requirements

tex2any requires the following system tools:

- **LaTeXML** (required): The core conversion engine
  - Ubuntu/Debian: `sudo apt-get install latexml`
  - macOS: `brew install latexml`
  - Other: See [LaTeXML installation guide](https://dlmf.nist.gov/LaTeXML/get.html)

- **Pandoc** (optional): Required only for markdown, txt, and epub output formats
  - Ubuntu/Debian: `sudo apt-get install pandoc`
  - macOS: `brew install pandoc`
  - Other: See [Pandoc installation guide](https://pandoc.org/installing.html)

## Usage

### Basic Conversion

Convert a LaTeX file to HTML (default format):

```bash
tex2any document.tex
```

### Specify Output Format

```bash
# Convert to Markdown
tex2any paper.tex -f markdown

# Convert to EPUB
tex2any book.tex -f epub -o mybook.epub

# Convert to plain text
tex2any abstract.tex -f txt
```

### Apply Themes

tex2any includes several built-in themes:

```bash
# Clean, minimal theme
tex2any paper.tex --theme clean

# Dark mode theme
tex2any paper.tex --theme dark

# Floating table of contents
tex2any paper.tex --theme floating-toc

# Light/dark mode toggle (with JavaScript)
tex2any paper.tex --theme toggle
```

### Custom CSS

```bash
# Use custom CSS file
tex2any paper.tex --css mystyle.css

# Use custom CSS without LaTeXML defaults
tex2any paper.tex --css mystyle.css --no-default-css
```

### List Available Options

```bash
# Show all supported formats
tex2any --list-formats

# Show all available themes
tex2any --list-themes

# Show version
tex2any --version

# Show help
tex2any --help
```

## Supported Formats

| Format   | Extension | Description                          | Requirements |
|----------|-----------|--------------------------------------|--------------|
| html     | .html     | Standard HTML output                 | LaTeXML      |
| html5    | .html     | Modern HTML5 with semantic elements | LaTeXML      |
| xhtml    | .xhtml    | XHTML strict format                 | LaTeXML      |
| xml      | .xml      | LaTeXML intermediate XML format     | LaTeXML      |
| markdown | .md       | Markdown format (via Pandoc)        | LaTeXML, Pandoc |
| txt      | .txt      | Plain text format (via Pandoc)      | LaTeXML, Pandoc |
| epub     | .epub     | EPUB e-book format (via Pandoc)     | LaTeXML, Pandoc |
| json     | .json     | JSON representation                 | LaTeXML      |

## Built-in Themes

### clean
A minimal, professional theme with excellent readability. Perfect for academic papers and documentation.

### dark
A dark mode theme that's easy on the eyes. Great for code-heavy documents and late-night reading.

### floating-toc
Features a floating sidebar with table of contents for easy navigation in long documents.

### toggle
Includes a JavaScript-powered toggle for switching between light and dark modes. Remembers user preference.

## Python API

You can also use tex2any programmatically in your Python code:

```python
from tex2any import TexConverter
from pathlib import Path

# Create converter
converter = TexConverter(Path("document.tex"))

# Convert to HTML with theme
output_path = converter.convert("html", theme="clean")
print(f"Converted to: {output_path}")

# Convert to multiple formats
for format in ["html", "markdown", "pdf"]:
    output = converter.convert(format)
    print(f"{format}: {output}")
```

## Development

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/queelius/tex2any.git
cd tex2any

# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run tests with coverage
pytest --cov=tex2any --cov-report=html

# Format code
black src/

# Type checking
mypy src/
```

### Project Structure

```
tex2any/
├── src/
│   └── tex2any/
│       ├── __init__.py          # Package initialization
│       ├── _version.py          # Version management
│       ├── cli.py               # Command-line interface
│       ├── converter.py         # Core conversion logic
│       └── data/
│           └── themes/          # Built-in CSS/JS themes
│               ├── clean.css
│               ├── dark.css
│               ├── floating-toc.css
│               ├── toggle.css
│               └── toggle.js
├── tests/                       # Unit tests
├── pyproject.toml              # Package configuration
├── README.md                   # Documentation
└── LICENSE                     # License file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [LaTeXML](https://dlmf.nist.gov/LaTeXML/) - The powerful LaTeX to XML/HTML/MathML converter
- [Pandoc](https://pandoc.org/) - Universal document converter

## Support

If you encounter any issues or have questions:

- Check the [FAQ](https://github.com/queelius/tex2any/wiki/FAQ)
- Search [existing issues](https://github.com/queelius/tex2any/issues)
- Open a [new issue](https://github.com/queelius/tex2any/issues/new)

## Roadmap

- [ ] Add support for bibliography processing
- [ ] Include more built-in themes
- [ ] Add PDF output via LaTeX compilation
- [ ] Support for custom LaTeXML bindings
- [ ] Web service API
- [ ] GUI application