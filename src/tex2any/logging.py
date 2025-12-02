"""Logging configuration for tex2any."""

import logging
import sys
from typing import Optional

# Package-level logger
logger = logging.getLogger('tex2any')


def setup_logging(
    level: int = logging.WARNING,
    format_string: Optional[str] = None
) -> None:
    """Configure logging for tex2any.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_string: Custom format string, or None for default
    """
    if format_string is None:
        # Simple format for CLI usage
        format_string = '%(levelname)s: %(message)s'

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(format_string))

    logger.handlers.clear()
    logger.addHandler(handler)
    logger.setLevel(level)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a logger for a submodule.

    Args:
        name: Submodule name (e.g., 'converter'). If None, returns package logger.

    Returns:
        Logger instance.
    """
    if name:
        return logging.getLogger(f'tex2any.{name}')
    return logger


# Set up default logging (warnings and above)
setup_logging()
