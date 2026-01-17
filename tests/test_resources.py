"""Tests for the resources module."""

import pytest
from pathlib import Path

from tex2any.resources import load_package_resource, get_data_dir


class TestLoadPackageResource:
    """Tests for load_package_resource function."""

    def test_loads_theme_css(self):
        """Should load theme CSS file."""
        css = load_package_resource('themes', 'academic.css')
        assert isinstance(css, str)
        assert len(css) > 0
        # Should contain CSS content
        assert ':root' in css or 'body' in css or '{' in css

    def test_loads_component_css(self):
        """Should load component CSS file."""
        css = load_package_resource('components', 'toc.css')
        assert isinstance(css, str)
        assert len(css) > 0

    def test_loads_component_js(self):
        """Should load component JS file."""
        js = load_package_resource('components', 'toc.js')
        assert isinstance(js, str)
        assert len(js) > 0

    def test_raises_for_missing_resource(self):
        """Should raise FileNotFoundError for missing resource."""
        with pytest.raises(FileNotFoundError, match="Resource not found"):
            load_package_resource('themes', 'nonexistent.css')

    def test_raises_for_invalid_subpackage(self):
        """Should raise FileNotFoundError for invalid subpackage."""
        with pytest.raises(FileNotFoundError, match="Resource not found"):
            load_package_resource('invalid', 'file.css')


class TestGetDataDir:
    """Tests for get_data_dir function."""

    def test_returns_themes_dir(self):
        """Should return path to themes directory."""
        themes_dir = get_data_dir('themes')
        assert isinstance(themes_dir, Path)
        assert themes_dir.exists()
        assert themes_dir.is_dir()
        assert 'themes' in str(themes_dir)

    def test_returns_components_dir(self):
        """Should return path to components directory."""
        components_dir = get_data_dir('components')
        assert isinstance(components_dir, Path)
        assert components_dir.exists()
        assert components_dir.is_dir()
        assert 'components' in str(components_dir)

    def test_themes_dir_contains_css_files(self):
        """Themes directory should contain CSS files."""
        themes_dir = get_data_dir('themes')
        css_files = list(themes_dir.glob('*.css'))
        assert len(css_files) > 0

    def test_components_dir_contains_css_and_js_files(self):
        """Components directory should contain CSS and JS files."""
        components_dir = get_data_dir('components')
        css_files = list(components_dir.glob('*.css'))
        js_files = list(components_dir.glob('*.js'))
        assert len(css_files) > 0
        assert len(js_files) > 0
