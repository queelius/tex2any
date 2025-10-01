# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

tex2any is a Python wrapper around LaTeXML that simplifies converting LaTeX documents to multiple formats (HTML, Markdown, EPUB, plain text, etc.). The tool features a **modular component and theme system** that separates styling (themes) from functionality (components), allowing users to compose rich, interactive HTML documents with ease.

## Development Commands

### Installation
```bash
# Install in editable mode for development
pip install -e .

# Install with dev dependencies
pip install -e ".[dev]"
```

### Testing
```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=tex2any --cov-report=html

# Run single test file
pytest tests/test_filename.py

# Run specific test
pytest tests/test_filename.py::test_function_name
```

### Code Quality
```bash
# Format code with Black (line length 88)
black src/

# Type checking with mypy
mypy src/

# Linting with flake8
flake8 src/
```

### Manual Testing
```bash
# Test basic conversion
tex2any test_document.tex

# Test with new themes
tex2any test_document.tex --theme academic
tex2any test_document.tex --theme clean
tex2any test_document.tex --theme dark
tex2any test_document.tex --theme minimal
tex2any test_document.tex --theme serif
tex2any test_document.tex --theme modern

# Test with components
tex2any test_document.tex --theme academic --components floating-toc
tex2any test_document.tex --theme modern --components floating-toc,search
tex2any test_document.tex --theme serif --components toc,sidebar-right
tex2any test_document.tex --theme clean --components search,header,footer

# Test different formats
tex2any test_document.tex -f markdown
tex2any test_document.tex -f html5 --theme academic

# List available options
tex2any --list-themes
tex2any --list-components
tex2any --list-formats
```

## Architecture

### Core Components

1. **TexConverter** (`src/tex2any/converter.py`): Main conversion engine
   - Wraps LaTeXML's `latexmlc` command-line tool
   - Handles two-stage conversion process:
     - Stage 1: LaTeX → XML (using `latexml`)
     - Stage 2: XML → target format (using `latexmlpost`)
   - For non-HTML formats (markdown, txt, epub): HTML → target format via Pandoc
   - Delegates theme/component composition to HTMLComposer
   - Python 3.7+ compatibility for resource loading (uses both `importlib.resources` APIs)

2. **CLI** (`src/tex2any/cli.py`): Command-line interface using argparse
   - Simple pass-through to TexConverter
   - Provides `--list-formats`, `--list-themes`, and `--list-components` for discovery
   - Entry point defined in `pyproject.toml` as `tex2any = "tex2any.cli:main"`

3. **Theme System** (`src/tex2any/themes.py` + `src/tex2any/data/themes/`):
   - **Themes define visual appearance**: colors, typography, spacing
   - Available themes:
     - `academic`: Beautiful, minimalistic theme optimized for readability (serif body, sans headings)
     - `clean`: Simple, clean design with modern sans-serif
     - `dark`: Dark mode with comfortable contrast
     - `minimal`: Ultra-minimal design, maximum content focus
     - `serif`: Classic serif typography for traditional academic papers
     - `modern`: Bold, contemporary design with generous whitespace
   - Themes use CSS variables for component integration (e.g., `--link-color`, `--toc-bg`)
   - Theme files are loaded via `importlib.resources` with fallback for Python 3.7-3.8

4. **Component System** (`src/tex2any/components.py` + `src/tex2any/data/components/`):
   - **Components add functionality**: TOC, search, navigation, metadata
   - Available components:
     - `toc`: Inline table of contents (appears in document flow)
     - `floating-toc`: Floating left sidebar with TOC and active section highlighting
     - `search`: Full-text search with keyboard shortcuts (Ctrl+K) and result highlighting
     - `header`: Document header with title and navigation
     - `footer`: Document footer with links and copyright
     - `sidebar-right`: Right sidebar for metadata, quick links, related sections
     - `breadcrumbs`: Breadcrumb navigation trail
   - Components have CSS, optional JS, and layout positions (left/right/header/footer)
   - Components are composable and theme-aware (use theme CSS variables)

5. **HTMLComposer** (`src/tex2any/composer.py`): Post-processing engine
   - Applies themes and components to LaTeXML-generated HTML
   - Injects CSS `<style>` tags into `<head>`
   - Injects JavaScript `<script>` tags before `</body>`
   - Wraps HTML structure for components (e.g., sidebar layouts)
   - All injection happens after LaTeXML conversion completes

