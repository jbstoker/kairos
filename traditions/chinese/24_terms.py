"""Compatibility shim for `traditions.chinese.24_terms`.

Module names may not start with a digit in `import` statements, so the real
implementation lives in `traditions.chinese.solar_terms`. Import it from there:

    from traditions.chinese.solar_terms import term_for_date

This shim exists so `importlib.import_module("traditions.chinese.24_terms")`
keeps working for anyone who knew the old name.
"""

from traditions.chinese.solar_terms import TERMS, term_for_date, term_index  # noqa: F401

