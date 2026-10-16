-- SINH TỰ ĐỘNG từ src/lib/curriculum/grade2.ts — không sửa tay, hãy sửa file nguồn rồi sinh lại.
-- Chạy lại nhiều lần không sao: dòng đã có (trùng code) được giữ nguyên.
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T2.SO', 'Số trong phạm vi 1000', 'Đọc, viết, cấu tạo, so sánh số; tia số.', 1, true from public.subjects where code = 'toan-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.SO.01', 'Nhận biết tia số, số liền trước, số liền sau; ôn các số đến 100.', 1, 1, true from public.curriculum_topics where code = 'T2.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.SO.02', 'Đọc, viết được các số trong phạm vi 1000; số tròn chục, tròn trăm.', 3, 2, true from public.curriculum_topics where code = 'T2.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.SO.03', 'Nhận biết trăm, chục, đơn vị; viết số thành tổng các trăm, chục, đơn vị.', 3, 3, true from public.curriculum_topics where code = 'T2.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.SO.04', 'So sánh, xếp thứ tự các số trong phạm vi 1000.', 3, 4, true from public.curriculum_topics where code = 'T2.SO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T2.PT', 'Phép cộng, phép trừ', 'Cộng, trừ qua 10, có nhớ trong phạm vi 100, trong phạm vi 1000; bài toán có lời văn.', 2, true from public.subjects where code = 'toan-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.PT.01', 'Nhận biết số hạng, tổng, số bị trừ, số trừ, hiệu.', 1, 1, true from public.curriculum_topics where code = 'T2.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.PT.02', 'Cộng, trừ (qua 10) trong phạm vi 20; thuộc bảng cộng, bảng trừ.', 1, 2, true from public.curriculum_topics where code = 'T2.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.PT.03', 'Cộng, trừ (có nhớ) các số trong phạm vi 100.', 2, 3, true from public.curriculum_topics where code = 'T2.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.PT.04', 'Cộng, trừ (không nhớ và có nhớ) các số trong phạm vi 1000.', 3, 4, true from public.curriculum_topics where code = 'T2.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.PT.05', 'Giải bài toán về thêm, bớt; nhiều hơn, ít hơn một số đơn vị; hơn kém nhau bao nhiêu.', 1, 5, true from public.curriculum_topics where code = 'T2.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.PT.06', 'Tính giá trị biểu thức có hai dấu phép tính cộng, trừ.', 2, 6, true from public.curriculum_topics where code = 'T2.PT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T2.NC', 'Phép nhân, phép chia', 'Ý nghĩa phép nhân, phép chia; bảng nhân, bảng chia 2 và 5.', 3, true from public.subjects where code = 'toan-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.NC.01', 'Nhận biết ý nghĩa phép nhân; thừa số, tích.', 3, 1, true from public.curriculum_topics where code = 'T2.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.NC.02', 'Thuộc và vận dụng bảng nhân 2, bảng nhân 5.', 3, 2, true from public.curriculum_topics where code = 'T2.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.NC.03', 'Nhận biết ý nghĩa phép chia; số bị chia, số chia, thương.', 3, 3, true from public.curriculum_topics where code = 'T2.NC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.NC.04', 'Thuộc và vận dụng bảng chia 2, bảng chia 5; giải bài toán một bước về phép nhân, chia.', 3, 4, true from public.curriculum_topics where code = 'T2.NC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T2.HH', 'Hình học trực quan', 'Điểm, đoạn thẳng, đường gấp khúc, hình tứ giác, khối trụ, khối cầu.', 4, true from public.subjects where code = 'toan-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.HH.01', 'Nhận biết điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng.', 2, 1, true from public.curriculum_topics where code = 'T2.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.HH.02', 'Nhận biết đường gấp khúc, tính độ dài đường gấp khúc; nhận biết hình tứ giác.', 2, 2, true from public.curriculum_topics where code = 'T2.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.HH.03', 'Nhận biết khối trụ, khối cầu qua đồ vật thực tế.', 3, 3, true from public.curriculum_topics where code = 'T2.HH'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T2.DL', 'Đo lường', 'Ki-lô-gam, lít, đề-xi-mét, mét, ki-lô-mét; giờ, phút, ngày, tháng; tiền Việt Nam.', 5, true from public.subjects where code = 'toan-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.DL.01', 'Nhận biết đơn vị ki-lô-gam (kg), lít (l); cân, đong, tính với số đo.', 1, 1, true from public.curriculum_topics where code = 'T2.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.DL.02', 'Đọc giờ trên đồng hồ; biết một ngày có 24 giờ, một giờ có 60 phút.', 2, 2, true from public.curriculum_topics where code = 'T2.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.DL.03', 'Xem lịch tháng: ngày, thứ, số ngày trong tháng.', 2, 3, true from public.curriculum_topics where code = 'T2.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.DL.04', 'Nhận biết đề-xi-mét, mét, ki-lô-mét và quan hệ giữa các đơn vị.', 3, 4, true from public.curriculum_topics where code = 'T2.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.DL.05', 'Nhận biết một số tờ tiền Việt Nam; đổi và tính tiền đơn giản.', 3, 5, true from public.curriculum_topics where code = 'T2.DL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T2.TK', 'Thống kê và xác suất', 'Kiểm đếm số liệu, biểu đồ tranh, chắc chắn – có thể – không thể.', 6, true from public.subjects where code = 'toan-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.TK.01', 'Thu thập, phân loại, kiểm đếm số liệu; đọc biểu đồ tranh.', 3, 1, true from public.curriculum_topics where code = 'T2.TK'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.TK.02', 'Nhận biết khả năng xảy ra của sự kiện: chắc chắn, có thể, không thể.', 3, 2, true from public.curriculum_topics where code = 'T2.TK'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T2.TD', 'Tư duy, nâng cao', 'Dạng toán nâng cao: tìm số chưa biết, quy luật, bài toán nhiều bước, tuổi, đếm hình.', 7, false from public.subjects where code = 'toan-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.TD.01', 'Tìm thành phần chưa biết của phép tính (tìm số hạng, số bị trừ, số trừ, thừa số).', 1, 1, false from public.curriculum_topics where code = 'T2.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.TD.02', 'Tìm quy luật của dãy số, dãy hình và viết tiếp.', 1, 2, false from public.curriculum_topics where code = 'T2.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.TD.03', 'Giải bài toán hai bước, bài toán về tuổi, bài toán so sánh nhiều đối tượng.', 2, 3, false from public.curriculum_topics where code = 'T2.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T2.TD.04', 'Lập số theo điều kiện; tìm số lớn nhất, bé nhất; đếm hình.', 2, 4, false from public.curriculum_topics where code = 'T2.TD'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V2.DOC', 'Đọc hiểu', 'Hiểu chi tiết, ý chính và nhân vật của bài đọc ngắn.', 1, true from public.subjects where code = 'tieng-viet-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.DOC.01', 'Trả lời được câu hỏi về chi tiết rõ ràng trong bài đọc.', 1, 1, true from public.curriculum_topics where code = 'V2.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.DOC.02', 'Hiểu ý chính, điều bài đọc muốn nói.', 2, 2, true from public.curriculum_topics where code = 'V2.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.DOC.03', 'Nhận xét được nhân vật, liên hệ với bản thân.', 2, 3, true from public.curriculum_topics where code = 'V2.DOC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V2.TU', 'Từ ngữ', 'Từ chỉ sự vật, hoạt động, đặc điểm; mở rộng vốn từ theo chủ điểm.', 2, true from public.subjects where code = 'tieng-viet-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.TU.01', 'Nhận biết từ chỉ sự vật (người, đồ vật, con vật, cây cối).', 1, 1, true from public.curriculum_topics where code = 'V2.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.TU.02', 'Nhận biết từ chỉ hoạt động.', 1, 2, true from public.curriculum_topics where code = 'V2.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.TU.03', 'Nhận biết từ chỉ đặc điểm (màu sắc, hình dáng, tính nết).', 1, 3, true from public.curriculum_topics where code = 'V2.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.TU.04', 'Mở rộng vốn từ theo chủ điểm của bài học.', 1, 4, true from public.curriculum_topics where code = 'V2.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.TU.05', 'Tìm từ có nghĩa giống nhau, trái ngược nhau.', 2, 5, false from public.curriculum_topics where code = 'V2.TU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V2.CAU', 'Câu và dấu câu', 'Câu giới thiệu, câu nêu hoạt động, câu nêu đặc điểm; dấu câu.', 3, true from public.subjects where code = 'tieng-viet-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.CAU.01', 'Nhận biết và đặt câu giới thiệu (Ai là gì?).', 1, 1, true from public.curriculum_topics where code = 'V2.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.CAU.02', 'Nhận biết và đặt câu nêu hoạt động (Ai làm gì?).', 1, 2, true from public.curriculum_topics where code = 'V2.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.CAU.03', 'Nhận biết và đặt câu nêu đặc điểm (Ai thế nào?).', 1, 3, true from public.curriculum_topics where code = 'V2.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.CAU.04', 'Dùng đúng dấu chấm, dấu chấm hỏi, dấu chấm than, dấu phẩy.', 1, 4, true from public.curriculum_topics where code = 'V2.CAU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V2.CT', 'Chính tả và chữ viết', 'Bảng chữ cái, phân biệt âm vần dễ lẫn, viết hoa.', 4, true from public.subjects where code = 'tieng-viet-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.CT.01', 'Thuộc bảng chữ cái, xếp từ theo thứ tự chữ cái.', 1, 1, true from public.curriculum_topics where code = 'V2.CT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.CT.02', 'Phân biệt các âm, vần, dấu thanh dễ lẫn (c/k, g/gh, ng/ngh, s/x, ch/tr, d/gi/r, l/n, hỏi/ngã...).', 1, 2, true from public.curriculum_topics where code = 'V2.CT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.CT.03', 'Viết hoa tên người, tên địa lí Việt Nam.', 2, 3, true from public.curriculum_topics where code = 'V2.CT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V2.VIET', 'Viết đoạn ngắn', 'Sắp xếp câu thành đoạn; chọn câu phù hợp để giới thiệu, kể, tả.', 5, true from public.subjects where code = 'tieng-viet-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V2.VIET.01', 'Sắp xếp các câu thành đoạn văn hợp lí; chọn câu phù hợp khi viết đoạn ngắn.', 2, 1, true from public.curriculum_topics where code = 'V2.VIET'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A2.LANG', 'Tiếng Anh 2 theo chủ đề', 'Từ vựng, âm và mẫu câu theo 16 unit của Tiếng Anh 2.', 1, true from public.subjects where code = 'tieng-anh-2'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A2.TU.01', 'Nhận biết và hiểu nghĩa từ vựng của unit.', 1, 1, true from public.curriculum_topics where code = 'A2.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A2.AM.01', 'Nhận biết âm/chữ cái trọng tâm của unit trong từ.', 1, 2, true from public.curriculum_topics where code = 'A2.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A2.CAU.01', 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', 1, 3, true from public.curriculum_topics where code = 'A2.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A2.SO.01', 'Đọc, viết số đếm từ 11 đến 20.', 3, 4, true from public.curriculum_topics where code = 'A2.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A2.ON.01', 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', 2, 5, true from public.curriculum_topics where code = 'A2.LANG'
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
