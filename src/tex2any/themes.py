"""Theme system for tex2any - color schemes and typography."""

import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List
try:
    from importlib.resources import files
except ImportError:
    from importlib import resources as pkg_resources
    files = None


def _get_themes_dir() -> Path:
    """Get the themes directory path."""
    import tex2any
    return Path(tex2any.__file__).parent / 'data' / 'themes'


@dataclass
class Theme:
    """Represents a visual theme."""
    name: str
    description: str

    def get_css(self) -> str:
        """Get theme CSS content."""
        resource_name = f'{self.name}.css'

        try:
            if files is not None:
                # For Python 3.9+
                resource_files = files('tex2any.data.themes')
                resource_path = resource_files / resource_name
                return resource_path.read_text(encoding='utf-8')
            else:
                # For Python 3.7-3.8
                import pkg_resources as pkg
                data = pkg.resource_string('tex2any', f'data/themes/{resource_name}')
                return data.decode('utf-8')
        except (FileNotFoundError, ModuleNotFoundError, Exception):
            # Fallback: Try to read from the package directory directly
            import tex2any
            package_dir = Path(tex2any.__file__).parent
            resource_path = package_dir / 'data' / 'themes' / resource_name
            if resource_path.exists():
                return resource_path.read_text(encoding='utf-8')

        raise FileNotFoundError(
            f"Theme resource not found: {self.name}.css"
        )


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
    themes_dir = _get_themes_dir()
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