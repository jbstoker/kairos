"""Docs test: the wiki companion pages stay wired.

docs/WIKI_HOME.md is the repo's wiki home; companion pages live flat in
docs/ (philosophy.md, GUIDE.md, ...). Pins the Number Sequence page
(docs/NUMBER_SEQUENCE.md) and guards the wiki docs against broken relative
links and section anchors, so a renamed file or heading fails CI instead of
rotting in a rendered doc.
"""

import os
import re
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(REPO_ROOT, "docs")

WIKI_HOME = os.path.join(DOCS, "WIKI_HOME.md")
NUMBER_SEQUENCE = os.path.join(DOCS, "NUMBER_SEQUENCE.md")

_LINK_RE = re.compile(r"\]\(([^)]+)\)")
_HEADING_RE = re.compile(r"^#{1,6}\s+(.*)$", re.M)


def github_slugify(heading):
    """Reproduce GitHub's GFM heading anchor slug: lowercase, strip anything
    that is not a letter, number, space or hyphen, then spaces -> hyphens
    (consecutive hyphens are preserved, e.g. '13 / 28' -> '13--28')."""
    kept = re.sub(r"[^a-z0-9 \-]", "", heading.strip().lower())
    return kept.replace(" ", "-")


def doc_links(path):
    """Yield (file_part, anchor) for every relative markdown link in a doc.
    Same-file anchor-only links are resolved against `path` itself."""
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for target in _LINK_RE.findall(text):
        if "://" in target or target.startswith(("http:", "https:", "mailto:")):
            continue
        file_part, _, anchor = target.partition("#")
        if not file_part:
            file_part = os.path.basename(path)  # e.g. #section within the file
        yield file_part, anchor


class TestWikiDocs(unittest.TestCase):
    def assert_anchor(self, file_part, anchor, source_path):
        target = os.path.normpath(os.path.join(os.path.dirname(source_path),
                                               file_part))
        self.assertTrue(os.path.isfile(target),
                        f"{file_part} linked from {source_path} does not exist")
        if anchor:
            with open(target, encoding="utf-8") as f:
                slugs = {github_slugify(h) for h in _HEADING_RE.findall(f.read())}
            self.assertIn(anchor, slugs,
                          f"#{anchor} not found as a heading in {file_part}")

    def test_number_sequence_page_exists(self):
        self.assertTrue(os.path.isfile(NUMBER_SEQUENCE),
                        "docs/NUMBER_SEQUENCE.md must exist")

    def test_wiki_home_links_the_page(self):
        with open(WIKI_HOME, encoding="utf-8") as f:
            home = f.read()
        self.assertIn("NUMBER_SEQUENCE.md", home)

    def test_number_sequence_pins_the_real_constants(self):
        """The page must agree with the implemented layer (13 x 28 x 13 =
        4732 s/day; 13 x 28 + 1 = 365-day calendar), not drift."""
        with open(NUMBER_SEQUENCE, encoding="utf-8") as f:
            page = f.read()
        for fragment in ("13 × 28 × 13", "4,732", "364", "86,400"):
            self.assertIn(fragment, page, f"missing '{fragment}'")

    def test_related_pages_are_the_real_docs(self):
        with open(NUMBER_SEQUENCE, encoding="utf-8") as f:
            page = f.read()
        for fragment in ("philosophy.md", "GUIDE.md#", "TECHNICAL.md#",
                         "WIKI_HOME.md"):
            self.assertIn(fragment, page, f"missing link '{fragment}'")

    def test_rhythm_section_pins_the_complete_time_definition(self):
        """TECHNICAL.md's 'The Rhythm of Kairos' section must keep the complete
        time definition (7 · 13 · 20 · 26; 26h / 28m / 7s = 5,096 s/day) and
        the corrected Earth-age notation (10¹², never the 1000×-too-large 10¹⁵)."""
        with open(os.path.join(DOCS, "TECHNICAL.md"), encoding="utf-8") as f:
            tech = f.read()
        for fragment in ("7 · 13 · 20 · 26", "26 × 28 × 7 = **5,096",
                         "~17×", "23.21 × 10¹²", "## The Rhythm of Kairos"):
            self.assertIn(fragment, tech, f"missing '{fragment}'")
        self.assertNotIn("23.21 × 10¹⁵", tech,
                         "the Earth-age notation must stay 10¹² (trillion)")

    def test_rhythm_section_anchor_survives(self):
        """The section heading is unchanged, so TECHNICAL.md's table of
        contents anchor (#the-rhythm-of-kairos) keeps working."""
        with open(os.path.join(DOCS, "TECHNICAL.md"), encoding="utf-8") as f:
            tech = f.read()
        self.assertIn("## The Rhythm of Kairos", tech)
        self.assertIn("- [The Rhythm of Kairos](#the-rhythm-of-kairos)", tech)

    def test_rhythm_heading_levels_stay_under_h2(self):
        """sync_wiki.py splits sections on '^## ', so every subsection of The
        Rhythm of Kairos must be ###/#### — a raw ## would be dropped from the
        generated wiki page."""
        with open(os.path.join(DOCS, "TECHNICAL.md"), encoding="utf-8") as f:
            lines = f.read().splitlines()
        in_section = False
        for line in lines:
            if line.startswith("## The Rhythm of Kairos"):
                in_section = True
                continue
            if in_section and line.startswith("## "):
                break
            if in_section:
                self.assertFalse(line.startswith("## "),
                                 f"subsection must be ###/####: {line}")

    def test_wiki_home_and_number_sequence_links_resolve(self):
        for path in (WIKI_HOME, NUMBER_SEQUENCE):
            for file_part, anchor in doc_links(path):
                self.assert_anchor(file_part, anchor, path)


if __name__ == "__main__":
    unittest.main()
