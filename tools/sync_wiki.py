#!/usr/bin/env python3
"""Generate the GitHub Wiki from the README.

The GitHub Wiki (https://github.com/<owner>/<repo>/wiki) is itself a git
repository. Clone it once, run this script to (re)generate the pages, then
commit and push:

    git clone git@github.com:jbstoker/kairos.wiki.git
    python tools/sync_wiki.py kairos.wiki
    cd kairos.wiki && git add . && git commit -m "Update wiki" && git push

Re-running regenerates every page from README.md, so the wiki always
mirrors the README exactly.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
README = os.path.join(ROOT, "README.md")
# The detailed technical sections live here now (they used to be the README
# body); the wiki merges them in so no page is lost.
TECHNICAL = os.path.join(ROOT, "docs", "TECHNICAL.md")

# README section title -> wiki page. Sections with the same page are merged.
PAGE_MAP = [
    ("Overview", "Home"),
    ("Features", "Home"),
    ("Philosophy", "Home"),
    ("The Rhythm of Kairos", "The-Rhythm-of-Kairos"),
    ("Installation", "Getting-Started"),
    ("Quickstart", "Getting-Started"),
    ("The Kairos calendar", "Kairos-Calendar"),
    ("Traditions", "Traditions"),
    ("Modules", "Modules"),
    ("CLI", "Getting-Started"),
    ("Hardware", "Hardware"),
    ("The celestial engine (KST)", "Celestial-Engine"),
    ("Precession checksum & self-check", "Precession-Checksum"),
    ("The web app", "Web-App"),
    ("Time calculation & the Kepler second", "Time-Calculation"),
    ("Data & file formats", "Data-and-Formats"),
    ("API reference", "API-Reference"),
    ("Configuration", "Configuration"),
    ("Join the Community", "Community"),
    ("The Mathematics of Kairos", "Mathematics"),
    ("Extending Kairos", "Extending-Kairos"),
    ("Project structure", "Project-Structure"),
    ("FAQ", "FAQ"),
    ("Tests", "Testing"),
    ("License", "License"),
]

# Sidebar / home-browse order: (display name, page file).
WIKI_PAGES = [
    ("Home", "Home"),
    ("The Rhythm of Kairos", "The-Rhythm-of-Kairos"),
    ("Getting Started", "Getting-Started"),
    ("The Kairos Calendar", "Kairos-Calendar"),
    ("Traditions", "Traditions"),
    ("Modules", "Modules"),
    ("Celestial Engine (KST)", "Celestial-Engine"),
    ("Precession Checksum", "Precession-Checksum"),
    ("Web App", "Web-App"),
    ("Time Calculation", "Time-Calculation"),
    ("Hardware", "Hardware"),
    ("Community", "Community"),
    ("Data & Formats", "Data-and-Formats"),
    ("API Reference", "API-Reference"),
    ("Configuration", "Configuration"),
    ("Mathematics", "Mathematics"),
    ("Extending Kairos", "Extending-Kairos"),
    ("Project Structure", "Project-Structure"),
    ("FAQ", "FAQ"),
    ("Testing", "Testing"),
    ("License", "License"),
]


def split_sections(text):
    """Return (intro_lines, [(section_title, content_lines)])."""
    intro, sections, current = [], [], None
    for line in text.splitlines():
        m = re.match(r"^## (.*)$", line)
        if m:
            current = (m.group(1).strip(), [line])
            sections.append(current)
        elif current is not None:
            current[1].append(line)
        else:
            intro.append(line)
    return intro, sections


def build_pages(intro, sections):
    by_title = {title: content for title, content in sections}
    pages, order = {}, []
    for title, page in PAGE_MAP:
        content = by_title.get(title)
        if content is None:
            continue
        if page not in pages:
            pages[page] = []
            order.append(page)
        pages[page].extend(content)

    browse = ["", "## Browse the wiki", ""]
    browse += [f"- **[{name}]({page})**" for name, page in WIKI_PAGES]
    pages["Home"] = intro + [""] + pages.get("Home", []) + browse
    return pages, order


def render_sidebar():
    lines = ["## Kairos"]
    lines += [f"- [{name}]({page})" for name, page in WIKI_PAGES]
    return "\n".join(lines) + "\n"


def render_footer():
    return ("---\n*Kairos — time you observe, not time you obey. "
            "GPLv3 · [github.com/jbstoker/kairos](https://github.com/jbstoker/kairos)*\n")


def main():
    wiki_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(ROOT), "kairos.wiki")
    if not os.path.isdir(wiki_dir):
        sys.exit(
            f"wiki directory not found: {wiki_dir}\n"
            "Clone it first (open the repo's Wiki tab once, then):\n"
            "  git clone git@github.com:jbstoker/kairos.wiki.git")

    with open(README, encoding="utf-8") as f:
        text = f.read()
    intro, sections = split_sections(text)

    # Merge the technical-reference sections (the former README body) so the
    # wiki keeps every page; README sections win on title clashes.
    if os.path.exists(TECHNICAL):
        with open(TECHNICAL, encoding="utf-8") as f:
            _, tech_sections = split_sections(f.read())
        readme_titles = {title for title, _ in sections}
        sections += [(t, c) for t, c in tech_sections if t not in readme_titles]
    pages, order = build_pages(intro, sections)

    for page in order:
        path = os.path.join(wiki_dir, f"{page}.md")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write("\n".join(pages[page]).rstrip() + "\n")
    for name, text_fn in (("_Sidebar.md", render_sidebar),
                          ("_Footer.md", render_footer)):
        with open(os.path.join(wiki_dir, name), "w", encoding="utf-8", newline="\n") as f:
            f.write(text_fn())

    print(f"Wrote {len(order)} pages + sidebar/footer to {wiki_dir}")
    print("Commit & push:  cd <wiki> && git add . && git commit -m 'Update wiki' && git push")


if __name__ == "__main__":
    main()
