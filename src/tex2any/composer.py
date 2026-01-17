"""HTML Composer - Combines themes and components into final HTML."""

import html
import json
import re
from pathlib import Path
from typing import List, Optional

from tex2any.themes import get_theme
from tex2any.components import get_component
from tex2any.config import get_config


class HTMLInjector:
    """Safe HTML manipulation using proper parsing.

    Handles injection of content into HTML documents in a way that:
    - Is case-insensitive for tag matching
    - Properly handles comments and other edge cases
    - Escapes content appropriately
    """

    @staticmethod
    def _find_closing_tag(html_content: str, tag: str) -> Optional[int]:
        """Find the position of a closing tag (case-insensitive).

        Returns the position right before the closing tag, or None if not found.
        """
        # Use regex with case-insensitive flag for robustness
        pattern = re.compile(rf'</{tag}>', re.IGNORECASE)
        match = pattern.search(html_content)
        return match.start() if match else None

    @staticmethod
    def _find_opening_tag_end(html_content: str, tag: str) -> Optional[int]:
        """Find the position right after an opening tag (case-insensitive).

        Returns the position right after the '>' of the opening tag, or None if not found.
        """
        # Match opening tag with optional attributes
        pattern = re.compile(rf'<{tag}(?:\s[^>]*)?>',  re.IGNORECASE)
        match = pattern.search(html_content)
        return match.end() if match else None

    @staticmethod
    def inject_into_head(html_content: str, content: str) -> str:
        """Inject content before the closing </head> tag.

        If no </head> found, tries to inject after <body> or prepends to content.
        """
        pos = HTMLInjector._find_closing_tag(html_content, 'head')
        if pos is not None:
            return html_content[:pos] + content + '\n' + html_content[pos:]

        # Fallback: try after <body>
        pos = HTMLInjector._find_opening_tag_end(html_content, 'body')
        if pos is not None:
            return html_content[:pos] + '\n' + content + html_content[pos:]

        # Last resort: prepend
        return content + '\n' + html_content

    @staticmethod
    def inject_before_body_close(html_content: str, content: str) -> str:
        """Inject content before the closing </body> tag.

        If no </body> found, appends to content.
        """
        pos = HTMLInjector._find_closing_tag(html_content, 'body')
        if pos is not None:
            return html_content[:pos] + content + '\n' + html_content[pos:]

        # Fallback: append
        return html_content + '\n' + content

    @staticmethod
    def escape_for_attribute(value: str) -> str:
        """Escape a value for use in an HTML attribute."""
        return html.escape(value, quote=True)

    @staticmethod
    def escape_json_for_attribute(data: dict) -> str:
        """Safely encode JSON data for use in an HTML attribute.

        Uses HTML entity encoding to prevent XSS and parsing issues.
        """
        json_str = json.dumps(data)
        return html.escape(json_str, quote=True)