### Conversion Pipeline

The conversion process depends on target format:

**For HTML-based formats (html, html5, xhtml):**
```
.tex → latexmlc → .html → HTMLComposer → .html (with theme + components)
```

**For other formats:**
```
.tex → latexmlc → .html → pandoc → .md/.txt/.epub
```

**For XML:**
```
.tex → latexml → .xml (no post-processing)
```

### Theme and Component Architecture

**Separation of Concerns:**
- **Themes** = Visual design (colors, fonts, spacing)
- **Components** = Functionality (navigation, search, metadata)
- **Layout** = How components are arranged (handled by component CSS)

**Integration via CSS Variables:**
- Themes define CSS variables like `--link-color`, `--toc-bg`, `--header-bg`
- Components reference these variables for consistent styling
- This allows any theme to work with any component combination

**Example Composition:**
```bash
tex2any paper.tex --theme academic --components floating-toc,search
```
Results in:
1. LaTeXML generates base HTML
2. HTMLComposer injects theme CSS (academic.css)
3. HTMLComposer injects component CSS (floating-toc.css, search.css)
4. HTMLComposer injects component JS (floating-toc.js, search.js)
5. Components use theme's CSS variables for consistent appearance

### Key Design Decisions

- **Zero Python dependencies**: Only stdlib, relies on external tools (LaTeXML, Pandoc)
- **Post-processing approach**: LaTeXML generates base HTML, then HTMLComposer adds themes/components
- **Component composition**: Components are additive and independent (can mix and match)
- **CSS variable integration**: Themes define variables, components consume them
- **JavaScript injection**: Done via HTMLComposer after LaTeXML completes
- **Format detection**: Output extension auto-generated based on format if not specified
- **Error handling**: Clear error messages for missing system dependencies (LaTeXML, Pandoc)

## System Dependencies

- **LaTeXML** (required): Must be installed system-wide
  - Ubuntu/Debian: `sudo apt-get install latexml`
  - macOS: `brew install latexml`

- **Pandoc** (optional): Only for markdown, txt, epub formats
  - Ubuntu/Debian: `sudo apt-get install pandoc`
  - macOS: `brew install pandoc`

## Package Structure

```
src/tex2any/
├── __init__.py          # Exports TexConverter and __version__
├── _version.py          # Version string
├── cli.py               # CLI entry point
├── converter.py         # Core TexConverter class
├── composer.py          # HTMLComposer for theme/component injection
├── themes.py            # Theme registry and loading
├── components.py        # Component registry and loading
└── data/
    ├── themes/          # CSS theme files (academic, clean, dark, minimal, serif, modern)
    └── components/      # CSS/JS component files (toc, floating-toc, search, header, footer, etc.)
```

## Testing Strategy

No tests currently exist. When creating tests:
- Test with/without system dependencies (LaTeXML, Pandoc)
- Mock subprocess calls to avoid requiring actual installations
- Test theme and component loading across Python 3.7-3.12 (importlib.resources compatibility)
- Test HTMLComposer CSS/JS injection
- Test component composition (multiple components together)
- Test theme/component CSS variable integration
- Test format detection and output path generation
- Test component HTML structure wrapping (e.g., sidebar-right layout)
- Use `test_document.tex` in repo root for integration tests

## Adding New Themes

1. Create `src/tex2any/data/themes/yourtheme.css`
2. Define CSS variables for component integration:
   ```css
   :root {
       --link-color: ...;
       --toc-bg: ...;
       --header-bg: ...;
       --footer-bg: ...;
       --sidebar-bg: ...;
   }
   ```
3. Register in `src/tex2any/themes.py`:
   ```python
   THEMES = {
       'yourtheme': Theme(name='yourtheme', description='...')
   }
   ```

## Adding New Components

1. Create `src/tex2any/data/components/yourcomp.css`
2. Optionally create `src/tex2any/data/components/yourcomp.js`
3. Use theme CSS variables for styling:
   ```css
   .yourcomp {
       background: var(--sidebar-bg, #f8f8f8);
       color: var(--text-color, #1a1a1a);
   }
   ```
4. Register in `src/tex2any/components.py`:
   ```python
   COMPONENTS = {
       'yourcomp': Component(
           name='yourcomp',
           description='...',
           requires_js=True,  # if JS needed
           layout_position='left'  # or 'right', 'header', 'footer', None
       )
   }
   ```