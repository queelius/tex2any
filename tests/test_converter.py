"""Tests for the converter module."""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import subprocess
import tempfile
import os

from tex2any.converter import TexConverter


class TestTexConverterInit:
    """Tests for TexConverter initialization."""

    def test_init_with_valid_tex_file(self, tmp_path):
        """TexConverter should accept a valid .tex file."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}\\begin{document}Hello\\end{document}")

        converter = TexConverter(tex_file)
        assert converter.input_file == tex_file

    def test_init_with_nonexistent_file(self, tmp_path):
        """TexConverter should raise FileNotFoundError for missing files."""
        with pytest.raises(FileNotFoundError, match="Input file not found"):
            TexConverter(tmp_path / "nonexistent.tex")

    def test_init_with_wrong_extension(self, tmp_path):
        """TexConverter should raise ValueError for non-.tex files."""
        txt_file = tmp_path / "test.txt"
        txt_file.write_text("Hello")

        with pytest.raises(ValueError, match="must be a .tex file"):
            TexConverter(txt_file)

    def test_init_with_output_dir(self, tmp_path):
        """TexConverter should accept an output directory."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        output_dir = tmp_path / "output"

        converter = TexConverter(tex_file, output_dir=output_dir)
        assert converter.output_dir == output_dir


class TestTexConverterFormats:
    """Tests for format handling."""

    @pytest.fixture
    def converter(self, tmp_path):
        """Create a converter with a test .tex file."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}\\begin{document}Hello\\end{document}")
        return TexConverter(tex_file)

    def test_supported_formats(self, converter):
        """SUPPORTED_FORMATS should contain expected formats."""
        expected = {'html', 'html5', 'xhtml', 'xml', 'markdown', 'txt', 'epub', 'json'}
        assert set(converter.SUPPORTED_FORMATS.keys()) == expected

    def test_convert_with_invalid_format(self, converter):
        """convert() should raise ValueError for unsupported formats."""
        with pytest.raises(ValueError, match="Unsupported format"):
            converter.convert("pdf")


class TestOutputPathGeneration:
    """Tests for output path generation."""

    @pytest.fixture
    def converter(self, tmp_path):
        """Create a converter with a test .tex file."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        return TexConverter(tex_file)

    def test_html_output_path(self, converter):
        """HTML format should generate path to html/index.html."""
        path = converter._get_output_path('html')
        assert path.name == 'index.html'
        assert 'html' in str(path.parent)

    def test_markdown_output_path(self, converter):
        """Markdown format should generate path to markdown/index.md."""
        path = converter._get_output_path('markdown')
        assert path.name == 'index.md'
        assert 'markdown' in str(path.parent)

    def test_xml_output_path(self, converter):
        """XML format should generate path to xml/document.xml."""
        path = converter._get_output_path('xml')
        assert path.name == 'document.xml'
        assert 'xml' in str(path.parent)

    def test_custom_output_dir(self, tmp_path):
        """Custom output directory should be used when specified."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        output_dir = tmp_path / "custom_output"

        converter = TexConverter(tex_file, output_dir=output_dir)
        path = converter._get_output_path('html')

        assert path.parent == output_dir


class TestComponentFiltering:
    """Tests for component filtering based on format."""

    @pytest.fixture
    def converter(self, tmp_path):
        """Create a converter with a test .tex file."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}")
        return TexConverter(tex_file)

    def test_filter_returns_none_for_empty_list(self, converter):
        """_filter_components_for_format should return None for empty input."""
        assert converter._filter_components_for_format(None, 'html') is None
        assert converter._filter_components_for_format([], 'html') == []

    def test_filter_keeps_all_for_html(self, converter):
        """All components should be kept for HTML formats."""
        components = ['toc', 'floating-toc', 'search']

        for fmt in ['html', 'html5', 'xhtml']:
            result = converter._filter_components_for_format(components, fmt)
            assert result == components

    def test_filter_removes_html_only_for_markdown(self, converter):
        """HTML-only components should be filtered for markdown."""
        components = ['toc', 'floating-toc', 'search']
        result = converter._filter_components_for_format(components, 'markdown')

        # floating-toc and search are html_only=True, toc is html_only=False
        # floating-toc should be replaced with toc
        assert 'toc' in result
        assert 'floating-toc' not in result
        assert 'search' not in result

    def test_filter_replaces_floating_toc_with_toc(self, converter):
        """floating-toc should be replaced with toc for markdown/epub."""
        components = ['floating-toc']
        result = converter._filter_components_for_format(components, 'markdown')

        assert 'toc' in result
        assert 'floating-toc' not in result

    def test_filter_does_not_duplicate_toc(self, converter):
        """If toc already present, don't add it again when replacing floating-toc."""
        components = ['toc', 'floating-toc']
        result = converter._filter_components_for_format(components, 'markdown')

        assert result.count('toc') == 1


