"""Xuất file Excel ngân hàng câu hỏi Lớp 1 từ nội dung trong app.

Nguồn dữ liệu:
  - JSON do scripts/dump-bank.ts in ra (ngân hàng EC1-xxx + bài theo sách, đã có cấp độ, thời gian, điểm).
  - data/ngan-hang-mau-goc.xlsx: bộ mẫu 45 câu ban đầu (giữ nguyên câu gốc, giai đoạn, điều kiện, trạng thái).

Chạy (đã gộp trong npm run export:bank):
  npx tsx scripts/dump-bank.ts > data/bank.json
  python scripts/export_bank_xlsx.py data/bank.json data/ngan-hang-mau-goc.xlsx data/EduChain_Kids_Ngan_hang_cau_hoi_Lop_1.xlsx

Cần: pip install openpyxl
"""

from __future__ import annotations

import json
import sys
from datetime import date

from openpyxl import Workbook, load_workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

# ---------------------------------------------------------------------------
# Kiểu trình bày (giống file mẫu gốc)
# ---------------------------------------------------------------------------
FONT = "Aptos"
NAVY = "193650"
INK = "24364B"
BODY = "F7F9FC"
HEAD_FONT = Font(name=FONT, size=10, bold=True, color="FFFFFF")
BODY_FONT = Font(name=FONT, size=10, color=INK)
BOLD_FONT = Font(name=FONT, size=10, bold=True, color=INK)
NOTE_FONT = Font(name=FONT, size=9, italic=True, color="5B6B7F")
HEAD_FILL = PatternFill("solid", fgColor=NAVY)
BODY_FILL = PatternFill("solid", fgColor=BODY)
WRAP_TOP = Alignment(wrap_text=True, vertical="top")
WRAP_CENTER = Alignment(wrap_text=True, vertical="center", horizontal="center")
# Màu nền theo cấp độ (nhạt, chữ vẫn dễ đọc)
LEVEL_FILL = {1: "E8F5E9", 2: "E3F2FD", 3: "FFF8E1", 4: "FFE0CC", 5: "F3E5F5"}

SUBJECT_NAME = {"toan": "Toán", "tieng-viet": "Tiếng Việt", "tieng-anh": "Tiếng Anh"}
SUBJECT_SHEET = {"toan": "Toan_L1-L5", "tieng-viet": "TiengViet_L1-L5", "tieng-anh": "TiengAnh_L1-L5"}
SUBJECT_ORDER = ["toan", "tieng-viet", "tieng-anh"]
TYPE_NAME = {
    "single_choice": "Chọn đáp án",
    "true_false": "Đúng / Sai",
    "fill_blank": "Điền đáp án",
    "multiple_choice": "Chọn nhiều đáp án",
    "ordering": "Sắp xếp",
    "matching": "Ghép cặp",
}
LETTERS = "ABCDEFGH"


def style_header(ws, row: int = 1, height: float = 34):
    for c in ws[row]:
        if c.value is None:
            continue
        c.font = HEAD_FONT
        c.fill = HEAD_FILL
        c.alignment = WRAP_CENTER
    ws.row_dimensions[row].height = height


def style_body(ws, first: int, last: int, ncol: int):
    for r in range(first, last + 1):
        for col in range(1, ncol + 1):
            c = ws.cell(r, col)
            c.font = BODY_FONT
            c.fill = BODY_FILL
            c.alignment = WRAP_TOP


def set_widths(ws, widths: list[float]):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def add_table(ws, name: str, ncol: int, nrow: int):
    t = Table(displayName=name, ref=f"A1:{get_column_letter(ncol)}{nrow}")
    t.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
    ws.add_table(t)


def level_colors(ws, level_col: str, ncol: int, nrow: int):
    """Tô màu cả dòng theo cấp độ (định dạng có điều kiện, đổi cấp độ thì màu đổi theo)."""
    rng = f"A2:{get_column_letter(ncol)}{nrow}"
    for lv, color in LEVEL_FILL.items():
        ws.conditional_formatting.add(
            rng, FormulaRule(formula=[f"${level_col}2={lv}"], fill=PatternFill("solid", fgColor=color, bgColor=color))
        )


