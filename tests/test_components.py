"""Tests for the filesystem-based component loader."""

import pytest
from pathlib import Path

from tex2html import components
from tex2html.components import BUILTIN_DIR


class TestAvailable:
    """Tests for components.available()."""

    def test_returns_sorted_list(self):
        names = components.available()
        assert names == sorted(names)

    def test_contains_expected_components(self):
        names = components.available()
        expected = {'dark-mode', 'floating-toc', 'back-to-top', 'collapsible-proofs', 'copy-code'}
        assert expected.issubset(set(names))

    def test_extra_dir_adds_components(self, tmp_path):
        (tmp_path / "custom.css").write_text("body {}")
        names = components.available(extra_dir=tmp_path)
        assert "custom" in names

    def test_extra_dir_merges_with_builtin(self, tmp_path):
        (tmp_path / "custom.css").write_text("body {}")
        names = components.available(extra_dir=tmp_path)
        # Should have both built-in and custom
        assert "dark-mode" in names
        assert "custom" in names

    def test_extra_dir_none_is_safe(self):
        names = components.available(extra_dir=None)
        assert len(names) > 0


class TestLoad:
    """Tests for components.load()."""

    def test_loads_css(self):
        css, js = components.load("dark-mode")
        assert isinstance(css, str)
        assert len(css) > 0

    def test_loads_js_when_present(self):
        css, js = components.load("dark-mode")
        assert js is not None
        assert isinstance(js, str)
        assert len(js) > 0

    def test_js_none_when_no_js_file(self, tmp_path):
        (tmp_path / "css-only.css").write_text("body {}")
        css, js = components.load("css-only", extra_dir=tmp_path)
        assert css == "body {}"
        assert js is None

    def test_raises_for_unknown_component(self):
        with pytest.raises(ValueError, match="Unknown component"):
            components.load("nonexistent-component-xyz")

    def test_error_message_lists_available(self):
        with pytest.raises(ValueError, match="dark-mode"):
            components.load("nonexistent-component-xyz")

    def test_rejects_path_traversal(self):
        with pytest.raises(ValueError, match="Unknown component"):
            components.load("../../etc/passwd")

    def test_rejects_slashes(self):
        with pytest.raises(ValueError, match="Unknown component"):
            components.load("some/nested")

    def test_all_builtins_load(self):
        for name in components.available():
            css, js = components.load(name)
            assert isinstance(css, str)
            assert len(css) > 0

    def test_extra_dir_shadows_builtin(self, tmp_path):
        (tmp_path / "dark-mode.css").write_text("/* custom dark mode */")
        css, js = components.load("dark-mode", extra_dir=tmp_path)
        assert "custom dark mode" in css
        # JS falls back to builtin since extra dir doesn't have it
        assert js is not None

    def test_extra_dir_js_shadows_too(self, tmp_path):
        (tmp_path / "dark-mode.css").write_text("/* custom css */")
        (tmp_path / "dark-mode.js").write_text("// custom js")
        css, js = components.load("dark-mode", extra_dir=tmp_path)
        assert "custom css" in css
        assert "custom js" in js

    def test_falls_back_to_builtin(self, tmp_path):
        # extra_dir exists but doesn't have dark-mode
        css, js = components.load("dark-mode", extra_dir=tmp_path)
        assert len(css) > 0  # loaded from built-in


class TestBuiltinComponents:
    """Tests for the actual built-in component files."""

    def test_dark_mode_css_has_theme_variables(self):
        css, _ = components.load("dark-mode")
        assert "[data-theme=\"dark\"]" in css

    def test_dark_mode_js_respects_prefers_color_scheme(self):
        _, js = components.load("dark-mode")
        assert "prefers-color-scheme" in js

    def test_dark_mode_js_uses_localstorage(self):
        _, js = components.load("dark-mode")
        assert "localStorage" in js

    def test_floating_toc_css_is_fixed_position(self):
        css, _ = components.load("floating-toc")
        assert "position: fixed" in css

    def test_floating_toc_js_scans_latexml_sections(self):
        _, js = components.load("floating-toc")
        assert "ltx_section" in js

    def test_back_to_top_css_is_fixed_position(self):
        css, _ = components.load("back-to-top")
        assert "position: fixed" in css

    def test_back_to_top_no_component_coupling(self):
        css, _ = components.load("back-to-top")
        assert "theme-toggle" not in css
        assert "has-theme-toggle" not in css

    def test_collapsible_proofs_css_has_print_rule(self):
        css, _ = components.load("collapsible-proofs")
        assert "@media print" in css

    def test_collapsible_proofs_js_no_localstorage(self):
        _, js = components.load("collapsible-proofs")
        assert "localStorage" not in js

    def test_copy_code_js_uses_clipboard_api(self):
        _, js = components.load("copy-code")
        assert "navigator.clipboard" in js

    def test_copy_code_js_no_execcommand(self):
        _, js = components.load("copy-code")
        assert "execCommand" not in js

    def test_no_component_references_data_theme_dark(self):
        """Only dark-mode should reference [data-theme='dark']. Others use CSS vars."""
        for name in components.available():
            if name == "dark-mode":
                continue
            css, js = components.load(name)
            assert 'data-theme="dark"' not in css, f"{name}.css references data-theme"
            if js:
                assert 'data-theme="dark"' not in js, f"{name}.js references data-theme"
