"""Shared resource loading utilities for tex2any."""

from pathlib import Path

try:
    from importlib.resources import files
except ImportError:
    files = None


def load_package_resource(subpackage: str, filename: str) -> str:
    """Load a text resource from the package data directory.

    Args:
        subpackage: Subpackage name under tex2any.data (e.g., 'themes', 'components').
        filename: Name of the resource file (e.g., 'academic.css').

    Returns:
        The text content of the resource file.

    Raises:
        FileNotFoundError: If the resource cannot be found.
    """
    full_package = f'tex2any.data.{subpackage}'

    try:
        if files is not None:
            # For Python 3.9+
            resource_files = files(full_package)
            resource_path = resource_files / filename
            return resource_path.read_text(encoding='utf-8')
        else:
            # For Python 3.7-3.8
            import pkg_resources as pkg
            data = pkg.resource_string('tex2any', f'data/{subpackage}/{filename}')
            return data.decode('utf-8')
    except (FileNotFoundError, ModuleNotFoundError, TypeError, AttributeError):
        # Fallback: Try to read from the package directory directly
        import tex2any
        package_dir = Path(tex2any.__file__).parent
        resource_path = package_dir / 'data' / subpackage / filename
        if resource_path.exists():
            return resource_path.read_text(encoding='utf-8')

    raise FileNotFoundError(
        f"Resource not found: {subpackage}/{filename}"
    )


def get_data_dir(subpackage: str) -> Path:
    """Get the path to a data subdirectory.

    Args:
        subpackage: Subpackage name under tex2any.data (e.g., 'themes', 'components').

    Returns:
        Path to the data subdirectory.
    """
    import tex2any
    return Path(tex2any.__file__).parent / 'data' / subpackage
