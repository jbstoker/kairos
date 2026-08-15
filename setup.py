"""Packaging for Kairos — natural time system."""

from setuptools import find_packages, setup

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="kairos",
    version="2.0.0",
    description="Kairos — natural time system. Observation-based, offline-first, verifiable.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    license="GPL-3.0-or-later",
    python_requires=">=3.11",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "data": ["traditions/*.json", "observations.json"],
    },
    install_requires=[],
    extras_require={
        "test": ["pytest>=7.0"],
        "web": ["flask>=2.0"],
        "astronomy": ["skyfield>=1.45"],  # optional third noon method
    },
    entry_points={
        "console_scripts": [
            "kairos=core.timekeeper:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: GNU General Public License v3 or later (GPLv3+)",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Other/Nonlisted Topic",
    ],
)
