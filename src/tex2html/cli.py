"""Command-line interface for tex2html."""

import argparse
import sys
from pathlib import Path

from tex2html import TexConverter, __version__
from tex2html.themes import THEMES
from tex2html import components


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Convert LaTeX files to HTML using LaTeXML',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s document.tex
  %(prog)s document.tex --theme academic
  %(prog)s paper.tex -c dark-mode,floating-toc
  %(prog)s paper.tex --theme academic -c dark-mode,floating-toc,back-to-top
  %(prog)s paper.tex --list-components
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
        default='html5',
        help='Output format (default: html5)'
    )

    parser.add_argument(
        '-t', '--theme',
        choices=list(THEMES.keys()),
        help='Theme to apply'
    )

    parser.add_argument(
        '-c', '--components',
        type=str,
        help='Comma-separated list of components (e.g., "dark-mode,floating-toc")'
    )

    parser.add_argument(
        '--components-dir',
        type=Path,
        help='Extra directory to search for components (shadows built-ins)'
    )

    parser.add_argument(
        '--css',
        type=str,
        help='Additional CSS file to include'
    )

    parser.add_argument(
        '--no-default-css',
        action='store_true',
        help='Disable LaTeXML default CSS'
    )

    parser.add_argument(
        '--list-themes',
        action='store_true',
        help='List available themes and exit'
    )

    parser.add_argument(
        '--list-components',
        action='store_true',
        help='List available components and exit'
    )

    parser.add_argument(
        '-o', '--output',
        type=Path,
        help='Output directory'
    )

    args = parser.parse_args()

    if args.list_themes:
        print("Available themes:")
        for name, theme in THEMES.items():
            print(f"  {name:15s} - {theme.description}")
        return 0

    if args.list_components:
        extra = args.components_dir
        names = components.available(extra)
        print("Available components:")
        for name in names:
            print(f"  {name}")
        return 0

    if not args.input:
        parser.error("the following arguments are required: input")

    # Validate components exist before starting conversion
    if args.components:
        extra = args.components_dir
        comp_names = [c.strip() for c in args.components.split(',') if c.strip()]
        avail = set(components.available(extra))
        unknown = [c for c in comp_names if c not in avail]
        if unknown:
            print(f"Error: Unknown component(s): {', '.join(unknown)}", file=sys.stderr)
            print(f"Available: {', '.join(sorted(avail))}", file=sys.stderr)
            return 1

    try:
        converter = TexConverter(args.input, output_dir=args.output)
        output_path = converter.convert(
            args.format,
            theme=args.theme,
            components=args.components,
            components_dir=args.components_dir,
            css=args.css,
            no_default_css=args.no_default_css,
        )
        print(f"Successfully converted to: {output_path}")
        return 0

    except (FileNotFoundError, ValueError, RuntimeError) as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nConversion interrupted.", file=sys.stderr)
        return 130


if __name__ == '__main__':
    sys.exit(main())
