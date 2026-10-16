-- SINH TỰ ĐỘNG từ src/lib/curriculum/grade5.ts — không sửa tay, hãy sửa file nguồn rồi sinh lại.
-- Chạy lại nhiều lần không sao: dòng đã có (trùng code) được giữ nguyên.
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T5.SO', 'Số tự nhiên, phân số, hỗn số', 'Ôn số tự nhiên và phân số; phân số thập phân; hỗn số.', 1, true from public.subjects where code = 'toan-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.SO.01', 'Đọc, viết, so sánh, tính với số tự nhiên.', 1, 1, true from public.curriculum_topics where code = 'T5.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.SO.02', 'Rút gọn, quy đồng, so sánh, tính với phân số.', 1, 2, true from public.curriculum_topics where code = 'T5.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.SO.03', 'Nhận biết phân số thập phân, hỗn số.', 1, 3, true from public.curriculum_topics where code = 'T5.SO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T5.STP', 'Số thập phân', 'Khái niệm, so sánh, làm tròn, viết số đo dưới dạng số thập phân; bốn phép tính.', 2, true from public.subjects where code = 'toan-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.STP.01', 'Đọc, viết số thập phân; hàng của số thập phân.', 1, 1, true from public.curriculum_topics where code = 'T5.STP'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.STP.02', 'So sánh, sắp xếp, làm tròn số thập phân.', 1, 2, true from public.curriculum_topics where code = 'T5.STP'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.STP.03', 'Viết số đo đại lượng dưới dạng số thập phân.', 1, 3, true from public.curriculum_topics where code = 'T5.STP'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.STP.04', 'Cộng, trừ, nhân, chia số thập phân; nhân, chia với 10, 100, 1000 và 0,1; 0,01; 0,001.', 2, 4, true from public.curriculum_topics where code = 'T5.STP'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T5.TS', 'Tỉ số, tỉ số phần trăm', 'Tỉ số; tỉ lệ bản đồ; tổng – tỉ, hiệu – tỉ; tỉ số phần trăm.', 3, true from public.subjects where code = 'toan-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.TS.01', 'Nhận biết tỉ số, tỉ số phần trăm; tỉ lệ bản đồ.', 3, 1, true from public.curriculum_topics where code = 'T5.TS'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.TS.02', 'Tìm hai số khi biết tổng (hiệu) và tỉ số.', 3, 2, true from public.curriculum_topics where code = 'T5.TS'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.TS.03', 'Tìm tỉ số phần trăm của hai số; tìm giá trị phần trăm của một số.', 3, 3, true from public.curriculum_topics where code = 'T5.TS'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T5.HH', 'Hình học', 'Tam giác, hình thang, hình tròn; hình hộp chữ nhật, hình lập phương, hình trụ.', 4, true from public.subjects where code = 'toan-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.HH.01', 'Tính diện tích hình tam giác, hình thang.', 2, 1, true from public.curriculum_topics where code = 'T5.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.HH.02', 'Tính chu vi, diện tích hình tròn.', 2, 2, true from public.curriculum_topics where code = 'T5.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.HH.03', 'Tính diện tích xung quanh, toàn phần, thể tích hình hộp chữ nhật, hình lập phương.', 3, 3, true from public.curriculum_topics where code = 'T5.HH'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T5.DL', 'Đo lường', 'km², ha; cm³, dm³, m³; số đo thời gian; vận tốc, quãng đường, thời gian.', 5, true from public.subjects where code = 'toan-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.DL.01', 'Đổi các đơn vị đo diện tích (km², ha, m²…).', 1, 1, true from public.curriculum_topics where code = 'T5.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.DL.02', 'Đổi các đơn vị đo thể tích.', 3, 2, true from public.curriculum_topics where code = 'T5.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.DL.03', 'Cộng, trừ, nhân, chia số đo thời gian.', 3, 3, true from public.curriculum_topics where code = 'T5.DL'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.DL.04', 'Tính vận tốc, quãng đường, thời gian của chuyển động đều.', 3, 4, true from public.curriculum_topics where code = 'T5.DL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T5.TK', 'Thống kê và xác suất', 'Thu thập, sắp xếp số liệu; biểu đồ hình quạt tròn; tỉ số số lần lặp lại một sự kiện.', 6, true from public.subjects where code = 'toan-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.TK.01', 'Đọc, phân tích số liệu; biểu đồ hình quạt tròn.', 3, 1, true from public.curriculum_topics where code = 'T5.TK'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.TK.02', 'Tính tỉ số của số lần lặp lại một sự kiện so với tổng số lần thực hiện.', 3, 2, true from public.curriculum_topics where code = 'T5.TK'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T5.TD', 'Tư duy, nâng cao', 'Bài toán nhiều bước: tỉ số, phần trăm, chuyển động, hình học.', 7, false from public.subjects where code = 'toan-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.TD.01', 'Giải bài toán nhiều bước với số thập phân, phân số.', 2, 1, false from public.curriculum_topics where code = 'T5.TD'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T5.TD.02', 'Giải bài toán nâng cao về tỉ số, phần trăm, chuyển động, hình học.', 3, 2, false from public.curriculum_topics where code = 'T5.TD'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V5.DOC', 'Đọc hiểu', 'Chi tiết, ý chính, nhân vật, ý nghĩa, liên hệ.', 1, true from public.subjects where code = 'tieng-viet-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.DOC.01', 'Trả lời câu hỏi về chi tiết trong bài đọc.', 1, 1, true from public.curriculum_topics where code = 'V5.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.DOC.02', 'Hiểu ý chính, chủ đề; nhận xét nhân vật, chi tiết.', 1, 2, true from public.curriculum_topics where code = 'V5.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.DOC.03', 'Suy luận, rút ra bài học, liên hệ bản thân.', 2, 3, true from public.curriculum_topics where code = 'V5.DOC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V5.TU', 'Từ và nghĩa của từ', 'Đại từ, kết từ; từ đồng nghĩa, từ đa nghĩa; điệp từ, điệp ngữ; từ điển.', 2, true from public.subjects where code = 'tieng-viet-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.TU.01', 'Nhận biết và dùng đại từ (xưng hô, thay thế, nghi vấn).', 1, 1, true from public.curriculum_topics where code = 'V5.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.TU.02', 'Nhận biết và dùng từ đồng nghĩa.', 1, 2, true from public.curriculum_topics where code = 'V5.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.TU.03', 'Nhận biết từ đa nghĩa; phân biệt nghĩa gốc, nghĩa chuyển.', 1, 3, true from public.curriculum_topics where code = 'V5.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.TU.04', 'Nhận biết và dùng kết từ.', 2, 4, true from public.curriculum_topics where code = 'V5.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.TU.05', 'Nhận biết biện pháp điệp từ, điệp ngữ.', 2, 5, true from public.curriculum_topics where code = 'V5.TU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.TU.06', 'Ôn danh từ, động từ, tính từ; dùng từ điển.', 1, 6, true from public.curriculum_topics where code = 'V5.TU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V5.CAU', 'Câu và liên kết câu', 'Câu đơn, câu ghép, cách nối vế câu ghép; liên kết câu bằng lặp, nối, thay thế.', 3, true from public.subjects where code = 'tieng-viet-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.CAU.01', 'Phân biệt câu đơn, câu ghép.', 3, 1, true from public.curriculum_topics where code = 'V5.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.CAU.02', 'Nối các vế câu ghép bằng kết từ, cặp kết từ, dấu câu.', 3, 2, true from public.curriculum_topics where code = 'V5.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.CAU.03', 'Liên kết câu bằng cách lặp từ ngữ, dùng từ ngữ nối, từ ngữ thay thế.', 3, 3, true from public.curriculum_topics where code = 'V5.CAU'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.CAU.04', 'Dùng đúng dấu gạch ngang và các dấu câu.', 2, 4, true from public.curriculum_topics where code = 'V5.CAU'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V5.CT', 'Chính tả, viết hoa', 'Viết hoa thể hiện sự tôn trọng; viết tên người, tên địa lí nước ngoài.', 4, true from public.subjects where code = 'tieng-viet-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.CT.01', 'Viết hoa danh từ chung để thể hiện sự tôn trọng đặc biệt.', 3, 1, true from public.curriculum_topics where code = 'V5.CT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V5.CT.02', 'Viết đúng tên người, tên địa lí nước ngoài.', 3, 2, true from public.curriculum_topics where code = 'V5.CT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A5.LANG', 'Tiếng Anh 5 theo chủ đề', 'Từ vựng, trọng âm và mẫu câu theo 20 unit của Tiếng Anh 5.', 1, true from public.subjects where code = 'tieng-anh-5'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A5.TU.01', 'Nhận biết và hiểu nghĩa từ vựng của unit.', 1, 1, true from public.curriculum_topics where code = 'A5.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A5.AM.01', 'Nhận biết chữ cái, cụm chữ trọng tâm của unit trong từ.', 1, 2, true from public.curriculum_topics where code = 'A5.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A5.CAU.01', 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', 1, 3, true from public.curriculum_topics where code = 'A5.LANG'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A5.ON.01', 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', 2, 4, true from public.curriculum_topics where code = 'A5.LANG'
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
