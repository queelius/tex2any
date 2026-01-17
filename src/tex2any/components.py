"""Component system for tex2any - modular UI elements."""

import warnings
from dataclasses import dataclass
from typing import Optional, Dict, List

from tex2any.resources import load_package_resource, get_data_dir


@dataclass
class Component:
    """Base class for UI components."""
    name: str
    description: str
    requires_js: bool = False
    layout_position: Optional[str] = None  # 'left', 'right', 'header', 'footer', None
    html_only: bool = True  # Whether this component only works in HTML formats

    def get_css(self) -> str:
        """Get component CSS content."""
        return self._load_resource('css')

    def get_js(self) -> Optional[str]:
        """Get component JS content if it exists."""
        if not self.requires_js:
            return None
        return self._load_resource('js')

    def _load_resource(self, resource_type: str) -> str:
        """Load resource from package data."""
        try:
            return load_package_resource('components', f'{self.name}.{resource_type}')
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Component resource not found: {self.name}.{resource_type}"
            )


# Component Registry
COMPONENTS: Dict[str, Component] = {
    'toc': Component(
        name='toc',
        description='Inline table of contents',
        requires_js=True,
        layout_position=None,
        html_only=False  # Can work in markdown/epub via pandoc
    ),
    'floating-toc': Component(
        name='floating-toc',
        description='Floating sidebar table of contents (left)',
        requires_js=True,
        layout_position='left'
    ),
    'search': Component(
        name='search',
        description='Full-text search functionality',
        requires_js=True,
        layout_position='header'
    ),
    'footer': Component(
        name='footer',
        description='Document footer with navigation and info',
        requires_js=True,
        layout_position='footer'
    ),
    'sidebar-right': Component(
        name='sidebar-right',
        description='Right sidebar for notes, annotations, or quick links',
        requires_js=True,
        layout_position='right'
    ),
    'theme-toggle': Component(
        name='theme-toggle',
        description='Light/dark mode toggle button',
        requires_js=True,
        layout_position=None
    ),
    'reading-progress': Component(
        name='reading-progress',
        description='Progress bar showing scroll position',
        requires_js=True,
        layout_position='header'
    ),
    'back-to-top': Component(
        name='back-to-top',
        description='Floating button to scroll to top',
        requires_js=True,
        layout_position=None
    ),
    'sidenotes': Component(
        name='sidenotes',
        description='Convert footnotes to margin notes',
        requires_js=True,
        layout_position=None
    ),
    'equation-numbers': Component(
        name='equation-numbers',
        description='Automatic numbering for equations',
        requires_js=True,
        layout_position=None
    ),
    'copy-code': Component(
        name='copy-code',
        description='Add copy button to code blocks',
        requires_js=True,
        layout_position=None
    ),
    'share-buttons': Component(
        name='share-buttons',
        description='Floating share menu (Twitter, email, link)',
        requires_js=True,
        layout_position=None
    ),
    'citation-generator': Component(
        name='citation-generator',
        description='Generate BibTeX/APA citation from document metadata',
        requires_js=True,
        layout_position=None
    ),
    'reading-time': Component(
        name='reading-time',
        description='Display estimated reading time',
        requires_js=True,
        layout_position='header'
    ),
    'document-stats': Component(
        name='document-stats',
        description='Show word count and section count',
        requires_js=True,
        layout_position='footer'
    ),
    'hugo-frontmatter': Component(
        name='hugo-frontmatter',
        description='Generate YAML front matter from LaTeX metadata for Hugo',
        requires_js=True,
        layout_position=None
    ),
    'hugo-shortcodes': Component(
        name='hugo-shortcodes',
        description='Wrap LaTeX elements in Hugo shortcode syntax',
        requires_js=True,
        layout_position=None
    ),
    'annotations': Component(
        name='annotations',
        description='Personal highlights and notes with localStorage',
        requires_js=True,
        layout_position=None
    ),
    'bookmark-progress': Component(
        name='bookmark-progress',
        description='Remember reading position with localStorage',
        requires_js=True,
        layout_position=None
    ),
    'collapsible-proofs': Component(
        name='collapsible-proofs',
        description='Toggle visibility of theorem proofs and derivations',
        requires_js=True,
        layout_position=None
    ),
    'cross-references': Component(
        name='cross-references',
        description='Enhanced equation/theorem/figure cross-references with previews',
        requires_js=True,
        layout_position=None
    ),
    'seo-meta': Component(
        name='seo-meta',
        description='Comprehensive SEO meta tags (Open Graph, Twitter Card, JSON-LD)',
        requires_js=True,
        layout_position=None
    ),
    'glossary-tooltips': Component(
        name='glossary-tooltips',
        description='Hover tooltips for technical terms with definitions',
        requires_js=True,
        layout_position=None
    ),
    'math-preview': Component(
        name='math-preview',
        description='Hover preview tooltips for equation references',
        requires_js=True,
        layout_position=None,
        html_only=True
    ),
}


def get_component(name: str) -> Component:
    """Get a component by name."""
    if name not in COMPONENTS:
        raise ValueError(
            f"Unknown component: {name}\n"
            f"Available components: {', '.join(COMPONENTS.keys())}"
        )
    return COMPONENTS[name]


def list_components() -> List[Component]:
    """List all available components."""
    return list(COMPONENTS.values())


def validate_components() -> Dict[str, List[str]]:
    """Validate that all registered components have required CSS/JS files.

    Returns:
        Dict with 'missing_css' and 'missing_js' lists (empty if all valid).
    """
    components_dir = get_data_dir('components')
    missing_css = []
    missing_js = []

    for name, comp in COMPONENTS.items():
        css_file = components_dir / f'{name}.css'
        if not css_file.exists():
            missing_css.append(f'{name}.css')

        if comp.requires_js:
            js_file = components_dir / f'{name}.js'
            if not js_file.exists():
                missing_js.append(f'{name}.js')

    return {'missing_css': missing_css, 'missing_js': missing_js}


# Validate at import time (warn only, don't break)
def _validate_on_import() -> None:
    try:
        result = validate_components()
        missing = result['missing_css'] + result['missing_js']
        if missing:
            warnings.warn(
                f"Missing component files: {', '.join(missing)}. "
                "These components will fail when used.",
                UserWarning
            )
    except Exception:
        pass  # Don't break import if validation fails


_validate_on_import()