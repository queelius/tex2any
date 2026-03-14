"""Tests for the converter module."""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import subprocess

from tex2html.converter import TexConverter


class TestTexConverterInit:
    """Tests for TexConverter initialization."""

    def test_init_with_valid_tex_file(self, tmp_path):
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}\\begin{document}Hello\\end{document}")
        converter = TexConverter(tex_file)
        assert converter.input_file == tex_file

    def test_init_with_nonexistent_file(self, tmp_path):
        with pytest.raises(FileNotFoundError, match="Input file not found"):
            TexConverter(tmp_path / "nonexistent.tex")

    def test_init_with_wrong_extension(self, tmp_path):
        txt_file = tmp_path / "test.txt"
        txt_file.write_text("Hello")
        with pytest.raises(ValueError, match="must be a .tex file"):
            TexConverter(txt_file)

    def test_init_with_output_dir(self, tmp_path):
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        output_dir = tmp_path / "output"
        converter = TexConverter(tex_file, output_dir=output_dir)
        assert converter.output_dir == output_dir


class TestTexConverterFormats:
    """Tests for format handling."""

    @pytest.fixture
    def converter(self, tmp_path):
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}\\begin{document}Hello\\end{document}")
        return TexConverter(tex_file)

    def test_supported_formats(self, converter):
        expected = {'html', 'html5', 'xhtml', 'xml', 'markdown', 'txt', 'epub', 'json'}
        assert set(converter.SUPPORTED_FORMATS.keys()) == expected

    def test_convert_with_invalid_format(self, converter):
        with pytest.raises(ValueError, match="Unsupported format"):
            converter.convert("pdf")


class TestOutputPathGeneration:
    """Tests for output path generation."""

    @pytest.fixture
    def converter(self, tmp_path):
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        return TexConverter(tex_file)

    def test_html_output_path(self, converter):
        path = converter._get_output_path('html')
        assert path.name == 'index.html'

    def test_markdown_output_path(self, converter):
        path = converter._get_output_path('markdown')
        assert path.name == 'index.md'

    def test_custom_output_dir(self, tmp_path):
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        output_dir = tmp_path / "custom_output"
        converter = TexConverter(tex_file, output_dir=output_dir)
        path = converter._get_output_path('html')
        assert path.parent == output_dir


class TestSubprocessHandling:
    """Tests for subprocess error handling."""

    @pytest.fixture
    def converter(self, tmp_path):
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}\\begin{document}Hello\\end{document}")
        return TexConverter(tex_file)

    def test_run_latexml_timeout_handling(self, converter):
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired(cmd=['latexmlc'], timeout=900)
            with pytest.raises(RuntimeError, match="timed out"):
                converter._run_latexml(Path('/tmp/output.html'))

    def test_run_latexml_not_found(self, converter):
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = FileNotFoundError()
            with pytest.raises(RuntimeError, match="LaTeXML not found"):
                converter._run_latexml(Path('/tmp/output.html'))

    def test_convert_xml_timeout_handling(self, converter, tmp_path):
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired(cmd=['latexml'], timeout=900)
            with pytest.raises(RuntimeError, match="timed out"):
                converter._convert_xml(tmp_path / "output.xml")

    def test_convert_via_pandoc_not_found(self, converter, tmp_path):
        def side_effect(*args, **kwargs):
            if 'pandoc' in args[0]:
                raise FileNotFoundError()
            return MagicMock(stdout='', stderr='')

        with patch('subprocess.run', side_effect=side_effect):
            with pytest.raises(RuntimeError, match="Pandoc not found"):
                converter._convert_via_pandoc(tmp_path / "output.md", [], 'Markdown')


class TestApplyThemeAndComponents:
    """Tests for theme/component application via compose."""

    @pytest.fixture
    def converter(self, tmp_path):
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        return TexConverter(tex_file)

    def test_apply_with_theme(self, converter, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")
        converter._apply_theme_and_components(html_file, theme="academic")
        result = html_file.read_text()
        assert "/* Theme: academic */" in result

    def test_apply_with_components_string(self, converter, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")
        converter._apply_theme_and_components(html_file, components="dark-mode,back-to-top")
        result = html_file.read_text()
        assert "/* Component: dark-mode */" in result
        assert "/* Component: back-to-top */" in result

    def test_apply_noop_without_theme_or_components(self, converter, tmp_path):
        html_file = tmp_path / "test.html"
        original = "<html><head></head><body></body></html>"
        html_file.write_text(original)
        converter._apply_theme_and_components(html_file)
        assert html_file.read_text() == original
