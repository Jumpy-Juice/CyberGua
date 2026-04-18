# -*- coding: utf-8 -*-
"""对照 GBK 原文重新解析，与 gua_data.json 比对，确认提取完整、文件未过期。"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_extractor():
    spec = importlib.util.spec_from_file_location(
        "extract_yijing_json", ROOT / "scripts" / "extract_yijing_json.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def build_expected(ey, lines: list[str]) -> dict:
    starts = ey.find_header_lines(lines)
    out: dict = {}
    for i, ((short, full), start) in enumerate(zip(ey.ORDER, starts, strict=True)):
        end = starts[i + 1] if i + 1 < len(starts) else len(lines)
        seg = lines[start:end]
        guaci_line, trans_only = ey.split_guaci_trans(seg, short)
        guaci_norm = ey.normalize_guaci_line(short, guaci_line)
        guaci_trans = f"【译文】{trans_only}" if trans_only else "【译文】"
        yaoci, yong = ey.parse_yaoci_block(seg)
        entry: dict = {
            "guaci": guaci_norm,
            "guaci_trans": guaci_trans,
            "yaoci": yaoci,
        }
        if yong is not None:
            entry["yong"] = yong
        out[full] = entry
    return out


def count_yao_markers_raw(ey, seg: list[str]) -> tuple[int, int]:
    """与解析器一致：先展开合并行，再数 爻/用 行。"""
    expanded = ey.preprocess_lines(seg)
    n_yao = 0
    n_yong = 0
    for ln in expanded:
        if ey.is_footnote_line(ln):
            continue
        s = ln.strip()
        if ey.YONG_HEADER.match(s):
            n_yong += 1
        elif ey.YAO_HEADER.match(s):
            n_yao += 1
    return n_yao, n_yong


def main() -> int:
    ey = load_extractor()
    raw = ey.SRC.read_text(encoding="gbk", errors="replace")
    lines = raw.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    path_json = ROOT / "src" / "assets" / "gua_data.json"
    on_disk = json.loads(path_json.read_text(encoding="utf-8"))
    expected = build_expected(ey, lines)

    issues: list[str] = []

    if set(on_disk.keys()) != set(expected.keys()):
        issues.append(
            f"键集合不一致: 仅磁盘 {set(on_disk) - set(expected)} 仅期望 {set(expected) - set(on_disk)}"
        )

    for full in [x[1] for x in ey.ORDER]:
        if full not in on_disk:
            issues.append(f"缺卦: {full}")
            continue
        a, b = on_disk[full], expected[full]
        if a != b:
            # 细部差异
            if a.get("guaci") != b.get("guaci"):
                issues.append(f"{full}: guaci 与当前脚本重解析不一致")
            if a.get("guaci_trans") != b.get("guaci_trans"):
                issues.append(f"{full}: guaci_trans 不一致")
            if len(a.get("yaoci", [])) != len(b.get("yaoci", [])):
                issues.append(
                    f"{full}: yaoci 条数 磁盘{len(a.get('yaoci', []))} vs 期望{len(b.get('yaoci', []))}"
                )
            for i, (ya, yb) in enumerate(
                zip(a.get("yaoci", []), b.get("yaoci", []), strict=False)
            ):
                if ya != yb:
                    issues.append(f"{full} yaoci[{i}] {ya.get('name')} 字段与重解析不一致")
            if (a.get("yong") or None) != (b.get("yong") or None):
                issues.append(f"{full}: yong 块与重解析不一致")

    starts = ey.find_header_lines(lines)
    for i, ((short, full), start) in enumerate(zip(ey.ORDER, starts, strict=True)):
        end = starts[i + 1] if i + 1 < len(starts) else len(lines)
        seg = lines[start:end]
        raw_yao, raw_yong = count_yao_markers_raw(ey, seg)
        od = on_disk.get(full, {})
        n_json = len(od.get("yaoci", []))
        has_y = "yong" in od
        if n_json != 6:
            issues.append(f"{full}: JSON 爻条数应为 6，实为 {n_json}")
        if raw_yao < 6:
            issues.append(
                f"{full}: 原文中识别的爻行仅 {raw_yao}（可能合并行或格式异常，请人工看）"
            )
        if short in ("乾", "坤"):
            if not has_y:
                issues.append(f"{full}: 应有 yong")
            if raw_yong < 1:
                issues.append(f"{full}: 原文未识别到用九/用六行（合并行？）")
        else:
            if has_y:
                issues.append(f"{full}: 不应有 yong")

    # 译文是否空串（仅提示，不算失败）
    empty_yi = []
    for full, v in on_disk.items():
        for j, y in enumerate(v.get("yaoci", [])):
            tr = y.get("trans") or ""
            if tr in ("【译文】", "【译文】。") or len(tr) < 5:
                empty_yi.append(f"{full} {y.get('name')}")
        gt = v.get("guaci_trans") or ""
        if gt in ("【译文】", "【译文】。"):
            empty_yi.append(f"{full} guaci_trans")

    report_lines = []
    report_lines.append("=== 与脚本重解析比对 ===")
    if not issues:
        report_lines.append(
            "OK: gua_data.json 与 extract_yijing_json.py 从原文重解析结果完全一致。"
        )
    else:
        report_lines.append("问题:")
        for x in issues:
            report_lines.append(" - " + x)
    report_lines.append("")
    report_lines.append("=== 结构校验 ===")
    report_lines.append(f"卦数: {len(on_disk)}")
    report_lines.append(
        f"乾坤 yong: "
        f"{'乾为天' in on_disk and 'yong' in on_disk['乾为天']}, "
        f"{'坤为地' in on_disk and 'yong' in on_disk['坤为地']}"
    )
    report_lines.append("")
    report_lines.append(
        "=== 译文为空或过短（原书常无卦辞译或单独起行，属正常可能）==="
    )
    if empty_yi:
        report_lines.append(
            f"共 {len(empty_yi)} 项: "
            + ", ".join(empty_yi[:25])
            + (" …" if len(empty_yi) > 25 else "")
        )
    else:
        report_lines.append("无")

    text = "\n".join(report_lines)
    (ROOT / "_audit_report.txt").write_text(text, encoding="utf-8")
    print(text)

    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