# ---------------------------------------------------------------------------
# Hiển thị câu hỏi của app thành các cột Excel
# ---------------------------------------------------------------------------
def options_and_answer(q: dict) -> tuple[list[str], str, str]:
    """Trả về (các lựa chọn A–E, đáp án, phần bổ sung vào đề)."""
    t, opts, key = q["type"], q["options"], q["key"]
    if t == "single_choice":
        return opts, LETTERS[opts.index(key["correct"])], ""
    if t == "true_false":
        return ["Đúng", "Sai"], "A" if key["correct"] == "Đúng" else "B", ""
    if t == "multiple_choice":
        return opts, ", ".join(LETTERS[opts.index(x)] for x in key["correct"]), ""
    if t == "fill_blank":
        return [], " / ".join(key["accepted"]), ""
    if t == "ordering":
        return [], " → ".join(key["order"]), ""
    if t == "matching":
        pairs = key["pairs"]
        return [], "; ".join(f"{k} – {v}" for k, v in pairs.items()), ""
    return opts, json.dumps(key, ensure_ascii=False), ""


def app_summary(q: dict) -> str:
    opts, ans, _ = options_and_answer(q)
    parts = [f"[{TYPE_NAME[q['type']]}] {q['prompt']}"]
    if opts:
        parts.append(" | ".join(f"{LETTERS[i]}. {o}" for i, o in enumerate(opts)))
    parts.append(f"Đáp án: {ans}")
    return "\n".join(parts)


BANK_HEAD = [
    "ID", "Môn học", "Lớp", "Giai đoạn gợi ý", "Chủ đề / kỹ năng",
    "Cấp độ", "Tên cấp độ", "Cấp độ cũ (bộ mẫu)", "Lý do điều chỉnh cấp độ",
    "Loại câu hỏi", "Câu hỏi / nhiệm vụ",
    "Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D", "Lựa chọn E",
    "Đáp án đúng", "Lời giải / phản hồi", "Lời giải chi tiết",
    "Thời gian (giây)", "Điểm khi đúng", "Đề ôn", "Thứ tự trong đề",
    "Mã YCCĐ", "Mã dạng bài", "Nguồn câu", "Bản dùng trong app (nếu khác câu gốc)",
    "Điều kiện tiên quyết", "Căn cứ chương trình / lưu ý đối chiếu", "Nguồn / phạm vi",
    "Trạng thái nội dung", "Trạng thái giáo viên", "Ghi chú kiểm duyệt",
]
BANK_WIDTHS = [10, 11, 6, 24, 20, 8, 12, 10, 30, 14, 46, 16, 16, 16, 16, 12, 22, 36, 40,
               10, 9, 7, 8, 12, 14, 11, 40, 32, 36, 30, 20, 18, 30]
COL = {h: i + 1 for i, h in enumerate(BANK_HEAD)}
LEVEL_COL = get_column_letter(COL["Cấp độ"])


def read_original(path: str) -> dict[str, dict]:
    wb = load_workbook(path)
    ws = wb["Ngan_hang_cau_hoi"]
    head = [c.value for c in ws[1]]
    rows = {}
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r[0]:
            rows[r[0]] = dict(zip(head, r))
    return rows, wb


