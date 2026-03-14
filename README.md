# tex2html

A Python wrapper around [LaTeXML](https://dlmf.nist.gov/LaTeXML/) that converts LaTeX documents to HTML with theme and component support. Zero Python runtime dependencies — uses only stdlib and delegates to external tools.

## Installation

```bash
pip install tex2html
```

### System Requirements

- **LaTeXML** (required): `sudo apt-get install latexml` or `brew install latexml`
- **Pandoc** (optional, for markdown/txt/epub): `sudo apt-get install pandoc`

## Usage

```bash
# Basic conversion to HTML5
tex2html document.tex

# With theme and components
tex2html document.tex --theme academic -c dark-mode,floating-toc

# Specify output directory
tex2html document.tex -o output/

# List available themes and components
tex2html --list-themes
tex2html --list-components
```

### Output Formats

| Format   | Requirements | Description |
|----------|-------------|-------------|
| html5    | LaTeXML     | Modern HTML5 (default) |
| html     | LaTeXML     | Standard HTML |
| xhtml    | LaTeXML     | XHTML strict |
| xml      | LaTeXML     | LaTeXML intermediate XML |
| markdown | LaTeXML + Pandoc | Markdown via pandoc |
| txt      | LaTeXML + Pandoc | Plain text via pandoc |
| epub     | LaTeXML + Pandoc | EPUB e-book via pandoc |

### Themes

Built-in themes provide CSS variables for styling. Each is a single CSS file in `data/themes/`:

- **academic** — Clean academic paper styling
- **clean** — Minimal, readable defaults
- **dark** — Dark mode
- **minimal** — Bare-minimum styling
- **modern** — Contemporary design
- **serif** — Traditional serif typography

### Components

Components add interactive functionality via CSS + optional JS. Built-in components:

- **back-to-top** — Scroll-to-top button
- **collapsible-proofs** — Toggle proof visibility
- **copy-code** — Copy button on code blocks
- **dark-mode** — Light/dark theme toggle with localStorage persistence
- **floating-toc** — Fixed sidebar table of contents

Themes define CSS variables; components consume them with fallback defaults:
```css
/* Theme */     :root { --toc-bg: #f8f8f8; }
/* Component */ .floating-toc { background: var(--toc-bg, #f8f8f8); }
```

### Custom Components

Supply a directory of custom CSS/JS files that shadow built-in components:

```bash
tex2html document.tex -c my-component --components-dir ./my-components/
```

### Python API

```python
from tex2html import TexConverter
from pathlib import Path

converter = TexConverter(Path("document.tex"))
output = converter.convert("html5", theme="academic", components="dark-mode,floating-toc")
```

## Development

```bash
pip install -e ".[dev]"
pytest                  # run tests (coverage enabled by default)
black src/              # format
mypy src/               # type check
flake8 src/             # lint
```

## License

MIT
