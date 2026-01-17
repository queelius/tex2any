# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

tex2any is a Python wrapper around LaTeXML that converts LaTeX documents to multiple formats (HTML, Markdown, EPUB, plain text, etc.). Features a modular **theme + component system** that separates styling from functionality, enabling rich, interactive HTML documents.

## Development Commands

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run all tests (coverage enabled by default via pyproject.toml)
pytest

# Run a single test file
pytest tests/test_components.py

# Run a specific test
pytest tests/test_components.py::TestComponent::test_get_css_returns_string -v

# Format code (Black, line length 88)
black src/

# Type checking
mypy src/

# Linting
flake8 src/
```

### CLI Testing

```bash
# Basic conversion (requires LaTeXML installed)
tex2any test_document.tex

# With theme + components
tex2any test_document.tex --theme academic --components floating-toc,search

# Multiple output formats
tex2any test_document.tex -f html5,markdown,epub

# List available options
tex2any --list-themes
tex2any --list-components
```

## Architecture

### Conversion Pipeline

```
HTML formats:  .tex → latexmlc → .html → HTMLComposer (theme + components) → final .html
Other formats: .tex → latexmlc → .html → pandoc → .md/.txt/.epub
XML format:    .tex → latexml → .xml (no post-processing)
```

### Core Modules

- **`converter.py`** - `TexConverter` class wraps LaTeXML, routes to format-specific converters. Entry point: `convert(format, **kwargs)`.
- **`composer.py`** - `HTMLComposer` injects CSS/JS into `<head>` and `</body>`, wraps content for layouts. Uses regex-based HTML manipulation (fragile).
- **`themes.py`** - `Theme` dataclass + `THEMES` registry, loads CSS from `data/themes/`.
- **`components.py`** - `Component` dataclass + `COMPONENTS` registry (23 components), loads CSS/JS from `data/components/`. Validates at import time.
- **`config.py`** - TOML config from `~/.tex2any.toml`, provides defaults. Global instance via `get_config()`.
- **`cli.py`** - argparse CLI, handles multi-format output, integrates config defaults.

### Theme-Component Integration

Themes define CSS variables; components consume them:
```css
/* Theme defines */
:root { --link-color: #0066cc; --toc-bg: #f8f8f8; }

/* Component uses */
.floating-toc { background: var(--toc-bg, #f8f8f8); }
```

### Component Layout Positions

Components have `layout_position`: `'left'`, `'right'`, `'header'`, `'footer'`, or `None` (inline).

`HTMLComposer.inject_html_elements()` adds structural HTML for positioned components (e.g., wrapping content in `<main>` + `<aside>` for `sidebar-right`).

## System Dependencies

- **LaTeXML** (required): `sudo apt-get install latexml` or `brew install latexml`
- **Pandoc** (optional, for markdown/txt/epub): `sudo apt-get install pandoc`
- **tomli** (optional, for config on Python < 3.11): `pip install tomli`

## Adding Themes

1. Create `src/tex2any/data/themes/yourtheme.css`
2. Define CSS variables for component integration (see existing themes for expected variables)
3. Register in `themes.py`: `THEMES['yourtheme'] = Theme(name='yourtheme', description='...')`

## Adding Components

1. Create `src/tex2any/data/components/yourcomp.css` (required)
2. Create `src/tex2any/data/components/yourcomp.js` (if `requires_js=True`)
3. Register in `components.py` with `layout_position` if needed
4. Component validation runs at import time—missing files will warn

## Key Implementation Details

- **Zero Python runtime dependencies**: Uses only stdlib, delegates to external tools
- **Python 3.7+ compatibility**: Uses `importlib.resources` with fallback for older Python
- **Component filtering**: Non-HTML formats automatically filter out HTML-only components in `_filter_components_for_format()` (e.g., `floating-toc` becomes `toc` for markdown)
- **Config precedence**: CLI args > `~/.tex2any.toml` > hardcoded defaults

## Known Issues

- `composer.py` uses regex for HTML manipulation (fragile, should use `html.parser`)
