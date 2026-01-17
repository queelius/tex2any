"""Core converter module for tex2any."""

import subprocess
from pathlib import Path
from typing import Optional, List

from tex2any.composer import HTMLComposer
from tex2any.components import get_component
from tex2any.logging import get_logger

logger = get_logger('converter')


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

    def __init__(self, input_file: Path, output_dir: Optional[Path] = None):
        self.input_file = Path(input_file)
        self.output_dir = Path(output_dir) if output_dir else None

        if not self.input_file.exists():
            raise FileNotFoundError(f"Input file not found: {input_file}")

        if not self.input_file.suffix == '.tex':
            raise ValueError(f"Input file must be a .tex file, got: {input_file.suffix}")


    def _get_output_path(self, format: str) -> Path:
        """Generate output path in format-specific directory or custom output directory."""
        # Map format to directory name and filename
        output_configs = {
            'html': ('html', 'index.html'),
            'html5': ('html', 'index.html'),
            'xhtml': ('html', 'index.xhtml'),
            'xml': ('xml', 'document.xml'),
            'markdown': ('markdown', 'index.md'),
            'txt': ('txt', 'document.txt'),
            'epub': ('epub', 'document.epub'),
            'json': ('json', 'document.json'),
        }

        dir_name, file_name = output_configs.get(format, ('output', 'document.html'))

        # Use custom output directory if provided, otherwise use input file's parent
        if self.output_dir:
            output_dir = self.output_dir
        else:
            output_dir = self.input_file.parent / dir_name

        output_dir.mkdir(parents=True, exist_ok=True)

        return output_dir / file_name

    def convert(self, format: str, **kwargs) -> Path:
        """Convert the input file to the specified format."""
        format = format.lower()

        if format not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported format: {format}\n"
                f"Supported formats: {', '.join(self.SUPPORTED_FORMATS.keys())}"
            )

        output_path = self._get_output_path(format)

        # Filter components based on format
        if 'components' in kwargs and kwargs['components']:
            if isinstance(kwargs['components'], str):
                component_list = [c.strip() for c in kwargs['components'].split(',') if c.strip()]
            else:
                component_list = kwargs['components']

            filtered = self._filter_components_for_format(component_list, format)
            kwargs['components'] = ','.join(filtered) if filtered else None

        # Route to appropriate conversion method
        converters = {
            'html': self._convert_html,
            'html5': self._convert_html5,
            'xhtml': self._convert_xhtml,
            'xml': self._convert_xml,
            'markdown': self._convert_markdown,
            'txt': self._convert_txt,
            'epub': self._convert_epub,
            'json': self._convert_json,
        }

        converter = converters[format]
        converter(output_path, **kwargs)

        # Apply theme and components if output is HTML-based
        if format in ['html', 'html5', 'xhtml']:
            self._apply_theme_and_components(output_path, **kwargs)

        return output_path

    def _filter_components_for_format(self, components: Optional[List[str]], format: str) -> Optional[List[str]]:
        """Filter components based on output format."""
        if not components:
            return components

        # For non-HTML formats, filter out HTML-only components using the component's html_only property
        if format not in ['html', 'html5', 'xhtml']:
            filtered = []
            for comp_name in components:
                try:
                    comp = get_component(comp_name)
                    if not comp.html_only:
                        filtered.append(comp_name)
                except ValueError:
                    # Unknown component, skip it
                    pass

            # Replace floating-toc with inline toc for markdown/epub
            if 'floating-toc' in components and format in ['markdown', 'epub']:
                if 'toc' not in filtered:
                    filtered.insert(0, 'toc')

            return filtered if filtered else None

        return components

    def _apply_theme_and_components(self, output_path: Path, **kwargs) -> None:
        """Apply theme and components to HTML output."""
        theme = kwargs.get('theme')
        components = kwargs.get('components')

        if not theme and not components:
            return

        # Parse components if string
        if isinstance(components, str):
            components = [c.strip() for c in components.split(',') if c.strip()]

        # Use composer to apply theme and components
        composer = HTMLComposer(output_path)

        # First inject any structural HTML needed
        if components:
            composer.inject_html_elements(components)

        # Then apply CSS/JS
        composer.apply_theme_and_components(theme, components)

    def _run_latexml(self, output_path: Path, extra_args: list = None) -> None:
        """Run latexmlc command with common options."""
        cmd = [
            'latexmlc',
            str(self.input_file),
            '--dest', str(output_path),
            '--timeout=600',  # 10 minutes timeout
        ]

        if extra_args:
            cmd.extend(extra_args)

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=900  # 15 minutes subprocess timeout
            )

            if result.stdout:
                logger.debug("LaTeXML output:\n%s", result.stdout)

        except subprocess.TimeoutExpired as e:
            logger.error("LaTeXML timed out after %s seconds", e.timeout)
            raise RuntimeError(
                f"LaTeXML conversion timed out after {e.timeout} seconds. "
                "Try simplifying the document or increasing the timeout."
            )
        except subprocess.CalledProcessError as e:
            logger.error("Error during conversion: %s", e)
            if e.stderr:
                logger.error("LaTeXML stderr:\n%s", e.stderr)
            raise
        except FileNotFoundError:
            raise RuntimeError(
                "LaTeXML not found. Please install LaTeXML:\n"
                "  Ubuntu/Debian: sudo apt-get install latexml\n"
                "  macOS: brew install latexml\n"
                "  Or see: https://dlmf.nist.gov/LaTeXML/get.html"
            )

    def _convert_html_format(self, output_path: Path, format_name: str, **kwargs) -> None:
        """Convert to an HTML-based format.

        Args:
            output_path: Path to write the output file.
            format_name: LaTeXML format name ('html', 'html5', 'xhtml').
            **kwargs: Additional options (css, no_default_css).
        """
        extra_args = [f'--format={format_name}']

        # Handle custom CSS (not theme CSS - that's handled by composer)
        if kwargs.get('css'):
            extra_args.extend(['--css', kwargs['css']])

        # Disable default CSS if requested
        if kwargs.get('no_default_css'):
            extra_args.append('--nodefaultcss')

        self._run_latexml(output_path, extra_args)

    def _convert_html(self, output_path: Path, **kwargs) -> None:
        """Convert to standard HTML."""
        self._convert_html_format(output_path, 'html', **kwargs)

    def _convert_html5(self, output_path: Path, **kwargs) -> None:
        """Convert to HTML5."""
        self._convert_html_format(output_path, 'html5', **kwargs)

    def _convert_xhtml(self, output_path: Path, **kwargs) -> None:
        """Convert to XHTML."""
        self._convert_html_format(output_path, 'xhtml', **kwargs)

    def _convert_xml(self, output_path: Path, **kwargs) -> None:
        """Convert to LaTeXML XML (intermediate format)."""
        # For XML, we just use latexml without post-processing
        cmd = ['latexml', str(self.input_file), '--dest', str(output_path)]

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=900)
        except subprocess.TimeoutExpired as e:
            logger.error("latexml timed out after %s seconds", e.timeout)
            raise RuntimeError(
                f"latexml conversion timed out after {e.timeout} seconds."
            )
        except subprocess.CalledProcessError as e:
            logger.error("Error during XML conversion: %s", e)
            if e.stderr:
                logger.error("latexml stderr:\n%s", e.stderr)
            raise
        except FileNotFoundError:
            raise RuntimeError(
                "LaTeXML not found. Please install LaTeXML:\n"
                "  Ubuntu/Debian: sudo apt-get install latexml\n"
                "  macOS: brew install latexml"
            )

    def _convert_via_pandoc(self, output_path: Path, pandoc_args: List[str], format_name: str) -> None:
        """Convert to a format via HTML and pandoc.

        Args:
            output_path: Path to write the output file.
            pandoc_args: Additional arguments for pandoc (e.g., ['-t', 'plain']).
            format_name: Human-readable format name for error messages.
        """
        temp_html = output_path.with_suffix('.tmp.html')
        try:
            # First convert to HTML
            self._convert_html(temp_html)

            # Then use pandoc to convert HTML to target format
            cmd = ['pandoc', str(temp_html)] + pandoc_args + ['-o', str(output_path)]
            subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=300)
        except subprocess.TimeoutExpired as e:
            logger.error("Pandoc timed out after %s seconds", e.timeout)
            raise RuntimeError(
                f"Pandoc conversion to {format_name} timed out after {e.timeout} seconds."
            )
        except FileNotFoundError:
            raise RuntimeError(
                "Pandoc not found. Please install pandoc:\n"
                "  Ubuntu/Debian: sudo apt-get install pandoc\n"
                "  macOS: brew install pandoc"
            )
        except subprocess.CalledProcessError as e:
            logger.error("Error during %s conversion: %s", format_name, e)
            raise
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
        extra_args = ['--format=json']
        self._run_latexml(output_path, extra_args)