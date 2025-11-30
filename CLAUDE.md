# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

tex2any is a Python wrapper around LaTeXML that converts LaTeX documents to multiple formats (HTML, Markdown, EPUB, plain text, etc.). Features a modular **theme + component system** that separates styling from functionality, enabling rich, interactive HTML documents.

## Development Commands

```bash
# Install in editable mode
pip install -e .

# Install with dev dependencies
pip install -e ".[dev]"

# Run tests (none currently exist)
pytest

# Run tests with coverage
pytest --cov=tex2any --cov-report=html

# Format code (Black, line length 88)
black src/

# Type checking
mypy src/

# Linting
flake8 src/
```

### Manual Testing

```bash
# Basic conversion
tex2any test_document.tex

# With themes
tex2any test_document.tex --theme academic
tex2any test_document.tex --theme dark

# With components
tex2any test_document.tex --theme academic --components floating-toc,search

# Multiple output formats
tex2any test_document.tex -f html5,markdown,epub

# List available options
tex2any --list-themes
tex2any --list-components
tex2any --list-formats

# Create config file
tex2any --init-config
```

## Architecture

### Conversion Pipeline

```
HTML formats:  .tex → latexmlc → .html → HTMLComposer (theme + components) → final .html
Other formats: .tex → latexmlc → .html → pandoc → .md/.txt/.epub
XML format:    .tex → latexml → .xml (no post-processing)
```

### Core Modules

| Module | Purpose |
|--------|---------|
| `converter.py` | `TexConverter` class wrapping LaTeXML, routes to format-specific converters |
| `cli.py` | argparse CLI, handles multi-format output, config integration |
| `composer.py` | `HTMLComposer` injects CSS/JS into `<head>` and `</body>`, wraps content for layouts |
| `themes.py` | `Theme` dataclass + `THEMES` registry, loads CSS from `data/themes/` |
| `components.py` | `Component` dataclass + `COMPONENTS` registry, loads CSS/JS from `data/components/` |
| `config.py` | TOML config from `~/.tex2any.toml`, provides defaults for theme/components/formats |

### Theme-Component Integration

Themes define CSS variables; components consume them:
```css
/* Theme defines */
:root { --link-color: #0066cc; --toc-bg: #f8f8f8; }

/* Component uses */
.floating-toc { background: var(--toc-bg, #f8f8f8); }
```

This allows any theme to work with any component combination.

### Component Layout Positions

Components have `layout_position` attribute: `'left'`, `'right'`, `'header'`, `'footer'`, or `None` (inline).

HTMLComposer handles structural HTML injection for positioned components (e.g., wrapping content in `<main>` + `<aside>` for `sidebar-right`).

## System Dependencies

- **LaTeXML** (required): `sudo apt-get install latexml` or `brew install latexml`
- **Pandoc** (optional, for markdown/txt/epub): `sudo apt-get install pandoc`
- **tomli** (optional, for config on Python < 3.11): `pip install tomli`

## Adding Themes

1. Create `src/tex2any/data/themes/yourtheme.css`
2. Define CSS variables for component integration:
   ```css
   :root {
       --link-color: ...; --toc-bg: ...; --header-bg: ...;
       --footer-bg: ...; --sidebar-bg: ...; --text-color: ...;
   }
   ```
3. Register in `themes.py`:
   ```python
   THEMES['yourtheme'] = Theme(name='yourtheme', description='...')
   ```

## Adding Components

1. Create `src/tex2any/data/components/yourcomp.css`
2. Create `src/tex2any/data/components/yourcomp.js` (if interactive)
3. Use theme CSS variables for styling
4. Register in `components.py`:
   ```python
   COMPONENTS['yourcomp'] = Component(
       name='yourcomp',
       description='...',
       requires_js=True,
       layout_position='left'  # or 'right', 'header', 'footer', None
   )
   ```

## Key Implementation Details

- **Zero Python runtime dependencies**: Uses only stdlib, delegates to external tools
- **Python 3.7+ compatibility**: Uses `importlib.resources` with fallback for older Python
- **Component filtering**: Non-HTML formats automatically filter out HTML-only components (e.g., `floating-toc` becomes `toc` for markdown)
- **Config precedence**: CLI args > `~/.tex2any.toml` > hardcoded defaults

## Current State

- **No tests exist** - tests directory needs to be created
- Components in `COMPONENTS` registry but some CSS/JS files may be stubs
- README.md is slightly out of date with current feature set
