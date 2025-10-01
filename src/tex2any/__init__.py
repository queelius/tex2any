"""
tex2any - Convert LaTeX files to various formats using LaTeXML

A wrapper around the beautiful and complicated LaTeXML engine
to make converting .tex files easy and accessible.
"""

from tex2any._version import __version__
from tex2any.converter import TexConverter

__all__ = ['TexConverter', '__version__']