#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "PyYAML>=6.0.2",
#   "tiktoken>=0.12.0",
# ]
# ///

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

import tiktoken
import yaml


ROOT = Path(__file__).resolve().parent
DEFAULT_ENCODING = "o200k_base"
START_MARKER = "<!-- BEGIN GENERATED SKILLS TABLE -->"
END_MARKER = "<!-- END GENERATED SKILLS TABLE -->"


@dataclass(frozen=True)
class Skill:
    name: str
    path: Path
    description: str
    body_tokens: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update README.md with skill descriptions and token counts."
    )
    parser.add_argument(
        "--readme",
        type=Path,
        default=ROOT / "README.md",
        help="README file to update.",
    )
    parser.add_argument(
        "--skills-dir",
        type=Path,
        default=ROOT / "skills",
        help="Directory containing */SKILL.md files.",
    )
    parser.add_argument(
        "--encoding",
        default=DEFAULT_ENCODING,
        help="tiktoken encoding name to use for token counts.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit with an error if README.md is not up to date.",
    )
    return parser.parse_args()


def split_skill_file(path: Path) -> tuple[dict[str, object], str]:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    if not text.startswith("---\n"):
        raise ValueError(f"{path} does not start with YAML front matter")

    parts = text.split("---\n", maxsplit=2)
    if len(parts) != 3:
        raise ValueError(f"{path} does not contain closing YAML front matter")

    metadata = yaml.safe_load(parts[1])
    if not isinstance(metadata, dict):
        raise ValueError(f"{path} front matter is not a mapping")

    return metadata, parts[2].lstrip("\n")


def count_tokens(encoding: tiktoken.Encoding, text: str) -> int:
    return len(encoding.encode(text, disallowed_special=()))


def read_skills(skills_dir: Path, encoding: tiktoken.Encoding) -> list[Skill]:
    skill_paths = sorted(skills_dir.glob("*/SKILL.md"))
    if not skill_paths:
        raise ValueError(f"No skill files found in {skills_dir}")

    skills: list[Skill] = []
    for path in skill_paths:
        metadata, body = split_skill_file(path)

        name_value = metadata.get("name")
        description_value = metadata.get("description")
        if not isinstance(name_value, str) or not name_value.strip():
            raise ValueError(f"{path} front matter must contain a non-empty name")
        if not isinstance(description_value, str) or not description_value.strip():
            raise ValueError(f"{path} front matter must contain a non-empty description")

        description = " ".join(description_value.split())
        skills.append(
            Skill(
                name=name_value.strip(),
                path=path,
                description=description,
                body_tokens=count_tokens(encoding, body),
            )
        )

    return sorted(skills, key=lambda skill: skill.name.casefold())


def escape_table_cell(value: str) -> str:
    return value.replace("|", r"\|").replace("\n", " ")


def render_table(skills: list[Skill], readme: Path) -> str:
    rows = [
        "| Skill | Description | Tokens |",
        "|-------|-------------|-------------|",
    ]

    for skill in skills:
        relative_path = skill.path.relative_to(readme.parent).as_posix()
        rows.append(
            "| "
            f"[**{escape_table_cell(skill.name)}**](./{relative_path})"
            " | "
            f"{escape_table_cell(skill.description)}"
            " | "
            f"{skill.body_tokens:,}"
            " |"
        )

    return "\n".join(rows)


def update_readme_content(content: str, table: str) -> str:
    generated_block = f"{START_MARKER}\n{table}\n{END_MARKER}"

    marker_pattern = re.compile(
        rf"{re.escape(START_MARKER)}\n.*?\n{re.escape(END_MARKER)}",
        flags=re.DOTALL,
    )
    if marker_pattern.search(content):
        return marker_pattern.sub(lambda _: generated_block, content, count=1)

    manual_table_pattern = re.compile(r"(## Skills\n\n)(?:\|.*\n)+", flags=re.MULTILINE)
    if manual_table_pattern.search(content):
        return manual_table_pattern.sub(
            lambda match: f"{match.group(1)}{generated_block}\n", content, count=1
        )

    skills_heading = "## Skills\n\n"
    if skills_heading not in content:
        raise ValueError("README.md does not contain a '## Skills' section")

    return content.replace(skills_heading, f"{skills_heading}{generated_block}\n\n", 1)


def main() -> int:
    args = parse_args()
    encoding = tiktoken.get_encoding(args.encoding)
    skills = read_skills(args.skills_dir, encoding)
    table = render_table(skills, args.readme)

    current = args.readme.read_text(encoding="utf-8")
    updated = update_readme_content(current, table)

    if args.check:
        if current != updated:
            print(f"{args.readme} is not up to date. Run {Path(__file__).name}.")
            return 1
        print(f"{args.readme} is up to date.")
        return 0

    if current != updated:
        args.readme.write_text(updated, encoding="utf-8")
        print(f"Updated {args.readme} with {len(skills)} skills.")
    else:
        print(f"{args.readme} is already up to date.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
