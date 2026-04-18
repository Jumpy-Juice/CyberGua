# -*- coding: utf-8 -*-
"""Parse 易经今译.txt (GBK) and emit gua_data.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "易经今译.txt"
OUT = ROOT / "src" / "assets" / "gua_data.json"

ORDER = [
    ("乾", "乾为天"),
    ("坤", "坤为地"),
    ("屯", "水雷屯"),
    ("蒙", "山水蒙"),
    ("需", "水天需"),
    ("讼", "天水讼"),
    ("师", "地水师"),
    ("比", "水地比"),
    ("小畜", "风天小畜"),
    ("履", "天泽履"),
    ("泰", "地天泰"),
    ("否", "天地否"),
    ("同人", "天火同人"),
    ("大有", "火天大有"),
    ("谦", "地山谦"),
    ("豫", "雷地豫"),
    ("随", "泽雷随"),
    ("蛊", "山风蛊"),
    ("临", "地泽临"),
    ("观", "风地观"),
    ("噬嗑", "火雷噬嗑"),
    ("贲", "山火贲"),
    ("剥", "山地剥"),
    ("复", "地雷复"),
    ("无妄", "天雷无妄"),
    ("大畜", "山天大畜"),
    ("颐", "山雷颐"),
    ("大过", "泽风大过"),
    ("习坎", "坎为水"),
    ("离", "离为火"),
    ("咸", "泽山咸"),
    ("恒", "雷风恒"),
    ("遯", "天山遯"),
    ("大壮", "雷天大壮"),
    ("晋", "火地晋"),
    ("明夷", "地火明夷"),
    ("家人", "风火家人"),
    ("睽", "火泽睽"),
    ("蹇", "水山蹇"),
    ("解", "雷水解"),
    ("损", "山泽损"),
    ("益", "风雷益"),
    ("夬", "泽天夬"),
    ("姤", "天风姤"),
    ("萃", "泽地萃"),
    ("升", "地风升"),
    ("困", "泽水困"),
    ("井", "水风井"),
    ("革", "泽火革"),
    ("鼎", "火风鼎"),
    ("震", "震为雷"),
    ("艮", "艮为山"),
    ("渐", "风山渐"),
    ("归妹", "雷泽归妹"),
    ("丰", "雷火丰"),
    ("旅", "火山旅"),
    ("巽", "巽为风"),
    ("兑", "兑为泽"),
    ("涣", "风水涣"),
    ("节", "水泽节"),
    ("中孚", "风泽中孚"),
    ("小过", "雷山小过"),
    ("既济", "水火既济"),
    ("未济", "火水未济"),
]


def is_footnote_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if re.match(r"^\d+\s+", s):
        return True
    if re.match(r"^\d+\s*《", s):
        return True
    if s.startswith("（") and "页" in s:
        return True
    return False


def strip_inline_fn(text: str) -> str:
    t = text.replace("〖", "").replace("〗", "")
    t = re.sub(r"(\d{1,3})([，。；：、])", r"\2", t)
    t = re.sub(r"([\u4e00-\u9fff])\d{1,3}(\s*[，。；、])", r"\1\2", t)
    t = re.sub(r"([\u4e00-\u9fff])\d{1,3}([\u4e00-\u9fff])", r"\1\2", t)
    t = re.sub(r"^([\u4e00-\u9fff《【】]+)\d{1,3}(。)", r"\1\2", t)
    # 句末脚注：其血玄黄。12 或 ……12
    t = re.sub(r"([。．])\d{1,3}\s*$", r"\1", t)
    t = re.sub(r"([\u4e00-\u9fff])\d{1,3}\s*$", r"\1", t)
    t = re.sub(r"[ \t]+", " ", t).strip()
    t = re.sub(r"，\s*。", "。", t)
    t = re.sub(r"。\s*。", "。", t)
    # 随九四「以42 明」类脚注
    t = re.sub(r"以(\d{1,3})\s+明", "以明", t)
    return t


def finalize_yao_text(tc: str) -> str:
    """句末标点：避免「有功，。」类重复标点。"""
    tc = strip_inline_fn(tc)
    tc = tc.rstrip("，、； ")
    if not tc.endswith(("。", "．")):
        tc += "。"
    tc = re.sub(r"，\s*。", "。", tc)
    return tc


def split_yao_rest_classical_vernacular(rest: str) -> tuple[str, str]:
    """When 原文与白话译注在同一行，在「今译」起笔处断开（避免把仍属文言的续句当成白话）。"""
    r = strip_inline_fn(rest)
    if not r:
        return "", ""
    # 优先：白话常见起句（地雷复上六等：文言止于「克征。」之后才是今译）
    vernacular_hints = (
        "迷路而返",
        "关押他们",
        "东方的角",
        "（九月",
        "（三月",
        "（四月",
        "（八月",
        "（夏至",
        "（十月",
    )
    for hint in vernacular_hints:
        pos = r.find(hint)
        if pos <= 0:
            continue
        left = r[:pos]
        dot = left.rfind("。")
        if dot > 4:
            before = r[: dot + 1].strip()
            after = r[dot + 1 :].strip()
            if after.startswith(hint) or hint in after[:40]:
                return before, after
    for i in range(len(r) - 1):
        if r[i] in "。．" and i > 4:
            after = r[i + 1 :].strip()
            if len(after) >= 10 and re.match(r"^[\u4e00-\u9fff（《]", after):
                # 仍为文言续句的不切分
                if re.match(
                    r"^(用行师|以其国|至于|终有|或|若|盖|夫|故|是以)",
                    after[:6],
                ):
                    continue
                before = r[: i + 1].strip()
                return before, after
    return r, ""


YAO_HEADER = re.compile(
    r"^\s*(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六)[。．，、]\s*(.*)$"
)
YONG_HEADER = re.compile(r"^\s*用\d*([九六])[。．]\s*(.*)$")


def is_yao_or_yong_line(line: str) -> bool:
    return bool(YAO_HEADER.match(line) or YONG_HEADER.match(line))


def normalize_guaci_line(short: str, line: str) -> str:
    s = strip_inline_fn(line)
    for br in ("【履】", "【同人】", "【艮】"):
        s = s.replace(br, "")
    if short == "习坎":
        s = s.replace("习坎", "坎")
    s = s.strip()
    # Split merged 恒...初六
    m = re.search(r"(初六|初九|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六)[。．]", s)
    if m and s.index(m.group(0)) > 3:
        s = s[: s.index(m.group(0))].rstrip("。") + "。"
    if short == "否" or s.startswith("否之匪人"):
        inner = s.rstrip("。")
        return f"【原文】否：{inner}。"
    if s.startswith(short):
        rest = s[len(short) :].lstrip("。． \t")
        inner = rest.rstrip("。")
        return f"【原文】{short}：{inner}。"
    inner = s.rstrip("。")
    return f"【原文】{short}：{inner}。"


def split_merged_gua_yao(line: str) -> tuple[str, str | None]:
    """If 卦辞 and first 爻 share one line, split (含 61初六 等脚注数字紧贴爻名)."""
    s = line.strip()
    # 恒…61初六。浚恒…
    m = re.search(
        r"(\d{1,4})(初六|初九|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六)[。．，、](.*)$",
        s,
    )
    if m:
        head = s[: m.start()].rstrip()
        yao_name = m.group(2)
        yao_rest = m.group(3)
        if len(head) > 2 and yao_rest is not None:
            return head, f"{yao_name}。{yao_rest}"
    m = re.search(
        r"([\d\u4e00-\u9fff《》【】、，；：\s]+?[。．])\s*(初六|初九|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六)[。．](.*)$",
        s,
    )
    if not m:
        return line, None
    gua_part = m.group(1).rstrip()
    yao_name = m.group(2)
    yao_rest = m.group(3)
    return gua_part, f"{yao_name}。{yao_rest}"


def preprocess_lines(seg: list[str]) -> list[str]:
    """Expand lines where 卦辞+初爻 merged."""
    out: list[str] = []
    for ln in seg:
        a, b = split_merged_gua_yao(ln)
        if b is not None:
            out.append(a)
            out.append(b)
        else:
            out.append(ln)
    return out


def split_guaci_trans(seg: list[str], short: str) -> tuple[str, str]:
    seg = [x for x in preprocess_lines(seg) if not is_footnote_line(x)]
    if not seg:
        return "", ""
    guaci_line = seg[0].strip()
    # remove short prefix from translation merge
    i = 1
    trans_parts: list[str] = []
    while i < len(seg):
        ln = seg[i]
        if is_yao_or_yong_line(ln):
            break
        trans_parts.append(ln.strip())
        i += 1
    return guaci_line, "".join(trans_parts).strip()


def parse_yaoci_block(seg: list[str]) -> tuple[list[dict], dict | None]:
    seg = preprocess_lines(seg)
    seg = [ln for ln in seg if not is_footnote_line(ln)]
    yaoci: list[dict] = []
    yong: dict | None = None
    i = 0
    # skip guaci + its translation until first yao
    while i < len(seg):
        if is_yao_or_yong_line(seg[i]):
            break
        i += 1
    while i < len(seg):
        ln = seg[i]
        ym = YONG_HEADER.match(ln)
        if ym:
            name = "用" + ym.group(1)
            rest = ym.group(2).strip()
            trans: list[str] = []
            i += 1
            cl, vn = split_yao_rest_classical_vernacular(rest)
            if vn:
                trans.append(vn)
            while i < len(seg) and not is_yao_or_yong_line(seg[i]):
                trans.append(seg[i].strip())
                i += 1
            tc = finalize_yao_text(cl)
            yong = {
                "name": name,
                "text": f"【原文】{tc}",
                "trans": f"【译文】{''.join(trans).strip()}",
            }
            continue
        m = YAO_HEADER.match(ln)
        if not m:
            i += 1
            continue
        name = m.group(1)
        rest = m.group(2).strip()
        trans = []
        i += 1
        cl, vn = split_yao_rest_classical_vernacular(rest)
        if vn:
            trans.append(vn)
        while i < len(seg) and not is_yao_or_yong_line(seg[i]):
            trans.append(seg[i].strip())
            i += 1
        tc = finalize_yao_text(cl)
        entry = {
            "name": name,
            "text": f"【原文】{tc}",
            "trans": f"【译文】{''.join(trans).strip()}",
        }
        if name in ("用九", "用六"):
            yong = entry
        else:
            yaoci.append(entry)
    return yaoci, yong


def header_match_line(short: str, line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if short == "否":
        return s.startswith("否之匪人")
    if short == "同人":
        return s.startswith("同人")
    if short == "履":
        return bool(re.match(r"^履\d*\。", s)) or s.startswith("履")
    if short == "艮":
        return s.startswith("艮")
    if short == "井":
        return bool(re.match(r"^井。", s))
    if short == "贲":
        return s.startswith("贲")
    # optional digits and optional spaces before 。
    return bool(re.match(rf"^{re.escape(short)}\d*\s*[。．]", s))


def find_header_lines(lines: list[str]) -> list[int]:
    """Return line index for each hexagram in ORDER."""
    indices: list[int] = []
    start_search = 0
    for short, _full in ORDER:
        found = None
        for j in range(start_search, len(lines)):
            if header_match_line(short, lines[j]):
                found = j
                break
        if found is None:
            raise RuntimeError(f"header not found: {short}")
        indices.append(found)
        start_search = found + 1
    return indices


def main() -> None:
    raw = SRC.read_text(encoding="gbk", errors="replace")
    lines = raw.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    starts = find_header_lines(lines)
    out: dict = {}

    for i, ((short, full), start) in enumerate(zip(ORDER, starts, strict=True)):
        end = starts[i + 1] if i + 1 < len(starts) else len(lines)
        seg = lines[start:end]

        guaci_line, trans_only = split_guaci_trans(seg, short)
        guaci_norm = normalize_guaci_line(short, guaci_line)
        guaci_trans = f"【译文】{trans_only}" if trans_only else "【译文】"

        yaoci, yong = parse_yaoci_block(seg)

        entry: dict = {
            "guaci": guaci_norm,
            "guaci_trans": guaci_trans,
            "yaoci": yaoci,
        }
        if yong is not None:
            entry["yong"] = yong
        out[full] = entry

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(out, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("Wrote", OUT, "keys:", len(out))


if __name__ == "__main__":
    main()
