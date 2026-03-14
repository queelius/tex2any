"""HTML Composer — injects theme CSS and component CSS/JS into HTML."""

import re
from pathlib import Path

from tex2html import components
from tex2html.themes import get_theme


def _find_closing_tag(html: str, tag: str) -> int | None:
    """Position right before </tag> (case-insensitive), or None."""
    m = re.search(rf"</{tag}>", html, re.IGNORECASE)
    return m.start() if m else None


def _find_opening_tag_end(html: str, tag: str) -> int | None:
    """Position right after <tag ...> (case-insensitive), or None."""
    m = re.search(rf"<{tag}(?:\s[^>]*)?>", html, re.IGNORECASE)
    return m.end() if m else None


def inject_into_head(html: str, content: str) -> str:
    """Inject content before </head>. Fallback: after <body>, or prepend."""
    pos = _find_closing_tag(html, "head")
    if pos is not None:
        return html[:pos] + content + "\n" + html[pos:]
    pos = _find_opening_tag_end(html, "body")
    if pos is not None:
        return html[:pos] + "\n" + content + html[pos:]
    return content + "\n" + html


def inject_before_body_close(html: str, content: str) -> str:
    """Inject content before </body>. Fallback: append."""
    pos = _find_closing_tag(html, "body")
    if pos is not None:
        return html[:pos] + content + "\n" + html[pos:]
    return html + "\n" + content


def compose(
    html_path: Path,
    theme_name: str | None = None,
    component_names: list[str] | None = None,
    components_dir: Path | None = None,
) -> None:
    """Apply theme and components to an HTML file (in-place).

    Args:
        html_path: Path to the HTML file to modify.
        theme_name: Optional theme to inject.
        component_names: Optional list of component names.
        components_dir: Optional extra directory to search for components.
    """
    if not theme_name and not component_names:
        return

    html_path = Path(html_path)
    html = html_path.read_text(encoding="utf-8")

    css_parts: list[str] = []
    js_parts: list[str] = []

    if theme_name:
        theme = get_theme(theme_name)
        css_parts.append(f"/* Theme: {theme_name} */\n{theme.get_css()}")

    if component_names:
        for name in component_names:
            css, js = components.load(name, extra_dir=components_dir)
            css_parts.append(f"/* Component: {name} */\n{css}")
            if js:
                js_parts.append(f"/* Component: {name} */\n{js}")

    # Early inline script prevents flash of light theme before CSS loads
    if component_names and "dark-mode" in component_names:
        early_script = (
            '<script>'
            '(function(){'
            'var t;try{t=localStorage.getItem("tex2html-theme")}catch(e){}'
            'if(!t)t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";'
            'document.documentElement.setAttribute("data-theme",t)'
            '})()'
            '</script>'
        )
        html = inject_into_head(html, early_script)

    if css_parts:
        css_tag = "<style>\n" + "\n\n".join(css_parts) + "\n</style>"
        html = inject_into_head(html, css_tag)

    if js_parts:
        js_tag = "<script>\n" + "\n\n".join(js_parts) + "\n</script>"
        html = inject_before_body_close(html, js_tag)

    html_path.write_text(html, encoding="utf-8")