def bank_row(item: dict, orig: dict | None) -> list:
    q = item["q"]
    opts, ans, _ = options_and_answer(q)
    if orig:  # câu trong bộ mẫu: giữ câu gốc, ghi bản app nếu khác
        prompt = orig["Câu hỏi / nhiệm vụ"]
        o = [orig[f"Lựa chọn {x}"] for x in "ABCD"] + [None]
        answer = orig["Đáp án đúng"]
        expl = orig["Lời giải / phản hồi"]
        qtype = orig["Loại câu hỏi"]
        changed = item.get("appNote") or prompt != q["prompt"] or qtype != TYPE_NAME[q["type"]]
        app = (app_summary(q) + (f"\nGhi chú: {item['appNote']}" if item.get("appNote") else "")) if changed else ""
        stage, topic = orig["Giai đoạn gợi ý"], orig["Chủ đề / kỹ năng"]
        prereq, basis, src = orig["Điều kiện tiên quyết"], orig["Căn cứ chương trình / lưu ý đối chiếu"], orig["Nguồn / phạm vi"]
        st_content, st_teacher, review = orig["Trạng thái nội dung"], orig["Trạng thái giáo viên"], orig["Ghi chú kiểm duyệt"]
        origin = "Bộ mẫu"
    else:
        prompt, o, answer, expl, qtype, app = q["prompt"], (opts + [None] * 5)[:5], ans, q["explanation"], TYPE_NAME[q["type"]], ""
        if q["type"] == "ordering":
            prompt = f"{q['prompt']}\n(Các mục: {' / '.join(sorted(q['options']))})"
        if q["type"] == "matching":
            prompt = f"{q['prompt']}\n(Vế trái: {' / '.join(q['left'])} · Vế phải: {' / '.join(sorted(q['options']))})"
        stage, topic = item.get("stage"), item.get("topic")
        prereq, basis = item.get("prerequisite"), item.get("basis")
        src = "EduChain Kids soạn thêm (2026-10); bám chương trình GDPT 2018 và trình tự SGK đã chọn"
        st_content, st_teacher, review = "Bản soạn mới — cần rà soát", "Chờ giáo viên duyệt", item.get("review")
        origin = "Soạn thêm"
    if orig and q["type"] in ("ordering", "matching") and not o[0]:
        o = [None] * 5
    lb = item.get("levelBefore")
    return [
        item["id"], SUBJECT_NAME[item["subject"]], 1, stage, topic,
        q["level"], q["levelName"], lb, item.get("levelReason"),
        qtype, prompt, *o[:5], answer, expl, q.get("solution"),
        q["timeLimit"], None,  # điểm: công thức, điền sau
        item["de"]["de"], item["de"]["pos"],
        q["outcome"], q["form"], origin, app,
        prereq, basis, src, st_content, st_teacher, review,
    ]


def write_bank_sheet(ws, items: list[dict], originals: dict, table_name: str):
    ws.append(BANK_HEAD)
    for it in items:
        ws.append(bank_row(it, originals.get(it["id"])))
    n = len(items) + 1
    pts_col = get_column_letter(COL["Điểm khi đúng"])
    for r in range(2, n + 1):
        # Điểm lấy từ bảng Khung_cap_do theo cấp độ — đổi điểm ở đó thì mọi câu đổi theo
        ws[f"{pts_col}{r}"] = f"=INDEX(Khung_cap_do!$H$2:$H$6,{LEVEL_COL}{r})"
    style_header(ws)
    style_body(ws, 2, n, len(BANK_HEAD))
    for r in range(2, n + 1):
        for h in ("Lớp", "Cấp độ", "Cấp độ cũ (bộ mẫu)", "Thời gian (giây)", "Điểm khi đúng", "Đề ôn", "Thứ tự trong đề"):
            ws.cell(r, COL[h]).alignment = Alignment(vertical="top", horizontal="center", wrap_text=True)
        ws.cell(r, COL["Cấp độ"]).font = BOLD_FONT
    set_widths(ws, BANK_WIDTHS)
    ws.freeze_panes = "C2"
    add_table(ws, table_name, len(BANK_HEAD), n)
    level_colors(ws, LEVEL_COL, len(BANK_HEAD), n)


