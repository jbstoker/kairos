"""Compatibility shim for `traditions.chinese.5_elements`.

Module names may not start with a digit in `import` statements, so the real
implementation lives in `traditions.chinese.five_elements`. Import it from there:

    from traditions.chinese.five_elements import element_for_year

This shim exists so `importlib.import_module("traditions.chinese.5_elements")`
keeps working for anyone who knew the old name.
"""

from traditions.chinese.five_elements import (  # noqa: F401
    CONTROLS,
    ELEMENTS,
    GENERATES,
    controls,
    element_for_month,
    element_for_year,
    generates,
)

