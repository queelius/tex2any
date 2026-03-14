"""Component loader — filesystem-based, no registry.

A component is a .css file (required) + optional .js file.
Custom dir shadows built-in dir.
"""

from pathlib import Path

BUILTIN_DIR = Path(__file__).parent / "data" / "components"


def available(extra_dir: Path | None = None) -> list[str]:
    """List available component names (union of built-in and extra dir)."""
    names: set[str] = set()
    for d in (BUILTIN_DIR, extra_dir):
        if d and d.is_dir():
            names.update(p.stem for p in d.glob("*.css"))
    return sorted(names)


def load(name: str, extra_dir: Path | None = None) -> tuple[str, str | None]:
    """Load a component's CSS and optional JS.

    Extra dir shadows built-in: if name.css exists in extra_dir, it wins.

    Returns:
        (css_content, js_content_or_none)

    Raises:
        ValueError: if the component doesn't exist in either directory.
    """
    css_path = _resolve(name, "css", extra_dir)
    if css_path is None:
        avail = ", ".join(available(extra_dir))
        raise ValueError(f"Unknown component: {name}\nAvailable: {avail}")

    css = css_path.read_text(encoding="utf-8")

    js_path = _resolve(name, "js", extra_dir)
    js = js_path.read_text(encoding="utf-8") if js_path else None

    return css, js


def _resolve(name: str, ext: str, extra_dir: Path | None) -> Path | None:
    """Find a component file. Extra dir takes priority."""
    if "/" in name or "\\" in name or ".." in name:
        return None
    if extra_dir:
        p = extra_dir / f"{name}.{ext}"
        if p.is_file():
            return p
    p = BUILTIN_DIR / f"{name}.{ext}"
    return p if p.is_file() else None
