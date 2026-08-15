"""Emit GitHub Actions ``::error::`` annotations from a pytest log file.

Used by ``.github/workflows/ci.yml`` after a test failure so the failure
summary is visible in the job annotations (the full log requires admin
access on the repository). Safe to run locally with any log file.
"""

import sys


def annotate(path):
    """Print one ``::error::`` workflow command per line of the log tail."""
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            lines = fh.readlines()
    except OSError:
        return 0
    for line in lines[-80:]:
        msg = line.rstrip()[:400]
        if not msg.strip():
            continue
        escaped = (
            msg.replace("%", "%25")
            .replace("\r", "%0D")
            .replace("\n", "%0A")
        )
        print(f"::error::{escaped}")
    return 0


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "pytest.log"
    sys.exit(annotate(path))
