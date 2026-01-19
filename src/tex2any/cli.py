"""Command-line interface for tex2any."""

import argparse
import logging
import sys
from pathlib import Path

from tex2any import TexConverter, __version__
from tex2any.themes import THEMES
from tex2any.components import COMPONENTS
from tex2any.config import get_config, create_default_config_file
from tex2any.logging import setup_logging


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Convert LaTeX files to various formats using LaTeXML',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Supported formats:
{chr(10).join(f"  {fmt:12s} - {desc}" for fmt, desc in TexConverter.SUPPORTED_FORMATS.items())}

Available themes:
{chr(10).join(f"  {theme:15s} - {desc.description}" for theme, desc in THEMES.items())}

Available components:
{chr(10).join(f"  {comp:15s} - {desc}" for comp, desc in [(k, v.description) for k, v in COMPONENTS.items()])}

Examples:
  %(prog)s document.tex
  %(prog)s document.tex --theme academic
  %(prog)s paper.tex -f markdown
  %(prog)s paper.tex -f html5,markdown,epub
  %(prog)s paper.tex --theme academic --components floating-toc,search
  %(prog)s paper.tex --theme dark --components reading-time,equation-numbers
  %(prog)s paper.tex --theme serif --components floating-toc,sidebar-right,citation-generator

System Dependencies:
  - LaTeXML: Required for all conversions
  - Pandoc: Required for markdown, txt, and epub formats
        """
    )

    parser.add_argument(
        'input',
        type=Path,
        nargs='?',
        help='Input .tex file to convert'
    )

    parser.add_argument(
        '-v', '--version',
        action='version',
        version=f'%(prog)s {__version__}'
    )

    parser.add_argument(
        '-f', '--format',
        default=None,
        help='Output format(s) - single or comma-separated (e.g., "html5" or "html5,markdown,epub"). Default: from config or html5'
    )

    parser.add_argument(
        '-t', '--theme',
        choices=THEMES.keys(),
        help='Use a predefined theme'
    )

    parser.add_argument(
        '-c', '--components',
        type=str,
        help='Comma-separated list of components to include (e.g., "floating-toc,search,header")'
    )

    parser.add_argument(
        '--css',
        type=str,
        help='CSS file to include (for HTML-based formats)'
    )

    parser.add_argument(
        '--no-default-css',
        action='store_true',
        help='Disable LaTeXML default CSS, use only custom CSS'
    )

    parser.add_argument(
        '--list-themes',
        action='store_true',
        help='List all available themes and exit'
    )

    parser.add_argument(
        '--list-components',
        action='store_true',
        help='List all available components and exit'
    )

    parser.add_argument(
        '--list-formats',
        action='store_true',
        help='List all supported formats and exit'
    )

    parser.add_argument(
        '--init-config',
        action='store_true',
        help='Create a default ~/.tex2any.toml configuration file'
    )

    # Configuration overrides
    parser.add_argument(
        '--author-name',
        type=str,
        help='Override author name from config'
    )

    parser.add_argument(
        '--author-email',
        type=str,
        help='Override author email from config'
    )

    parser.add_argument(
        '--copyright-year',
        type=str,
        help='Override copyright year from config'
    )

    parser.add_argument(
        '-o', '--output',
        type=Path,
        help='Output directory (default: creates format-specific subdirectory in input directory)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output (show info messages)'
    )

    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug output (show all messages)'
    )

    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='Suppress all output except errors'
    )

    args = parser.parse_args()

    # Configure logging based on verbosity flags
    if args.debug:
        setup_logging(level=logging.DEBUG)
    elif args.verbose:
        setup_logging(level=logging.INFO)
    elif args.quiet:
        setup_logging(level=logging.ERROR)
    else:
        setup_logging(level=logging.WARNING)

    if args.list_formats:
        print("Supported formats:")
        for fmt, desc in TexConverter.SUPPORTED_FORMATS.items():
            print(f"  {fmt:12s} - {desc}")
        return 0

    if args.list_themes:
        print("Available themes:")
        for theme_name, theme in THEMES.items():
            print(f"  {theme_name:15s} - {theme.description}")
        return 0

    if args.list_components:
        print("Available components:")
        for comp_name, comp in COMPONENTS.items():
            print(f"  {comp_name:15s} - {comp.description}")
            if comp.layout_position:
                print(f"                   (Position: {comp.layout_position})")
        return 0

    if args.init_config:
        create_default_config_file()
        return 0

    if not args.input:
        parser.error("the following arguments are required: input")

    # Apply CLI overrides to config
    config = get_config()
    if args.author_name:
        config.set('author', 'name', args.author_name)
    if args.author_email:
        config.set('author', 'email', args.author_email)
    if args.copyright_year:
        config.set('footer', 'copyright_year', args.copyright_year)

    # Use config defaults if not specified in CLI
    theme = args.theme or config.get('output', 'default_theme')
    components = args.components or ','.join(config.get('output', 'default_components', []))

    # Empty string means no components
    if not components:
        components = None

    # Parse formats (comma-separated)
    if args.format:
        formats = [f.strip() for f in args.format.split(',') if f.strip()]
    else:
        # Use config default_formats or fallback to html5
        default_formats = config.get('output', 'default_formats', ['html5'])
        formats = default_formats if isinstance(default_formats, list) else [default_formats]

    # Validate all formats
    for fmt in formats:
        if fmt not in TexConverter.SUPPORTED_FORMATS:
            print(f"Error: Unsupported format '{fmt}'", file=sys.stderr)
            print(f"Supported formats: {', '.join(TexConverter.SUPPORTED_FORMATS.keys())}", file=sys.stderr)
            return 1

    try:
        converter = TexConverter(args.input, output_dir=args.output)
        output_paths = []

        # Convert to each format
        for fmt in formats:
            output_path = converter.convert(
                fmt,
                theme=theme,
                components=components,
                css=args.css,
                no_default_css=args.no_default_css
            )
            output_paths.append(output_path)

        # Print results
        if len(output_paths) == 1:
            print(f"Successfully converted to: {output_paths[0]}")
        else:
            print(f"Successfully converted to {len(output_paths)} formats:")
            for path in output_paths:
                print(f"  - {path}")
        return 0

    except FileNotFoundError as e:
        print(f"Error: File not found - {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"Error: Invalid value - {e}", file=sys.stderr)
        return 1
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nConversion interrupted.", file=sys.stderr)
        return 130  # Standard exit code for SIGINT
    except OSError as e:
        print(f"Error: System error - {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())