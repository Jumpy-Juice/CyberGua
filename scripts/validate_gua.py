import json
from pathlib import Path

p = json.loads(Path("src/assets/gua_data.json").read_text(encoding="utf-8"))
assert len(p) == 64, len(p)
for k, v in p.items():
    assert len(v["yaoci"]) == 6, (k, len(v["yaoci"]))
assert "yong" in p["乾为天"] and "yong" in p["坤为地"]
print("OK: 64 gua, 6 yaoci each, qian/kun have yong")
