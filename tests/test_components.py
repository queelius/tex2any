"""Tests for the component system."""

import pytest
from tex2any.components import (
    Component,
    COMPONENTS,
    get_component,
    list_components,
    validate_components,
)


class TestComponent:
    """Tests for Component class."""

    def test_get_css_returns_string(self):
        """Component.get_css() should return a non-empty string."""
        comp = get_component('toc')
        css = comp.get_css()
        assert isinstance(css, str)
        assert len(css) > 0

    def test_get_js_returns_string_when_required(self):
        """Component.get_js() should return string when requires_js=True."""
        comp = get_component('floating-toc')
        assert comp.requires_js is True
        js = comp.get_js()
        assert isinstance(js, str)
        assert len(js) > 0

    def test_all_registered_components_load_css(self):
        """All registered components should successfully load their CSS."""
        for name, comp in COMPONENTS.items():
            css = comp.get_css()
            assert isinstance(css, str), f"Component {name} failed to load CSS"
            assert len(css) > 0, f"Component {name} has empty CSS"

    def test_all_js_components_load_js(self):
        """All components with requires_js=True should load their JS."""
        for name, comp in COMPONENTS.items():
            if comp.requires_js:
                js = comp.get_js()
                assert isinstance(js, str), f"Component {name} failed to load JS"
                assert len(js) > 0, f"Component {name} has empty JS"


class TestComponentRegistry:
    """Tests for component registry functions."""

    def test_get_component_valid(self):
        """get_component() should return Component for valid names."""
        comp = get_component('toc')
        assert isinstance(comp, Component)
        assert comp.name == 'toc'

    def test_get_component_invalid(self):
        """get_component() should raise ValueError for invalid names."""
        with pytest.raises(ValueError) as exc_info:
            get_component('nonexistent-component')
        assert 'Unknown component' in str(exc_info.value)

    def test_list_components(self):
        """list_components() should return all registered components."""
        components = list_components()
        assert len(components) == len(COMPONENTS)
        assert all(isinstance(c, Component) for c in components)

    def test_known_components_exist(self):
        """Expected core components should be in the registry."""
        expected = ['toc', 'floating-toc', 'search', 'footer', 'sidebar-right']
        for name in expected:
            assert name in COMPONENTS, f"Expected component '{name}' not found"


class TestComponentValidation:
    """Tests for component validation."""

    def test_validate_components_returns_dict(self):
        """validate_components() should return a dict with expected keys."""
        result = validate_components()
        assert isinstance(result, dict)
        assert 'missing_css' in result
        assert 'missing_js' in result

    def test_validate_components_empty_when_valid(self):
        """validate_components() should return empty lists when all valid."""
        result = validate_components()
        assert result['missing_css'] == [], f"Missing CSS: {result['missing_css']}"
        assert result['missing_js'] == [], f"Missing JS: {result['missing_js']}"


class TestComponentLayoutPosition:
    """Tests for component layout positions."""

    def test_layout_positions_are_valid(self):
        """All layout_position values should be valid or None."""
        valid_positions = {'left', 'right', 'header', 'footer', None}
        for name, comp in COMPONENTS.items():
            assert comp.layout_position in valid_positions, (
                f"Component {name} has invalid layout_position: {comp.layout_position}"
            )


class TestMathPreviewComponent:
    """Tests for the math-preview component."""

    def test_math_preview_registered(self):
        """math-preview component should be in the registry."""
        assert 'math-preview' in COMPONENTS

    def test_math_preview_properties(self):
        """math-preview should have correct properties."""
        comp = get_component('math-preview')
        assert comp.name == 'math-preview'
        assert comp.requires_js is True
        assert comp.layout_position is None
        assert comp.html_only is True

    def test_math_preview_loads_css(self):
        """math-preview should load its CSS file."""
        comp = get_component('math-preview')
        css = comp.get_css()
        assert isinstance(css, str)
        assert len(css) > 0
        assert 'tex2any-math-preview' in css

    def test_math_preview_loads_js(self):
        """math-preview should load its JS file."""
        comp = get_component('math-preview')
        js = comp.get_js()
        assert isinstance(js, str)
        assert len(js) > 0
        assert 'initMathPreview' in js

    def test_math_preview_css_has_dark_mode(self):
        """math-preview CSS should include dark mode support."""
        comp = get_component('math-preview')
        css = comp.get_css()
        assert 'body[data-theme="dark"]' in css

    def test_math_preview_css_has_responsive_styles(self):
        """math-preview CSS should include responsive styles."""
        comp = get_component('math-preview')
        css = comp.get_css()
        assert '@media' in css

    def test_math_preview_js_handles_equation_selectors(self):
        """math-preview JS should handle common equation reference patterns."""
        comp = get_component('math-preview')
        js = comp.get_js()
        # Check for expected selectors
        assert '#eq-' in js
        assert '#E' in js
        assert 'ltx_equation' in js
