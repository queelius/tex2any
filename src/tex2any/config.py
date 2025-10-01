"""Configuration system for tex2any."""

import os
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import tomllib  # Python 3.11+
except ImportError:
    try:
        import tomli as tomllib  # Python 3.7-3.10
    except ImportError:
        tomllib = None


DEFAULT_CONFIG = {
    'author': {
        'name': '',
        'email': '',
    },
    'footer': {
        'copyright_year': '',
        'license': '',
        'custom_text': '',
    },
    'output': {
        'default_theme': 'academic',
        'default_formats': ['html5'],  # Can specify multiple: ['html5', 'markdown']
        'default_components': [],
    },
}


class Config:
    """Configuration manager for tex2any."""

    def __init__(self):
        self.config = DEFAULT_CONFIG.copy()
        self._load_config()

    def _load_config(self) -> None:
        """Load configuration from ~/.tex2any.toml if it exists."""
        config_path = Path.home() / '.tex2any.toml'

        if not config_path.exists():
            return

        if tomllib is None:
            print(f"Warning: Cannot parse {config_path} - install 'tomli' package for Python < 3.11")
            return

        try:
            with open(config_path, 'rb') as f:
                user_config = tomllib.load(f)
                self._merge_config(user_config)
        except Exception as e:
            print(f"Warning: Error loading config from {config_path}: {e}")

    def _merge_config(self, user_config: Dict[str, Any]) -> None:
        """Merge user config with defaults."""
        for section, values in user_config.items():
            if section in self.config and isinstance(values, dict):
                self.config[section].update(values)
            else:
                self.config[section] = values

    def get(self, section: str, key: str, default: Any = None) -> Any:
        """Get a configuration value."""
        return self.config.get(section, {}).get(key, default)

    def set(self, section: str, key: str, value: Any) -> None:
        """Set a configuration value (runtime only, not persisted)."""
        if section not in self.config:
            self.config[section] = {}
        self.config[section][key] = value

    def get_footer_data(self) -> Dict[str, str]:
        """Get footer-related configuration."""
        return {
            'author_name': self.get('author', 'name', ''),
            'author_email': self.get('author', 'email', ''),
            'copyright_year': self.get('footer', 'copyright_year', ''),
            'license': self.get('footer', 'license', ''),
            'custom_text': self.get('footer', 'custom_text', ''),
        }


def create_default_config_file() -> None:
    """Create a default ~/.tex2any.toml file."""
    config_path = Path.home() / '.tex2any.toml'

    if config_path.exists():
        response = input(f"{config_path} already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print("Aborted.")
            return

    default_toml = """# tex2any Configuration
# Place this file at ~/.tex2any.toml

[author]
name = "Your Name"
email = "your.email@example.com"

[footer]
copyright_year = "2025"
license = "CC BY 4.0"
custom_text = ""

[output]
default_theme = "academic"
default_formats = ["html5"]  # Can specify multiple: ["html5", "markdown", "epub"]
default_components = ["reading-time", "back-to-top", "theme-toggle"]
"""

    config_path.write_text(default_toml)
    print(f"Created default configuration at {config_path}")
    print("Edit this file to customize your settings.")


# Global config instance
_config = None


def get_config() -> Config:
    """Get the global configuration instance."""
    global _config
    if _config is None:
        _config = Config()
    return _config