# ---------------------------------------------------------------------------
def main(json_path: str, original_path: str, out_path: str):
    data = json.load(open(json_path, encoding="utf-8"))
    originals, orig_wb = read_original(original_path)
    levels = {lv["level"]: lv for lv in data["levels"]}

    # Sắp: môn → cấp độ → mẫu trước, soạn thêm sau → ID
    bank = sorted(
        data["bank"],
        key=lambda b: (SUBJECT_ORDER.index(b["subject"]), b["q"]["level"], b["origin"] != "mau", b["id"]),
    )

    wb = Workbook()
    wb.remove(wb.active)

    # 1. Đọc trước khi dùng ---------------------------------------------------
    ws = wb.create_sheet("Doc_truoc_khi_dung")
    for r in orig_wb["Doc_truoc_khi_dung"].iter_rows(values_only=True):
        if r[0] == "Mục đích":
            r = (r[0], f"Ngân hàng câu hỏi Lớp 1 gồm {len(bank)} câu (40 câu/môn; 8 câu/cấp độ/môn): 45 câu bộ mẫu ban đầu + "
                       f"{len(bank) - 45} câu soạn thêm. Kèm {len(data['book'])} câu bài tập theo sách (Học kì 1; riêng Toán có cả Học kì 2, Bài 21–41) ở sheet Bai_tap_theo_sach.")
        ws.append(r[:2])
    extra = [
        ("Cập nhật", f"{date.today():%d/%m/%Y}: phân cấp độ L1–L5 cho từng môn (mỗi môn một sheet), thêm thời gian làm từng câu, "
                     "điểm khi đúng, đề ôn, mã YCCĐ, lời giải chi tiết; soạn thêm 75 câu; điều chỉnh cấp độ 6 câu mẫu (xem cột Cấp độ cũ)."),
        ("Thời gian mỗi câu", "Thời gian gốc theo cấp độ (sheet Khung_cap_do) + thêm theo dạng câu (điền, chọn nhiều +10 giây; "
                              "sắp xếp, ghép cặp +15 giây) + 10 giây nếu đề dài hơn 60 ký tự; làm tròn 5 giây, trong khoảng 30–120 giây. "
                              "Giáo viên có thể sửa thời gian từng câu trong trang quản trị."),
        ("Điểm", "Câu đúng được điểm theo cấp độ (10/15/20/25/30). Đúng và dùng không quá nửa thời gian: +5. "
                 "Đúng hết bài: +20; đúng từ 80%: +10. Điểm tích luỹ = cộng điểm cao nhất của từng bài (làm lại chỉ cộng phần vượt kỷ lục)."),
        ("Đề ôn theo cấp độ", "Mỗi môn 4 đề × 10 câu; mỗi đề 2 câu mỗi cấp độ, sắp từ L1 đến L5 (cột Đề ôn, Thứ tự trong đề)."),
        ("Câu trả lời mở", "Câu mẫu dạng Trả lời ngắn / Nói được giữ nguyên ở đây để chấm theo rubric; trong app dùng bản chấm tự động "
                           "(cột Bản dùng trong app)."),
        ("Sửa nội dung", "Nguồn chính là file src/lib/content/ngan-hang-lop1.ts trong dự án. Sửa ở đó rồi chạy npm run check:content, "
                         "npm run gen:sql và npm run export:bank để tạo lại file này."),
    ]
    for e in extra:
        ws.append(e)
    style_header(ws)
    style_body(ws, 2, ws.max_row, 2)
    for r in range(2, ws.max_row + 1):
        ws.cell(r, 1).font = BOLD_FONT
    set_widths(ws, [24, 125])
    ws.freeze_panes = "A2"

    # 2. Khung cấp độ ----------------------------------------------------------
    ws = wb.create_sheet("Khung_cap_do")
    orig_k = [r for r in orig_wb["Khung_cap_do"].iter_rows(values_only=True) if r[0]]
    ws.append(list(orig_k[0][:5]) + ["Mức quen thuộc", "Thời gian gốc (giây)", "Điểm khi đúng"])
    for i, r in enumerate(orig_k[1:6], start=1):
        lv = levels[i]
        ws.append(list(r[:5]) + [lv.get("old") or "—", lv["seconds"], lv["points"]])
    style_header(ws)
    style_body(ws, 2, 6, 8)
    for r in range(2, 7):
        for c in (7, 8):
            ws.cell(r, c).font = Font(name=FONT, size=10, color="0000FF")  # ô nhập
            ws.cell(r, c).alignment = Alignment(vertical="top", horizontal="center")
        ws.cell(r, 1).fill = PatternFill("solid", fgColor=LEVEL_FILL[r - 1])
    ws["A8"] = "Thời gian cộng thêm theo dạng câu"
    ws["A8"].font = BOLD_FONT
    rows = [("Chọn đáp án, Đúng/Sai", 0), ("Điền đáp án, Chọn nhiều", 10), ("Sắp xếp, Ghép cặp", 15),
            ("Đề dài hơn 60 ký tự", 10), ("Giới hạn", "30–120 giây")]
    for i, (a, b) in enumerate(rows, start=9):
        ws.cell(i, 1, a).font = BODY_FONT
        ws.cell(i, 2, b).font = BODY_FONT
    ws["A15"] = ("Chữ xanh: số có thể chỉnh. Cột Điểm khi đúng ở các sheet câu hỏi lấy từ cột H ở đây. "
                 "Thời gian từng câu trong các sheet câu hỏi là giá trị đã tính (giáo viên sửa được từng câu); "
                 "đổi quy tắc thời gian thì sửa src/lib/levels.ts và migration 0006 rồi xuất lại file.")
    ws["A15"].font = NOTE_FONT
    ws.merge_cells("A15:H15")
    ws["A15"].alignment = WRAP_TOP
    ws.row_dimensions[15].height = 30
    set_widths(ws, [24, 42, 48, 46, 48, 14, 14, 12])
    ws.freeze_panes = "A2"

    # 3. Tổng hợp ---------------------------------------------------------------
    ws = wb.create_sheet("Tong_hop")
    ws.append(["Môn học", "Cấp độ", "Tên cấp độ", "Số câu ngân hàng", "Câu bộ mẫu", "Câu soạn thêm",
               "Có lời giải chi tiết", "Thời gian TB (giây)", "Điểm khi đúng", "Câu bài tập theo sách"])
    r = 2
    b = "Ngan_hang_cau_hoi"
    for s in SUBJECT_ORDER:
        name = SUBJECT_NAME[s]
        for lv in range(1, 6):
            ws.append([
                name, lv, levels[lv]["name"],
                f'=COUNTIFS({b}!$B:$B,$A{r},{b}!$F:$F,$B{r})',
                f'=COUNTIFS({b}!$B:$B,$A{r},{b}!$F:$F,$B{r},{b}!$Z:$Z,"Bộ mẫu")',
                f'=COUNTIFS({b}!$B:$B,$A{r},{b}!$F:$F,$B{r},{b}!$Z:$Z,"Soạn thêm")',
                f'=COUNTIFS({b}!$B:$B,$A{r},{b}!$F:$F,$B{r},{b}!$S:$S,"<>")',
                f'=IFERROR(ROUND(AVERAGEIFS({b}!$T:$T,{b}!$B:$B,$A{r},{b}!$F:$F,$B{r}),0),0)',
                f"=INDEX(Khung_cap_do!$H$2:$H$6,$B{r})",
                f"=COUNTIFS(Bai_tap_theo_sach!$B:$B,$A{r},Bai_tap_theo_sach!$H:$H,$B{r})",
            ])
            r += 1
        ws.append([f"Cộng {name}", None, None, f"=SUM(D{r-5}:D{r-1})", f"=SUM(E{r-5}:E{r-1})", f"=SUM(F{r-5}:F{r-1})",
                   f"=SUM(G{r-5}:G{r-1})", f"=IFERROR(ROUND(AVERAGEIFS({b}!$T:$T,{b}!$B:$B,\"{name}\"),0),0)", None,
                   f"=SUM(J{r-5}:J{r-1})"])
        r += 1
    subtotal_rows = [7, 13, 19]
    ws.append(["TỔNG CỘNG", None, None] + [f"={'+'.join(f'{c}{x}' for x in subtotal_rows)}" for c in "DEFG"]
              + [f"=IFERROR(ROUND(AVERAGE({b}!$T:$T),0),0)", None, f"={'+'.join(f'J{x}' for x in subtotal_rows)}"])
    style_header(ws)
    style_body(ws, 2, ws.max_row, 10)
    for rr in subtotal_rows + [ws.max_row]:
        for c in range(1, 11):
            ws.cell(rr, c).font = BOLD_FONT
            ws.cell(rr, c).fill = PatternFill("solid", fgColor="DCE3EE")
    for rr in range(2, ws.max_row + 1):
        lv = ws.cell(rr, 2).value
        if isinstance(lv, int):
            ws.cell(rr, 2).fill = PatternFill("solid", fgColor=LEVEL_FILL[lv])
        for c in range(2, 11):
            ws.cell(rr, c).alignment = Alignment(horizontal="center", vertical="top")
    ws.cell(ws.max_row + 2, 1, "Mọi số liệu là công thức đếm từ sheet Ngan_hang_cau_hoi và Bai_tap_theo_sach.").font = NOTE_FONT
    set_widths(ws, [18, 8, 12, 14, 12, 13, 14, 14, 12, 16])
    ws.freeze_panes = "A2"

    # 4. Một sheet cho mỗi môn (L1 → L5) + sheet gộp --------------------------------
    for s in SUBJECT_ORDER:
        ws = wb.create_sheet(SUBJECT_SHEET[s])
        write_bank_sheet(ws, [x for x in bank if x["subject"] == s], originals, "Bank_" + s.replace("-", "_"))
    ws = wb.create_sheet("Ngan_hang_cau_hoi")
    write_bank_sheet(ws, bank, originals, "QuestionBank")

    # 5. Bài tập theo sách ------------------------------------------------------------
    ws = wb.create_sheet("Bai_tap_theo_sach")
    head = ["ID", "Môn học", "Bộ sách", "Vị trí trong sách", "Chủ đề / Unit", "Bài", "Loại câu hỏi", "Cấp độ", "Tên cấp độ",
            "Câu hỏi", "Lựa chọn", "Đáp án đúng", "Lời giải / phản hồi", "Lời giải chi tiết",
            "Thời gian (giây)", "Điểm khi đúng", "Mã YCCĐ", "Mã dạng bài"]
    ws.append(head)
    for it in data["book"]:
        q = it["q"]
        opts, ans, _ = options_and_answer(q)
        shown = opts if q["type"] not in ("ordering", "matching") else (
            sorted(q["options"]) if q["type"] == "ordering" else [f"{a} ↔ ?" for a in q["left"]])
        ws.append([
            it["id"], SUBJECT_NAME[it["subject"]], it["book"], it["ref"], it["unit"]["title"], it["lessonTitle"],
            TYPE_NAME[q["type"]], q["level"], q["levelName"], q["prompt"],
            " | ".join(f"{LETTERS[i]}. {o}" for i, o in enumerate(shown)) if q["type"] in ("single_choice", "multiple_choice", "true_false") else " / ".join(shown),
            ans, q["explanation"], q.get("solution"), q["timeLimit"], None, q["outcome"], q["form"],
        ])
    n = ws.max_row
    for rr in range(2, n + 1):
        ws[f"P{rr}"] = f"=INDEX(Khung_cap_do!$H$2:$H$6,H{rr})"
    style_header(ws)
    style_body(ws, 2, n, len(head))
    for rr in range(2, n + 1):
        for c in (8, 15, 16):
            ws.cell(rr, c).alignment = Alignment(horizontal="center", vertical="top")
    set_widths(ws, [20, 11, 16, 14, 30, 30, 14, 8, 11, 44, 36, 24, 36, 36, 10, 9, 12, 14])
    ws.freeze_panes = "C2"
    add_table(ws, "BookQuestions", len(head), n)
    level_colors(ws, "H", len(head), n)

    # 6. Checklist duyệt ----------------------------------------------------------------
    ws = wb.create_sheet("Checklist_duyet")
    for r in orig_wb["Checklist_duyet"].iter_rows(values_only=True):
        ws.append(r[:5])
    ws.append(("Thời gian", "Thời gian mỗi câu đủ cho học sinh lớp 1 đọc đề và thao tác (30–120 giây)?", "Chưa kiểm tra", None, None))
    ws.append(("Thứ tự cấp độ", "Câu trong đề đi từ dễ (L1) đến khó (L5); cấp độ phản ánh tư duy, không phải kiến thức chưa học?", "Chưa kiểm tra", None, None))
    style_header(ws)
    style_body(ws, 2, ws.max_row, 5)
    set_widths(ws, [22, 75, 20, 24, 46])
    ws.freeze_panes = "A2"

    # Thứ tự sheet: đọc trước → khung → tổng hợp → 3 môn → gộp → theo sách → checklist
    wb.active = wb.sheetnames.index("Tong_hop")
    wb.save(out_path)
    print(f"Đã ghi {out_path}: {len(bank)} câu ngân hàng, {len(data['book'])} câu theo sách.")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("Cách dùng: python scripts/export_bank_xlsx.py <bank.json> <ngan-hang-mau-goc.xlsx> <file-ra.xlsx>")
    main(*sys.argv[1:])
