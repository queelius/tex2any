# tex2any Simplification Plan

## The Problem

tex2any has grown well beyond what's actually used. The only real consumer is `mf papers process`, which calls:

```
tex2any {file} -f html5 -o {output_dir}
```

That's it. No Python API imports, no explicit theme/component flags. The academic theme and footer component get applied via `~/.tex2any.toml` defaults.

## What's Actually Needed

1. Call `latexmlc --format=html5 --dest {output}` on a .tex file
2. Inject a theme CSS `<style>` block into `<head>`
3. Maybe inject a component's CSS/JS (floating-toc at most)

## What's YAGNI

### Components (22 registered, ~50 CSS/JS files)

Most of these have zero users:

- `hugo-frontmatter`, `hugo-shortcodes` — Hugo integration in a LaTeX converter
- `annotations`, `bookmark-progress` — localStorage features for static build output
- `share-buttons`, `citation-generator`, `document-stats`, `reading-time` — blog widgets
- `seo-meta` — SEO meta tags from a LaTeX converter
- `glossary-tooltips`, `math-preview`, `cross-references` — would need real LaTeX semantic parsing to work well
- `sidebar-right` — hardcoded "Quick Links" / "Metadata" placeholder HTML
- `sidenotes`, `equation-numbers`, `copy-code`, `theme-toggle`, `back-to-top`, `header`, `footer`

**Keep candidates:** `toc`, `floating-toc`, maybe `back-to-top`. Everything else can go.

### Config system (`config.py`, 138 lines)

- `~/.tex2any.toml` with author name, email, copyright year, license, footer text
- `--init-config`, `--author-name`, `--author-email`, `--copyright-year` CLI flags
- Global singleton `Config` with TOML parsing + Python 3.7 `tomli` fallback
- All exists to serve the footer component's metadata injection

**Verdict:** Delete entirely. If the theme needs author/license, pass it as a CLI flag or read from the .tex file's `\author{}`.

### Logging module (`logging.py`, 48 lines)

A wrapper around stdlib `logging` that adds nothing. `get_logger('converter')` is just `logging.getLogger('tex2any.converter')`.

**Verdict:** Delete. Use `print()` for the CLI, or just use `logging` directly if needed.

### Resources module (`resources.py`, 60 lines)

Three-tier resource loading fallback (`importlib.resources` → `pkg_resources` → direct `Path`) for Python 3.7 compatibility.

**Verdict:** Simplify to direct `Path` loading. Python 3.7-3.9 are EOL.

### Import-time validation

Both `themes.py` and `components.py` validate at import time, wrapped in `try/except Exception: pass`. Side effects on import that silently swallow all errors.

**Verdict:** Delete. If a theme file is missing, you'll find out when you try to use it.

### Formats

LaTeXML natively supports: `xml`, `html5`, `html4`, `xhtml`, `tex`, `box`

tex2any adds pandoc-based: `markdown`, `txt`, `epub`, `json`

The pandoc formats are just "convert to HTML, then pipe through pandoc." These are one-liners with pandoc directly and don't need a Python wrapper.

**Keep:** `html5` (the only format actually used). Maybe `html` as an alias. Drop `xhtml`, `html4`, `json`, `box`, `tex`. The pandoc formats (`markdown`, `txt`, `epub`) can stay as thin wrappers if they're cheap, but they're not worth a component/format filtering system.

### Python API (`TexConverter` class)

Nobody imports this. `mf` calls `tex2any` as a subprocess. The class could be replaced by a function.

### Composer complexity

`HTMLComposer` has layout wrapping (`_wrap_in_container`, `_wrap_for_sidebar_right`), footer config injection, and component HTML element injection. All in service of components that aren't used.

**Keep:** CSS/JS injection into `<head>` and `</body>`. Delete the rest.

## Target Architecture

```
tex2any/
├── src/tex2any/
│   ├── __init__.py
│   ├── cli.py          # argparse: tex2any file.tex [--theme name] [-o dir]
│   ├── converter.py    # call latexmlc, optionally pandoc
│   ├── themes.py       # load CSS from data/themes/, inject into HTML
│   └── data/themes/    # 2-4 CSS files (academic, dark, clean)
├── tests/
└── pyproject.toml      # Python >=3.10
```

Estimated: ~300 lines of Python, down from ~1,400.

The component system, config system, logging wrapper, resources module, composer class, layout manager, import-time validators, and 50+ CSS/JS component files all go away.

## Migration Path

1. The `mf` paper processor (`mf/papers/processor.py:93`) calls `tex2any -f html5 -o {dir}`. This needs to keep working. The simplified CLI should accept the same flags.
2. The academic theme CSS is the valuable output — it stays.
3. Existing converted papers in `metafunctor/static/latex/` don't need reconversion — they're static HTML.

## Security Fixes to Apply

From the texflow work, port these to the simplified tex2any:

- Whitelist LaTeXML/Pandoc CLI options (no arbitrary flag injection)
- Sanitize values passed to subprocess (reject shell metacharacters)
- Use `subprocess.run()` with list args (no `shell=True`) — already done

## Bump to Python 3.10+

- Drop 3.7/3.8/3.9 (all EOL)
- Use `X | None` instead of `Optional[X]`
- Use `list[str]` instead of `List[str]`
- Drop `tomli` fallback (3.11 has `tomllib`, and we're deleting config anyway)
- Drop `pkg_resources` fallback in resources.py
- Switch from flake8/isort to ruff
