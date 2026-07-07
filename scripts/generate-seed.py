#!/usr/bin/env python3
"""从现有 Mock 数据生成 data/seed.json"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEROES_JS = ROOT / "preview/assets/heroes-data.js"
SEED_OUT = ROOT / "data/seed.json"


def load_heroes() -> dict:
    text = HEROES_JS.read_text(encoding="utf-8")
    payload = re.sub(r"^window\.HEROES_DATA\s*=\s*", "", text.strip()).rstrip(";")
    raw = json.loads(payload)
    heroes = {}
    for hero_id, item in raw.items():
        heroes[hero_id] = {**item, "hero_id": hero_id}
    return heroes


def load_mock_via_node() -> dict:
    script = """
const mock = require('./miniprogram/utils/mock.js');
console.log(JSON.stringify({
  public_recruitments: mock.events,
  my_recruitment_lists: mock.getMyRecruitmentLists(),
  courses: mock.courses.map(c => ({ ...c, course_id: c.id || c.course_id }))
}));
"""
    proc = subprocess.run(
        ["node", "-e", script],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
        raise RuntimeError("无法通过 Node 读取 mock.js，请确认已安装 Node.js")
    return json.loads(proc.stdout)


def main() -> None:
    seed = {
        "heroes": load_heroes(),
        **load_mock_via_node(),
        "app_state": {
            "mock_hero_role": "",
        },
    }
    SEED_OUT.parent.mkdir(parents=True, exist_ok=True)
    SEED_OUT.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ok seed -> {SEED_OUT}")
    print(
        f"  heroes={len(seed['heroes'])} "
        f"public_recruitments={len(seed['public_recruitments'])} "
        f"courses={len(seed['courses'])}"
    )


if __name__ == "__main__":
    main()
