"""Theme system — auto-discovers CSS from data/themes/.

Each .css file is a theme. The description is parsed from the first
comment line (e.g., ``/* Academic Theme - Beautiful, minimalistic */``).
"""

import re
from dataclasses import dataclass
from pathlib import Path

THEMES_DIR = Path(__file__).parent / "data" / "themes"

# Matches ``/* Some Description - more detail */`` on the first line.
_DESCRIPTION_RE = re.compile(r"/\*\s*(.+?)\s*\*/")


@dataclass
class Theme:
    """A visual theme (just a name + description; CSS lives on disk)."""
    name: str
    description: str

    def get_css(self) -> str:
        css_path = THEMES_DIR / f"{self.name}.css"
        if not css_path.is_file():
            raise FileNotFoundError(f"Theme CSS not found: {css_path}")
        return css_path.read_text(encoding="utf-8")


def _parse_description(css_path: Path) -> str:
    """Extract a human-readable description from the first CSS comment."""
    first_line = css_path.read_text(encoding="utf-8").split("\n", 1)[0]
    m = _DESCRIPTION_RE.search(first_line)
    return m.group(1) if m else css_path.stem


def _discover_themes() -> dict[str, Theme]:
    """Scan THEMES_DIR for .css files and build the registry."""
    themes: dict[str, Theme] = {}
    if THEMES_DIR.is_dir():
        for css_path in sorted(THEMES_DIR.glob("*.css")):
            name = css_path.stem
            themes[name] = Theme(name, _parse_description(css_path))
    return themes


THEMES: dict[str, Theme] = _discover_themes()


def get_theme(name: str) -> Theme:
    if name not in THEMES:
        raise ValueError(
            f"Unknown theme: {name}\n"
            f"Available: {', '.join(THEMES.keys())}"
        )
    return THEMES[name]