class TestSubprocessHandling:
    """Tests for subprocess error handling."""

    @pytest.fixture
    def converter(self, tmp_path):
        """Create a converter with a test .tex file."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}\\begin{document}Hello\\end{document}")
        return TexConverter(tex_file)

    def test_run_latexml_timeout_handling(self, converter):
        """_run_latexml should handle TimeoutExpired gracefully."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired(cmd=['latexmlc'], timeout=900)

            with pytest.raises(RuntimeError, match="timed out"):
                converter._run_latexml(Path('/tmp/output.html'))

    def test_run_latexml_not_found(self, converter):
        """_run_latexml should provide helpful error when LaTeXML not found."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = FileNotFoundError()

            with pytest.raises(RuntimeError, match="LaTeXML not found"):
                converter._run_latexml(Path('/tmp/output.html'))

    def test_convert_xml_timeout_handling(self, converter, tmp_path):
        """_convert_xml should handle TimeoutExpired gracefully."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired(cmd=['latexml'], timeout=900)

            with pytest.raises(RuntimeError, match="timed out"):
                converter._convert_xml(tmp_path / "output.xml")

    def test_convert_via_pandoc_timeout_handling(self, converter, tmp_path):
        """_convert_via_pandoc should handle TimeoutExpired gracefully."""
        # First call for HTML conversion, second for pandoc
        def side_effect(*args, **kwargs):
            if 'pandoc' in args[0]:
                raise subprocess.TimeoutExpired(cmd=['pandoc'], timeout=300)
            return MagicMock(stdout='', stderr='')

        with patch('subprocess.run', side_effect=side_effect):
            with pytest.raises(RuntimeError, match="Pandoc.*timed out"):
                converter._convert_via_pandoc(tmp_path / "output.md", [], 'Markdown')

    def test_convert_via_pandoc_not_found(self, converter, tmp_path):
        """_convert_via_pandoc should provide helpful error when Pandoc not found."""
        def side_effect(*args, **kwargs):
            if 'pandoc' in args[0]:
                raise FileNotFoundError()
            return MagicMock(stdout='', stderr='')

        with patch('subprocess.run', side_effect=side_effect):
            with pytest.raises(RuntimeError, match="Pandoc not found"):
                converter._convert_via_pandoc(tmp_path / "output.md", [], 'Markdown')


class TestTempFileCleanup:
    """Tests for temporary file cleanup."""

    @pytest.fixture
    def converter(self, tmp_path):
        """Create a converter with a test .tex file."""
        tex_file = tmp_path / "test.tex"
        tex_file.write_text("\\documentclass{article}\\begin{document}Hello\\end{document}")
        return TexConverter(tex_file)

    def test_temp_file_cleaned_on_success(self, converter, tmp_path):
        """Temporary HTML file should be cleaned up on successful conversion."""
        output_path = tmp_path / "output.md"
        temp_html = output_path.with_suffix('.tmp.html')

        with patch('subprocess.run', return_value=MagicMock(stdout='', stderr='')):
            with patch.object(converter, '_convert_html', return_value=None):
                # Create the temp file to simulate _convert_html creating it
                temp_html.write_text("<html></html>")

                try:
                    converter._convert_via_pandoc(output_path, [], 'Markdown')
                except:
                    pass

                # Temp file should be cleaned up
                assert not temp_html.exists()

    def test_temp_file_cleaned_on_error(self, converter, tmp_path):
        """Temporary HTML file should be cleaned up even on error."""
        output_path = tmp_path / "output.md"
        temp_html = output_path.with_suffix('.tmp.html')

        def side_effect(*args, **kwargs):
            if 'pandoc' in args[0]:
                raise subprocess.CalledProcessError(1, 'pandoc')
            # Simulate creating the temp file
            temp_html.write_text("<html></html>")
            return MagicMock(stdout='', stderr='')

        with patch('subprocess.run', side_effect=side_effect):
            with pytest.raises(subprocess.CalledProcessError):
                converter._convert_via_pandoc(output_path, [], 'Markdown')

            # Temp file should be cleaned up even after error
            assert not temp_html.exists()
