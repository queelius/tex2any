"""Tests for the theme system."""

import pytest
from tex2any.themes import (
    Theme,
    THEMES,
    get_theme,
    list_themes,
    validate_themes,
)


class TestTheme:
    """Tests for Theme class."""

    def test_get_css_returns_string(self):
        """Theme.get_css() should return a non-empty string."""
        theme = get_theme('academic')
        css = theme.get_css()
        assert isinstance(css, str)
        assert len(css) > 0

    def test_get_css_contains_expected_content(self):
        """Theme CSS should contain expected CSS structure."""
        theme = get_theme('academic')
        css = theme.get_css()
        # Should have CSS variables
        assert ':root' in css or 'body' in css

    def test_all_registered_themes_load_css(self):
        """All registered themes should successfully load their CSS."""
        for name, theme in THEMES.items():
            css = theme.get_css()
            assert isinstance(css, str), f"Theme {name} failed to load CSS"
            assert len(css) > 0, f"Theme {name} has empty CSS"


class TestThemeRegistry:
    """Tests for theme registry functions."""

    def test_get_theme_valid(self):
        """get_theme() should return Theme for valid names."""
        theme = get_theme('academic')
        assert isinstance(theme, Theme)
        assert theme.name == 'academic'

    def test_get_theme_invalid(self):
        """get_theme() should raise ValueError for invalid names."""
        with pytest.raises(ValueError) as exc_info:
            get_theme('nonexistent-theme')
        assert 'Unknown theme' in str(exc_info.value)

    def test_list_themes(self):
        """list_themes() should return all registered themes."""
        themes = list_themes()
        assert len(themes) == len(THEMES)
        assert all(isinstance(t, Theme) for t in themes)

    def test_known_themes_exist(self):
        """Expected themes should be in the registry."""
        expected = ['academic', 'clean', 'dark', 'minimal', 'serif', 'modern']
        for name in expected:
            assert name in THEMES, f"Expected theme '{name}' not found"


class TestThemeValidation:
    """Tests for theme validation."""

    def test_validate_themes_returns_list(self):
        """validate_themes() should return a list."""
        missing = validate_themes()
        assert isinstance(missing, list)

    def test_validate_themes_empty_when_valid(self):
        """validate_themes() should return empty list when all themes valid."""
        missing = validate_themes()
        assert missing == [], f"Missing theme files: {missing}"