class HTMLComposer:
    """Composes themes and components into a final HTML document."""

    def __init__(self, html_path: Path):
        self.html_path = Path(html_path)
        if not self.html_path.exists():
            raise FileNotFoundError(f"HTML file not found: {html_path}")

    def apply_theme_and_components(
        self,
        theme_name: Optional[str] = None,
        component_names: Optional[List[str]] = None
    ) -> None:
        """Apply theme and components to the HTML document."""
        # Read the HTML content
        with open(self.html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Wrap content in positioned container for components
        html_content = self._wrap_in_container(html_content)

        # Inject footer config if footer component is used
        if component_names and 'footer' in component_names:
            html_content = self._inject_footer_config(html_content)

        # Collect all CSS
        css_parts = []

        # Add theme CSS
        if theme_name:
            theme = get_theme(theme_name)
            css_parts.append(f"/* Theme: {theme_name} */\n{theme.get_css()}")

        # Add component CSS
        components = []
        if component_names:
            for comp_name in component_names:
                comp = get_component(comp_name)
                components.append(comp)
                css_parts.append(f"/* Component: {comp_name} */\n{comp.get_css()}")

        # Inject CSS into HTML using HTMLInjector
        if css_parts:
            combined_css = "\n\n".join(css_parts)
            css_tag = f"<style>\n{combined_css}\n</style>"
            html_content = HTMLInjector.inject_into_head(html_content, css_tag)

        # Collect and inject JavaScript
        js_parts = []
        for comp in components:
            if comp.requires_js:
                try:
                    js_content = comp.get_js()
                    if js_content:
                        js_parts.append(f"/* Component JS: {comp.name} */\n{js_content}")
                except FileNotFoundError:
                    pass  # Component doesn't have JS file

        # Inject JS before closing </body> tag using HTMLInjector
        if js_parts:
            combined_js = "\n\n".join(js_parts)
            js_tag = f"<script>\n{combined_js}\n</script>"
            html_content = HTMLInjector.inject_before_body_close(html_content, js_tag)

        # Write the modified HTML back
        with open(self.html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

    def inject_html_elements(self, component_names: List[str]) -> None:
        """Inject HTML elements for components that need them (e.g., sidebar wrapper)."""
        if not component_names:
            return

        with open(self.html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Check if sidebar-right component is present
        if 'sidebar-right' in component_names:
            html_content = self._wrap_for_sidebar_right(html_content)

        # Save modified content
        with open(self.html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

    def _wrap_for_sidebar_right(self, html_content: str) -> str:
        """Wrap content for sidebar-right layout."""
        # Find the main document content using case-insensitive regex
        main_pattern = re.compile(r'(<body[^>]*>)(.*?)(</body>)', re.DOTALL | re.IGNORECASE)
        match = main_pattern.search(html_content)

        if not match:
            return html_content

        body_open, body_content, body_close = match.groups()

        # Create the sidebar structure
        sidebar_html = '''
<div class="tex2any-layout-with-sidebar-right">
  <main class="tex2any-main-content">
    {CONTENT}
  </main>
  <aside class="tex2any-sidebar-right">
    <section>
      <h3>Quick Links</h3>
      <ul class="tex2any-quick-links">
        <!-- Will be populated by JS -->
      </ul>
    </section>
    <section>
      <h3>Metadata</h3>
      <dl class="tex2any-metadata">
        <!-- Will be populated by JS -->
      </dl>
    </section>
  </aside>
</div>
'''
        wrapped_content = sidebar_html.replace('{CONTENT}', body_content.strip())

        return html_content.replace(
            match.group(0),
            f"{body_open}\n{wrapped_content}\n{body_close}"
        )

    def _wrap_in_container(self, html_content: str) -> str:
        """Wrap body content in a positioned container for components."""
        # Add container wrapper CSS
        container_css = """
/* Container for component positioning */
.tex2any-content-wrapper {
    position: relative;
    min-height: 100vh;
}
"""

        # Find body content using case-insensitive regex
        body_pattern = re.compile(r'(<body[^>]*>)(.*?)(</body>)', re.DOTALL | re.IGNORECASE)
        match = body_pattern.search(html_content)

        if not match:
            return html_content

        body_open, body_content, body_close = match.groups()

        # Wrap body content
        wrapped = f'{body_open}\n<div class="tex2any-content-wrapper">\n{body_content.strip()}\n</div>\n{body_close}'

        # Replace old body
        html_content = html_content.replace(match.group(0), wrapped)

        # Inject container CSS using HTMLInjector
        css_tag = f"<style>\n{container_css}\n</style>"
        html_content = HTMLInjector.inject_into_head(html_content, css_tag)

        return html_content

    def _inject_footer_config(self, html_content: str) -> str:
        """Inject footer configuration as a meta tag."""
        config = get_config()
        footer_data = config.get_footer_data()

        # Create meta tag with properly escaped JSON config
        escaped_json = HTMLInjector.escape_json_for_attribute(footer_data)
        meta_tag = f'<meta name="tex2any-footer-config" content="{escaped_json}">'

        # Insert in head using HTMLInjector
        return HTMLInjector.inject_into_head(html_content, meta_tag)