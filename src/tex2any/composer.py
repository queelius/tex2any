"""HTML Composer - Combines themes and components into final HTML."""

import json
import re
from pathlib import Path
from typing import List, Optional
from tex2any.themes import get_theme
from tex2any.components import get_component
from tex2any.config import get_config


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

        # Inject CSS into HTML
        if css_parts:
            combined_css = "\n\n".join(css_parts)
            css_tag = f"<style>\n{combined_css}\n</style>"

            # Insert before closing </head> tag or at the start of <body>
            if '</head>' in html_content:
                html_content = html_content.replace('</head>', f"{css_tag}\n</head>", 1)
            elif '<body>' in html_content:
                html_content = html_content.replace('<body>', f"<body>\n{css_tag}", 1)
            else:
                # Fallback: prepend to content
                html_content = css_tag + "\n" + html_content

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

        # Inject JS before closing </body> tag
        if js_parts:
            combined_js = "\n\n".join(js_parts)
            js_tag = f"<script>\n{combined_js}\n</script>"

            if '</body>' in html_content:
                html_content = html_content.replace('</body>', f"{js_tag}\n</body>", 1)
            else:
                # Fallback: append to content
                html_content = html_content + "\n" + js_tag

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
        # Find the main document content
        main_pattern = r'(<body[^>]*>)(.*?)(</body>)'
        match = re.search(main_pattern, html_content, re.DOTALL)

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

        # Find body content
        body_pattern = r'(<body[^>]*>)(.*?)(</body>)'
        match = re.search(body_pattern, html_content, re.DOTALL)

        if not match:
            return html_content

        body_open, body_content, body_close = match.groups()

        # Wrap body content
        wrapped = f'{body_open}\n<div class="tex2any-content-wrapper">\n{body_content.strip()}\n</div>\n{body_close}'

        # Replace old body
        html_content = html_content.replace(match.group(0), wrapped)

        # Inject container CSS
        if '</head>' in html_content:
            html_content = html_content.replace('</head>', f"<style>\n{container_css}\n</style>\n</head>", 1)

        return html_content

    def _inject_footer_config(self, html_content: str) -> str:
        """Inject footer configuration as a meta tag."""
        config = get_config()
        footer_data = config.get_footer_data()

        # Create meta tag with JSON config
        meta_tag = f'<meta name="tex2any-footer-config" content=\'{json.dumps(footer_data)}\'>'

        # Insert in head
        if '</head>' in html_content:
            html_content = html_content.replace('</head>', f"{meta_tag}\n</head>", 1)
        elif '<body>' in html_content:
            html_content = html_content.replace('<body>', f"{meta_tag}\n<body>", 1)

        return html_content