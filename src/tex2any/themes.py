"""Theme system for tex2any - color schemes and typography."""

import warnings
from dataclasses import dataclass
from typing import Dict, List

from tex2any.resources import load_package_resource, get_data_dir


@dataclass
class Theme:
    """Represents a visual theme."""
    name: str
    description: str

    def get_css(self) -> str:
        """Get theme CSS content."""
        try:
            return load_package_resource('themes', f'{self.name}.css')
        except FileNotFoundError:
            raise FileNotFoundError(f"Theme resource not found: {self.name}.css")


# Theme Registry
THEMES: Dict[str, Theme] = {
    'academic': Theme(
        name='academic',
        description='Beautiful, minimalistic academic theme with excellent readability'
    ),
    'clean': Theme(
        name='clean',
        description='Clean minimal theme with good readability'
    ),
    'dark': Theme(
        name='dark',
        description='Dark mode theme'
    ),
    'minimal': Theme(
        name='minimal',
        description='Ultra-minimal theme with maximum focus on content'
    ),
    'serif': Theme(
        name='serif',
        description='Classic serif typography for traditional academic papers'
    ),
    'modern': Theme(
        name='modern',
        description='Modern, bold design with generous whitespace'
    ),
}


def get_theme(name: str) -> Theme:
    """Get a theme by name."""
    if name not in THEMES:
        raise ValueError(
            f"Unknown theme: {name}\n"
            f"Available themes: {', '.join(THEMES.keys())}"
        )
    return THEMES[name]


def list_themes() -> List[Theme]:
    """List all available themes."""
    return list(THEMES.values())


def validate_themes() -> List[str]:
    """Validate that all registered themes have CSS files.

    Returns:
        List of missing theme CSS file names (empty if all valid).
    """
    themes_dir = get_data_dir('themes')
    missing = []
    for name in THEMES:
        css_file = themes_dir / f'{name}.css'
        if not css_file.exists():
            missing.append(f'{name}.css')
    return missing


# Validate at import time (warn only, don't break)
def _validate_on_import() -> None:
    try:
        missing = validate_themes()
        if missing:
            warnings.warn(
                f"Missing theme CSS files: {', '.join(missing)}. "
                "These themes will fail when used.",
                UserWarning
            )
    except Exception:
        pass  # Don't break import if validation fails


_validate_on_import()