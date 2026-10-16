-- SINH TỰ ĐỘNG từ src/lib/curriculum/grade3.ts — không sửa tay, hãy sửa file nguồn rồi sinh lại.
-- Chạy lại nhiều lần không sao: dòng đã có (trùng code) được giữ nguyên.
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.SO', 'Số đến 100 000', 'Đọc, viết, cấu tạo, so sánh, làm tròn số; số La Mã.', 1, true from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.SO.01', 'Ôn các số đến 1000; đọc, viết, so sánh số.', 1, 1, true from public.curriculum_topics where code = 'T3.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.SO.02', 'Đọc, viết, phân tích cấu tạo các số có bốn, năm chữ số.', 3, 2, true from public.curriculum_topics where code = 'T3.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.SO.03', 'So sánh, xếp thứ tự các số trong phạm vi 100 000.', 3, 3, true from public.curriculum_topics where code = 'T3.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.SO.04', 'Làm tròn số đến hàng chục, trăm, nghìn, chục nghìn.', 3, 4, true from public.curriculum_topics where code = 'T3.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.SO.05', 'Đọc, viết các số La Mã từ I đến XX.', 3, 5, true from public.curriculum_topics where code = 'T3.SO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.PT', 'Phép cộng, phép trừ', 'Cộng, trừ trong phạm vi 1000, 10 000, 100 000; tìm thành phần.', 2, true from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.PT.01', 'Cộng, trừ các số trong phạm vi 1000 (ôn tập).', 1, 1, true from public.curriculum_topics where code = 'T3.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.PT.02', 'Tìm số hạng, số bị trừ, số trừ chưa biết.', 1, 2, true from public.curriculum_topics where code = 'T3.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.PT.03', 'Cộng, trừ các số trong phạm vi 10 000 và 100 000.', 3, 3, true from public.curriculum_topics where code = 'T3.PT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.NC', 'Phép nhân, phép chia', 'Bảng nhân, bảng chia 2–9; nhân, chia số có nhiều chữ số với số có một chữ số.', 3, true from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.NC.01', 'Thuộc bảng nhân, bảng chia 2 đến 9.', 1, 1, true from public.curriculum_topics where code = 'T3.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.NC.02', 'Tìm thừa số, số bị chia, số chia chưa biết.', 1, 2, true from public.curriculum_topics where code = 'T3.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.NC.03', 'Nhân, chia số có hai, ba chữ số với số có một chữ số; phép chia có dư.', 2, 3, true from public.curriculum_topics where code = 'T3.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.NC.04', 'Gấp một số lên một số lần, giảm một số đi một số lần; so sánh số lớn gấp mấy lần số bé.', 2, 4, true from public.curriculum_topics where code = 'T3.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.NC.05', 'Nhân, chia số có bốn, năm chữ số với số có một chữ số.', 3, 5, true from public.curriculum_topics where code = 'T3.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.NC.06', 'Nhận biết một phần mấy của một số, một hình.', 1, 6, true from public.curriculum_topics where code = 'T3.NC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.BT', 'Biểu thức và bài toán', 'Tính giá trị biểu thức; bài toán giải bằng hai bước tính.', 4, true from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.BT.01', 'Tính giá trị biểu thức số (có và không có dấu ngoặc).', 2, 1, true from public.curriculum_topics where code = 'T3.BT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.BT.02', 'Giải bài toán có đến hai bước tính.', 2, 2, true from public.curriculum_topics where code = 'T3.BT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.HH', 'Hình học', 'Trung điểm, hình tròn, góc vuông, tam giác, tứ giác, chu vi, diện tích.', 5, true from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.HH.01', 'Nhận biết điểm ở giữa, trung điểm đoạn thẳng; tâm, bán kính, đường kính hình tròn.', 1, 1, true from public.curriculum_topics where code = 'T3.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.HH.02', 'Nhận biết góc vuông, góc không vuông; đỉnh, cạnh của hình; khối lập phương, khối hộp chữ nhật.', 1, 2, true from public.curriculum_topics where code = 'T3.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.HH.03', 'Tính chu vi hình tam giác, tứ giác, hình chữ nhật, hình vuông.', 3, 3, true from public.curriculum_topics where code = 'T3.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.HH.04', 'Tính diện tích hình chữ nhật, hình vuông (cm²).', 3, 4, true from public.curriculum_topics where code = 'T3.HH'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.DL', 'Đo lường', 'mm, g, ml, °C; xem đồng hồ, tháng – năm; tiền Việt Nam.', 6, true from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.DL.01', 'Nhận biết mi-li-mét, gam, mi-li-lít, độ C; đổi và tính với số đo.', 2, 1, true from public.curriculum_topics where code = 'T3.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.DL.02', 'Xem đồng hồ chính xác đến phút; tháng, năm; xem lịch.', 3, 2, true from public.curriculum_topics where code = 'T3.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.DL.03', 'Nhận biết tiền Việt Nam; tính tiền khi mua bán.', 3, 3, true from public.curriculum_topics where code = 'T3.DL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.TK', 'Thống kê và xác suất', 'Thu thập, phân loại số liệu, bảng số liệu; khả năng xảy ra.', 7, true from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.TK.01', 'Thu thập, phân loại, ghi chép số liệu; đọc bảng số liệu.', 3, 1, true from public.curriculum_topics where code = 'T3.TK'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.TK.02', 'Nhận biết khả năng xảy ra của một sự kiện: chắc chắn, có thể, không thể.', 3, 2, true from public.curriculum_topics where code = 'T3.TK'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T3.TD', 'Tư duy, nâng cao', 'Dạng toán nâng cao: quy luật, bài toán nhiều bước, tìm số, đếm hình, tổng – hiệu.', 8, false from public.subjects where code = 'toan-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.TD.01', 'Tìm thành phần chưa biết trong biểu thức nhiều bước.', 1, 1, false from public.curriculum_topics where code = 'T3.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.TD.02', 'Tìm quy luật của dãy số và viết tiếp.', 1, 2, false from public.curriculum_topics where code = 'T3.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.TD.03', 'Giải bài toán nhiều bước: tuổi, tổng – hiệu, gấp – giảm, rút về đơn vị.', 2, 3, false from public.curriculum_topics where code = 'T3.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T3.TD.04', 'Lập số theo điều kiện; đếm hình; suy luận logic.', 2, 4, false from public.curriculum_topics where code = 'T3.TD'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V3.DOC', 'Đọc hiểu', 'Hiểu chi tiết, ý chính, nhân vật và bài học của bài đọc.', 1, true from public.subjects where code = 'tieng-viet-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.DOC.01', 'Trả lời được câu hỏi về chi tiết trong bài đọc.', 1, 1, true from public.curriculum_topics where code = 'V3.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.DOC.02', 'Hiểu ý chính, điều tác giả muốn nói; nhận xét nhân vật.', 1, 2, true from public.curriculum_topics where code = 'V3.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.DOC.03', 'Suy luận từ chi tiết; liên hệ bài học với bản thân.', 2, 3, true from public.curriculum_topics where code = 'V3.DOC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V3.TU', 'Từ ngữ', 'Từ chỉ sự vật, hoạt động, đặc điểm; mở rộng vốn từ; từ cùng nghĩa, trái nghĩa; so sánh.', 2, true from public.subjects where code = 'tieng-viet-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.TU.01', 'Nhận biết từ chỉ sự vật.', 1, 1, true from public.curriculum_topics where code = 'V3.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.TU.02', 'Nhận biết từ chỉ hoạt động.', 1, 2, true from public.curriculum_topics where code = 'V3.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.TU.03', 'Nhận biết từ chỉ đặc điểm.', 1, 3, true from public.curriculum_topics where code = 'V3.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.TU.04', 'Mở rộng vốn từ theo chủ điểm.', 1, 4, true from public.curriculum_topics where code = 'V3.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.TU.05', 'Tìm từ có nghĩa giống nhau, trái ngược nhau.', 2, 5, true from public.curriculum_topics where code = 'V3.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.TU.06', 'Nhận biết biện pháp so sánh; tìm sự vật được so sánh.', 2, 6, true from public.curriculum_topics where code = 'V3.TU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V3.CAU', 'Câu và dấu câu', 'Câu kể, câu hỏi, câu cảm, câu khiến; dấu câu; trả lời câu hỏi Khi nào? Ở đâu? Bằng gì? Để làm gì?', 3, true from public.subjects where code = 'tieng-viet-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CAU.01', 'Nhận biết câu giới thiệu.', 1, 1, true from public.curriculum_topics where code = 'V3.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CAU.02', 'Nhận biết câu nêu hoạt động.', 1, 2, true from public.curriculum_topics where code = 'V3.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CAU.03', 'Nhận biết câu nêu đặc điểm.', 1, 3, true from public.curriculum_topics where code = 'V3.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CAU.04', 'Dùng đúng dấu chấm, dấu chấm hỏi, dấu chấm than, dấu phẩy.', 1, 4, true from public.curriculum_topics where code = 'V3.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CAU.05', 'Nhận biết câu kể, câu hỏi, câu cảm, câu khiến.', 1, 5, true from public.curriculum_topics where code = 'V3.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CAU.06', 'Dùng đúng dấu hai chấm, dấu gạch ngang, dấu ngoặc kép.', 2, 6, true from public.curriculum_topics where code = 'V3.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CAU.07', 'Đặt và trả lời câu hỏi Khi nào? Ở đâu? Bằng gì? Để làm gì?', 3, 7, true from public.curriculum_topics where code = 'V3.CAU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V3.CT', 'Chính tả và chữ viết', 'Phân biệt âm vần dễ lẫn; viết hoa tên riêng.', 4, true from public.subjects where code = 'tieng-viet-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CT.01', 'Xếp từ, tên theo thứ tự bảng chữ cái.', 1, 1, true from public.curriculum_topics where code = 'V3.CT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CT.02', 'Phân biệt các âm, vần, dấu thanh dễ lẫn.', 1, 2, true from public.curriculum_topics where code = 'V3.CT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CT.03', 'Viết hoa tên người, tên địa lí Việt Nam.', 1, 3, true from public.curriculum_topics where code = 'V3.CT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.CT.04', 'Viết đúng tên riêng nước ngoài (phiên âm có gạch nối).', 3, 4, true from public.curriculum_topics where code = 'V3.CT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V3.VIET', 'Viết đoạn văn', 'Sắp xếp câu thành đoạn; chọn câu phù hợp.', 5, true from public.subjects where code = 'tieng-viet-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V3.VIET.01', 'Sắp xếp các câu thành đoạn văn hợp lí.', 2, 1, true from public.curriculum_topics where code = 'V3.VIET'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A3.LANG', 'Tiếng Anh 3 theo chủ đề', 'Từ vựng, âm và mẫu câu theo 20 unit của Tiếng Anh 3.', 1, true from public.subjects where code = 'tieng-anh-3'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A3.TU.01', 'Nhận biết và hiểu nghĩa từ vựng của unit.', 1, 1, true from public.curriculum_topics where code = 'A3.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A3.AM.01', 'Nhận biết âm, chữ cái trọng tâm của unit trong từ.', 1, 2, true from public.curriculum_topics where code = 'A3.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A3.CAU.01', 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', 1, 3, true from public.curriculum_topics where code = 'A3.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A3.ON.01', 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', 2, 4, true from public.curriculum_topics where code = 'A3.LANG'
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
