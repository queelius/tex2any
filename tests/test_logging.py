"""Tests for the logging system."""

import logging
import pytest
from tex2any.logging import setup_logging, get_logger, logger


class TestLogging:
    """Tests for logging configuration."""

    def test_get_logger_returns_logger(self):
        """get_logger() should return a Logger instance."""
        log = get_logger('test')
        assert isinstance(log, logging.Logger)
        assert log.name == 'tex2any.test'

    def test_get_logger_no_name_returns_package_logger(self):
        """get_logger() with no name returns the package logger."""
        log = get_logger()
        assert log.name == 'tex2any'

    def test_setup_logging_sets_level(self):
        """setup_logging() should set the logging level."""
        setup_logging(level=logging.DEBUG)
        assert logger.level == logging.DEBUG

        setup_logging(level=logging.WARNING)
        assert logger.level == logging.WARNING

    def test_package_logger_exists(self):
        """The package logger should exist and be configured."""
        assert logger is not None
        assert logger.name == 'tex2any'
