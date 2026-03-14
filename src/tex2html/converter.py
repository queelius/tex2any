"""Core converter module for tex2html."""

import logging
import subprocess
from pathlib import Path

from tex2html.composer import compose

logger = logging.getLogger(__name__)


class TexConverter:
    """Handles conversion of .tex files to various formats using LaTeXML."""

    SUPPORTED_FORMATS = {
        'html': 'HTML format (default LaTeXML output)',
        'html5': 'HTML5 format with modern features',
        'xhtml': 'XHTML format',
        'xml': 'LaTeXML XML intermediate format',
        'markdown': 'Markdown format (via pandoc)',
        'txt': 'Plain text format',
        'epub': 'EPUB e-book format',
        'json': 'JSON representation',
    }

    def __init__(self, input_file: Path, output_dir: Path | None = None):
        self.input_file = Path(input_file)
        self.output_dir = Path(output_dir) if output_dir else None

        if not self.input_file.exists():
            raise FileNotFoundError(f"Input file not found: {input_file}")

        if self.input_file.suffix != '.tex':
            raise ValueError(f"Input file must be a .tex file, got: {input_file.suffix}")


    _OUTPUT_CONFIGS = {
        'html':     ('html', 'index.html'),
        'html5':    ('html', 'index.html'),
        'xhtml':    ('html', 'index.xhtml'),
        'xml':      ('xml', 'document.xml'),
        'markdown': ('markdown', 'index.md'),
        'txt':      ('txt', 'document.txt'),
        'epub':     ('epub', 'document.epub'),
        'json':     ('json', 'document.json'),
    }

    def _get_output_path(self, format: str) -> Path:
        """Generate output path in format-specific or custom output directory."""
        dir_name, file_name = self._OUTPUT_CONFIGS.get(format, ('output', 'document.html'))
        output_dir = self.output_dir if self.output_dir else self.input_file.parent / dir_name
        output_dir.mkdir(parents=True, exist_ok=True)
        return output_dir / file_name

    # Maps format names to (converter_method_name, is_html_based)
    _FORMAT_DISPATCH = {
        'html':     ('_convert_html_format', True),
        'html5':    ('_convert_html_format', True),
        'xhtml':    ('_convert_html_format', True),
        'xml':      ('_convert_xml', False),
        'markdown': ('_convert_markdown', False),
        'txt':      ('_convert_txt', False),
        'epub':     ('_convert_epub', False),
        'json':     ('_convert_json', False),
    }

    def convert(self, format: str, **kwargs) -> Path:
        """Convert the input file to the specified format."""
        format = format.lower()

        if format not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported format: {format}\n"
                f"Supported formats: {', '.join(self.SUPPORTED_FORMATS.keys())}"
            )

        output_path = self._get_output_path(format)

        method_name, is_html = self._FORMAT_DISPATCH[format]
        method = getattr(self, method_name)
        if is_html:
            method(output_path, format, **kwargs)
        else:
            method(output_path, **kwargs)

        if is_html:
            self._apply_theme_and_components(output_path, **kwargs)

        return output_path

    def _apply_theme_and_components(self, output_path: Path, **kwargs) -> None:
        """Apply theme and components to HTML output."""
        theme = kwargs.get('theme')
        comp_str = kwargs.get('components')
        components_dir = kwargs.get('components_dir')

        if not theme and not comp_str:
            return

        comp_list: list[str] | None = None
        if isinstance(comp_str, str):
            comp_list = [c.strip() for c in comp_str.split(',') if c.strip()]
        elif comp_str:
            comp_list = list(comp_str)

        compose(output_path, theme, comp_list, components_dir)

    def _run_subprocess(
        self, cmd: list[str], tool_name: str, timeout: int = 900,
    ) -> None:
        """Run a subprocess with standard error handling.

        Args:
            cmd: Command and arguments.
            tool_name: Human-readable name for error messages (e.g., 'LaTeXML').
            timeout: Subprocess timeout in seconds.
        """
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, check=True, timeout=timeout,
            )
            if result.stdout:
                logger.debug("%s output:\n%s", tool_name, result.stdout)
        except subprocess.TimeoutExpired as e:
            logger.error("%s timed out after %s seconds", tool_name, e.timeout)
            raise RuntimeError(
                f"{tool_name} conversion timed out after {e.timeout} seconds. "
                "Try simplifying the document or increasing the timeout."
            )
        except subprocess.CalledProcessError as e:
            logger.error("Error during %s conversion: %s", tool_name, e)
            if e.stderr:
                logger.error("%s stderr:\n%s", tool_name, e.stderr)
            raise
        except FileNotFoundError:
            raise RuntimeError(
                f"{tool_name} not found. Please install {tool_name}:\n"
                f"  Ubuntu/Debian: sudo apt-get install {tool_name.lower()}\n"
                f"  macOS: brew install {tool_name.lower()}"
            )

    def _run_latexml(self, output_path: Path, extra_args: list | None = None) -> None:
        """Run latexmlc command with common options."""
        cmd = [
            'latexmlc',
            str(self.input_file),
            '--dest', str(output_path),
            '--timeout=600',
        ]
        if extra_args:
            cmd.extend(extra_args)
        self._run_subprocess(cmd, 'LaTeXML')

    def _convert_html_format(self, output_path: Path, format_name: str, **kwargs) -> None:
        """Convert to an HTML-based format.

        Args:
            output_path: Path to write the output file.
            format_name: LaTeXML format name ('html', 'html5', 'xhtml').
            **kwargs: Additional options (css, no_default_css).
        """
        extra_args = [f'--format={format_name}']

        if kwargs.get('css'):
            extra_args.extend(['--css', kwargs['css']])

        if kwargs.get('no_default_css'):
            extra_args.append('--nodefaultcss')

        self._run_latexml(output_path, extra_args)

    def _convert_xml(self, output_path: Path, **kwargs) -> None:
        """Convert to LaTeXML XML (intermediate format, no post-processing)."""
        cmd = ['latexml', str(self.input_file), '--dest', str(output_path)]
        self._run_subprocess(cmd, 'LaTeXML')

    def _convert_via_pandoc(self, output_path: Path, pandoc_args: list[str], format_name: str) -> None:
        """Convert to a format via HTML and pandoc.

        Args:
            output_path: Path to write the output file.
            pandoc_args: Additional arguments for pandoc (e.g., ['-t', 'plain']).
            format_name: Human-readable format name for error messages.
        """
        temp_html = output_path.with_suffix('.tmp.html')
        try:
            self._convert_html_format(temp_html, 'html')
            cmd = ['pandoc', str(temp_html)] + pandoc_args + ['-o', str(output_path)]
            self._run_subprocess(cmd, 'Pandoc', timeout=300)
        finally:
            temp_html.unlink(missing_ok=True)

    def _convert_markdown(self, output_path: Path, **kwargs) -> None:
        """Convert to Markdown (via HTML and pandoc)."""
        self._convert_via_pandoc(output_path, [], 'Markdown')

    def _convert_txt(self, output_path: Path, **kwargs) -> None:
        """Convert to plain text (via HTML and pandoc)."""
        self._convert_via_pandoc(output_path, ['-t', 'plain'], 'plain text')

    def _convert_epub(self, output_path: Path, **kwargs) -> None:
        """Convert to EPUB e-book format."""
        self._convert_via_pandoc(output_path, [], 'EPUB')

    def _convert_json(self, output_path: Path, **kwargs) -> None:
        """Convert to JSON representation."""
        self._run_latexml(output_path, ['--format=json'])