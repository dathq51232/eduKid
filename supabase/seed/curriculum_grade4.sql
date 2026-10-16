-- SINH TỰ ĐỘNG từ src/lib/curriculum/grade4.ts — không sửa tay, hãy sửa file nguồn rồi sinh lại.
-- Chạy lại nhiều lần không sao: dòng đã có (trùng code) được giữ nguyên.
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.SO', 'Số tự nhiên', 'Số có nhiều chữ số, hàng và lớp, làm tròn, so sánh, số chẵn – lẻ.', 1, true from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.SO.01', 'Nhận biết số chẵn, số lẻ.', 1, 1, true from public.curriculum_topics where code = 'T4.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.SO.02', 'Đọc, viết, phân tích cấu tạo số có nhiều chữ số (đến lớp triệu); hàng và lớp.', 1, 2, true from public.curriculum_topics where code = 'T4.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.SO.03', 'So sánh, xếp thứ tự số có nhiều chữ số; dãy số tự nhiên.', 1, 3, true from public.curriculum_topics where code = 'T4.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.SO.04', 'Làm tròn số đến hàng trăm nghìn.', 1, 4, true from public.curriculum_topics where code = 'T4.SO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.PT', 'Cộng, trừ; biểu thức', 'Cộng, trừ số có nhiều chữ số; tính chất; tổng – hiệu; biểu thức chứa chữ; bài toán ba bước.', 2, true from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PT.01', 'Cộng, trừ các số có nhiều chữ số; tìm thành phần chưa biết.', 2, 1, true from public.curriculum_topics where code = 'T4.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PT.02', 'Vận dụng tính chất giao hoán, kết hợp của phép cộng để tính thuận tiện.', 2, 2, true from public.curriculum_topics where code = 'T4.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PT.03', 'Tìm hai số biết tổng và hiệu.', 2, 3, true from public.curriculum_topics where code = 'T4.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PT.04', 'Tính giá trị biểu thức chứa một, hai, ba chữ.', 1, 4, true from public.curriculum_topics where code = 'T4.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PT.05', 'Giải bài toán có ba bước tính.', 1, 5, true from public.curriculum_topics where code = 'T4.PT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.NC', 'Nhân, chia', 'Nhân, chia với số có một, hai chữ số; tính chất; trung bình cộng; rút về đơn vị.', 3, true from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.NC.01', 'Nhân, chia với số có một, hai chữ số.', 3, 1, true from public.curriculum_topics where code = 'T4.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.NC.02', 'Vận dụng tính chất giao hoán, kết hợp, phân phối; nhân, chia với 10, 100, 1000.', 3, 2, true from public.curriculum_topics where code = 'T4.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.NC.03', 'Ước lượng kết quả tính toán.', 3, 3, true from public.curriculum_topics where code = 'T4.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.NC.04', 'Tìm số trung bình cộng.', 3, 4, true from public.curriculum_topics where code = 'T4.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.NC.05', 'Giải bài toán liên quan đến rút về đơn vị.', 3, 5, true from public.curriculum_topics where code = 'T4.NC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.PS', 'Phân số', 'Khái niệm, tính chất, rút gọn, quy đồng, so sánh, bốn phép tính, phân số của một số.', 4, true from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PS.01', 'Đọc, viết phân số; phân số và phép chia số tự nhiên.', 3, 1, true from public.curriculum_topics where code = 'T4.PS'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PS.02', 'Tính chất cơ bản của phân số; rút gọn phân số.', 3, 2, true from public.curriculum_topics where code = 'T4.PS'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PS.03', 'Quy đồng mẫu số; so sánh phân số.', 3, 3, true from public.curriculum_topics where code = 'T4.PS'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PS.04', 'Cộng, trừ phân số.', 3, 4, true from public.curriculum_topics where code = 'T4.PS'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PS.05', 'Nhân, chia phân số.', 3, 5, true from public.curriculum_topics where code = 'T4.PS'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.PS.06', 'Tìm phân số của một số.', 3, 6, true from public.curriculum_topics where code = 'T4.PS'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.HH', 'Hình học', 'Góc, đo góc; vuông góc, song song; hình bình hành, hình thoi.', 5, true from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.HH.01', 'Đo góc (độ); nhận biết góc nhọn, vuông, tù, bẹt.', 1, 1, true from public.curriculum_topics where code = 'T4.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.HH.02', 'Nhận biết hai đường thẳng vuông góc, song song; hình bình hành, hình thoi.', 2, 2, true from public.curriculum_topics where code = 'T4.HH'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.DL', 'Đo lường', 'Yến, tạ, tấn; dm², m², mm²; giây, thế kỉ.', 6, true from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.DL.01', 'Nhận biết, đổi yến, tạ, tấn.', 1, 1, true from public.curriculum_topics where code = 'T4.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.DL.02', 'Nhận biết, đổi dm², m², mm².', 1, 2, true from public.curriculum_topics where code = 'T4.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.DL.03', 'Nhận biết giây, thế kỉ.', 1, 3, true from public.curriculum_topics where code = 'T4.DL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.TK', 'Thống kê và xác suất', 'Dãy số liệu, biểu đồ cột, số lần xuất hiện của sự kiện.', 7, true from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.TK.01', 'Đọc, mô tả dãy số liệu thống kê.', 3, 1, true from public.curriculum_topics where code = 'T4.TK'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.TK.02', 'Đọc, so sánh số liệu trên biểu đồ cột.', 3, 2, true from public.curriculum_topics where code = 'T4.TK'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.TK.03', 'Kiểm đếm số lần xuất hiện của một sự kiện.', 3, 3, true from public.curriculum_topics where code = 'T4.TK'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T4.TD', 'Tư duy, nâng cao', 'Lập số, đếm số, quy luật, bài toán nhiều bước, phân số vận dụng.', 8, false from public.subjects where code = 'toan-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.TD.02', 'Tìm quy luật dãy số.', 1, 1, false from public.curriculum_topics where code = 'T4.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.TD.03', 'Giải bài toán nhiều bước: tổng – hiệu, trung bình cộng, phân số, rút về đơn vị.', 2, 2, false from public.curriculum_topics where code = 'T4.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T4.TD.04', 'Lập số, đếm số, suy luận hình học.', 2, 3, false from public.curriculum_topics where code = 'T4.TD'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V4.DOC', 'Đọc hiểu', 'Chi tiết, ý chính, nhân vật, ý nghĩa bài đọc.', 1, true from public.subjects where code = 'tieng-viet-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.DOC.01', 'Trả lời câu hỏi về chi tiết trong bài đọc.', 1, 1, true from public.curriculum_topics where code = 'V4.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.DOC.02', 'Hiểu ý chính, chủ đề; nhận xét nhân vật.', 1, 2, true from public.curriculum_topics where code = 'V4.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.DOC.03', 'Suy luận, rút ra bài học, liên hệ bản thân.', 2, 3, true from public.curriculum_topics where code = 'V4.DOC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V4.TU', 'Từ và từ loại', 'Danh từ, động từ, tính từ; mở rộng vốn từ; lựa chọn từ ngữ; nhân hoá.', 2, true from public.subjects where code = 'tieng-viet-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.TU.01', 'Nhận biết danh từ (chung, riêng).', 1, 1, true from public.curriculum_topics where code = 'V4.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.TU.02', 'Nhận biết động từ.', 1, 2, true from public.curriculum_topics where code = 'V4.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.TU.03', 'Nhận biết tính từ.', 2, 3, true from public.curriculum_topics where code = 'V4.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.TU.04', 'Mở rộng vốn từ theo chủ điểm.', 1, 4, true from public.curriculum_topics where code = 'V4.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.TU.05', 'Lựa chọn từ ngữ phù hợp; từ cùng nghĩa, trái nghĩa.', 3, 5, true from public.curriculum_topics where code = 'V4.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.TU.06', 'Nhận biết biện pháp nhân hoá.', 2, 6, true from public.curriculum_topics where code = 'V4.TU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V4.CAU', 'Câu và dấu câu', 'Hai thành phần chính của câu; trạng ngữ; dấu gạch ngang, ngoặc kép, ngoặc đơn.', 3, true from public.subjects where code = 'tieng-viet-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.CAU.01', 'Xác định chủ ngữ, vị ngữ.', 3, 1, true from public.curriculum_topics where code = 'V4.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.CAU.02', 'Nhận biết trạng ngữ chỉ thời gian, nơi chốn, nguyên nhân, mục đích, phương tiện.', 3, 2, true from public.curriculum_topics where code = 'V4.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.CAU.03', 'Dùng đúng dấu gạch ngang, dấu ngoặc kép, dấu ngoặc đơn và các dấu câu.', 2, 3, true from public.curriculum_topics where code = 'V4.CAU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V4.CT', 'Chính tả, viết hoa', 'Viết hoa tên cơ quan, tổ chức, tên riêng; dùng từ điển.', 4, true from public.subjects where code = 'tieng-viet-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.CT.01', 'Viết hoa đúng tên cơ quan, tổ chức, tên riêng.', 1, 1, true from public.curriculum_topics where code = 'V4.CT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V4.CT.02', 'Biết cách dùng từ điển (thứ tự chữ cái).', 1, 2, true from public.curriculum_topics where code = 'V4.CT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A4.LANG', 'Tiếng Anh 4 theo chủ đề', 'Từ vựng, âm và mẫu câu theo 20 unit của Tiếng Anh 4.', 1, true from public.subjects where code = 'tieng-anh-4'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A4.TU.01', 'Nhận biết và hiểu nghĩa từ vựng của unit.', 1, 1, true from public.curriculum_topics where code = 'A4.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A4.AM.01', 'Nhận biết âm, chữ cái trọng tâm của unit trong từ.', 1, 2, true from public.curriculum_topics where code = 'A4.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A4.CAU.01', 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', 1, 3, true from public.curriculum_topics where code = 'A4.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A4.ON.01', 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', 2, 4, true from public.curriculum_topics where code = 'A4.LANG'
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DEM', 'Đếm số lượng', 'Đếm đồ vật, chọn số đúng.', 'single_choice', 1)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DOCVIET', 'Đọc, viết số', 'Viết số theo cách đọc và ngược lại.', 'fill_blank', 2)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.SOSANH', 'So sánh số (>, <, =)', 'Điền hoặc chọn dấu so sánh.', 'single_choice', 3)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.SAPXEP', 'Sắp xếp thứ tự số', 'Xếp từ bé đến lớn hoặc ngược lại.', 'ordering', 4)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.TINH', 'Tính cộng, trừ', 'Tính kết quả phép tính.', 'fill_blank', 5)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.SOTHIEU', 'Tìm số còn thiếu', 'Điền số vào chỗ trống trong phép tính hoặc dãy số.', 'fill_blank', 6)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.LOIVAN', 'Bài toán có lời văn', 'Đọc tình huống, viết phép tính và kết quả.', 'fill_blank', 7)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.HINH', 'Nhận dạng hình', 'Hình phẳng, hình khối, vị trí.', 'single_choice', 8)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DODAI', 'Đo độ dài', 'Dài hơn/ngắn hơn, đo bằng cm.', 'fill_blank', 9)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.GIOLICH', 'Xem giờ, xem lịch', 'Giờ đúng, ngày trong tuần.', 'single_choice', 10)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DUNGSAI', 'Đúng hay sai', 'Nhận định phép tính, so sánh đúng hay sai.', 'true_false', 11)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.NHANCHIA', 'Phép nhân, phép chia', 'Tính, điền thừa số, thương; bài toán nhân chia.', 'fill_blank', 12)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DOLUONG', 'Đo lường', 'Kg, lít, dm, m, km, tiền Việt Nam.', 'fill_blank', 13)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.THONGKE', 'Thống kê, khả năng', 'Kiểm đếm, biểu đồ tranh, chắc chắn – có thể – không thể.', 'single_choice', 14)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.TIMX', 'Tìm số chưa biết', 'Tìm số hạng, số bị trừ, số trừ, thừa số chưa biết.', 'fill_blank', 15)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.QUYLUAT', 'Quy luật dãy số', 'Tìm quy luật, viết số tiếp theo.', 'fill_blank', 16)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.BIEUTHUC', 'Biểu thức', 'Tính giá trị biểu thức có và không có dấu ngoặc.', 'fill_blank', 17)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.PHANSO', 'Một phần mấy', 'Tìm một phần mấy của một số, một hình.', 'single_choice', 18)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.CHUVI', 'Chu vi, diện tích', 'Tính chu vi, diện tích hình chữ nhật, hình vuông.', 'fill_blank', 19)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.AMCHU', 'Nhận biết âm, chữ', 'Chọn âm/chữ đầu của tiếng, từ.', 'single_choice', 1)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.GHEPVAN', 'Ghép âm, vần thành tiếng', 'Điền âm/vần còn thiếu.', 'fill_blank', 2)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.DAUTHANH', 'Chọn dấu thanh', 'Chọn dấu thanh đúng cho tiếng.', 'single_choice', 3)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.CHINHTA', 'Chính tả c/k, g/gh, ng/ngh', 'Điền chữ đúng quy tắc chính tả.', 'fill_blank', 4)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.NOITU', 'Nối từ với tranh, nghĩa', 'Ghép từ với nghĩa hoặc tranh.', 'matching', 5)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.XEPCAU', 'Sắp xếp từ thành câu', 'Xếp các từ thành câu đúng.', 'ordering', 6)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.DOCHIEU', 'Đọc hiểu câu, đoạn ngắn', 'Trả lời câu hỏi về chi tiết tường minh.', 'single_choice', 7)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.DAUCAU', 'Điền dấu câu', 'Dấu chấm, dấu chấm hỏi.', 'single_choice', 8)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.TUNGU', 'Tìm từ chỉ sự vật, hoạt động, đặc điểm', 'Chọn các từ cùng nhóm.', 'multiple_choice', 9)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.KIEUCAU', 'Kiểu câu', 'Câu giới thiệu, câu nêu hoạt động, câu nêu đặc điểm.', 'single_choice', 10)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.CHUCAI', 'Bảng chữ cái', 'Thứ tự chữ cái, xếp tên theo thứ tự.', 'ordering', 11)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.VIETHOA', 'Viết hoa', 'Viết hoa tên người, tên địa lí.', 'single_choice', 12)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.NGHIATU', 'Từ cùng nghĩa, trái nghĩa', 'Tìm từ có nghĩa giống hoặc trái ngược.', 'single_choice', 13)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.DOANVAN', 'Sắp xếp câu thành đoạn', 'Xếp các câu theo trình tự hợp lí.', 'ordering', 14)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.SOSANH', 'Biện pháp so sánh', 'Tìm câu có so sánh, sự vật được so sánh.', 'single_choice', 15)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.CAUHOI', 'Trả lời câu hỏi', 'Bộ phận câu trả lời câu hỏi Khi nào? Ở đâu? Bằng gì? Để làm gì?', 'single_choice', 16)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.TULOAI', 'Từ loại', 'Danh từ, động từ, tính từ.', 'multiple_choice', 17)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.THANHPHAN', 'Thành phần câu', 'Chủ ngữ, vị ngữ, trạng ngữ.', 'single_choice', 18)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.CAUGHEP', 'Câu đơn, câu ghép', 'Nhận biết câu ghép; nối các vế câu ghép.', 'single_choice', 19)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.LIENKET', 'Liên kết câu', 'Lặp từ ngữ, từ ngữ nối, từ ngữ thay thế.', 'single_choice', 20)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.TUVUNG', 'Nhận biết từ vựng', 'Chọn từ đúng với nghĩa hoặc tranh.', 'single_choice', 1)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.NOINGHIA', 'Nối từ với nghĩa', 'Ghép từ tiếng Anh với nghĩa tiếng Việt.', 'matching', 2)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.CHUCAI', 'Điền chữ cái còn thiếu', 'Hoàn thành từ bằng chữ cái.', 'fill_blank', 3)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.SODEM', 'Đếm và chọn số', 'Nghe/đọc số đếm 1–10.', 'single_choice', 4)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.NHOMTU', 'Chọn các từ cùng nhóm', 'Chọn tất cả từ thuộc một chủ đề.', 'multiple_choice', 5)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.MAUCAU', 'Hoàn thành mẫu câu', 'Điền từ vào mẫu câu quen thuộc.', 'fill_blank', 6)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.HOIDAP', 'Hỏi – đáp', 'Ghép câu hỏi với câu trả lời, chọn câu trả lời đúng.', 'matching', 7)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.XEPCAU', 'Sắp xếp từ thành câu', 'Xếp các từ thành câu đúng.', 'ordering', 8)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.AM', 'Nhận biết âm', 'Chọn từ có âm/chữ cái của unit.', 'single_choice', 9)
on conflict (code) do nothing;
