-- SINH TỰ ĐỘNG từ src/lib/curriculum/grade1.ts — không sửa tay, hãy sửa file nguồn rồi sinh lại.
-- Chạy lại nhiều lần không sao: dòng đã có (trùng code) được giữ nguyên.
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T1.SO', 'Đếm, đọc, viết và so sánh số', 'Số tự nhiên trong phạm vi 10, 20 rồi 100, theo từng giai đoạn.', 1, true from public.subjects where code = 'toan-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.01', 'Đếm, đọc, viết được các số trong phạm vi 10.', 1, 1, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.02', 'So sánh, xếp thứ tự các số trong phạm vi 10; dùng dấu >, <, =.', 1, 2, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.03', 'Đếm, đọc, viết được các số trong phạm vi 20.', 2, 3, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.04', 'Đếm, đọc, viết được các số trong phạm vi 100.', 3, 4, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.05', 'Nhận biết được chục và đơn vị, số tròn chục.', 3, 5, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.06', 'So sánh, xếp thứ tự các số trong phạm vi 100 (nhóm không quá 4 số).', 3, 6, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T1.PT', 'Phép cộng, phép trừ và bài toán có lời văn', 'Ý nghĩa phép cộng, trừ; tính nhẩm; giải quyết vấn đề đơn giản.', 2, true from public.subjects where code = 'toan-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.01', 'Nhận biết được ý nghĩa của phép cộng, phép trừ.', 1, 1, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.02', 'Thực hiện được tính nhẩm phép cộng, phép trừ trong phạm vi 10.', 1, 2, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.03', 'Nhận biết ý nghĩa thực tế của phép cộng, phép trừ qua tranh ảnh, tình huống thực tế.', 1, 3, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.04', 'Thực hiện được phép cộng, phép trừ (không nhớ) các số trong phạm vi 100.', 3, 4, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.05', 'Tính nhẩm được phép cộng, phép trừ các số tròn chục.', 3, 5, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.06', 'Làm quen với việc thực hiện tính toán có hai dấu phép tính, theo thứ tự từ trái sang phải.', 2, 6, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.07', 'Viết được phép tính thích hợp với câu trả lời của bài toán có lời văn và tính đúng kết quả.', 2, 7, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T1.HH', 'Hình học trực quan, đo lường và vận dụng', 'Vị trí, hình phẳng, hình khối, độ dài, giờ và lịch; vận dụng vào đời sống.', 3, true from public.subjects where code = 'toan-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.01', 'Nhận biết vị trí, định hướng: trên – dưới, phải – trái, trước – sau, ở giữa.', 1, 1, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.02', 'Nhận dạng hình vuông, hình tròn, hình tam giác, hình chữ nhật qua đồ vật thật.', 1, 2, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.03', 'Nhận dạng khối lập phương, khối hộp chữ nhật.', 2, 3, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.04', 'Lắp ghép, xếp được các hình đơn giản.', 2, 4, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.05', 'Nhận biết dài hơn, ngắn hơn; đơn vị xăng-ti-mét; đọc, viết số đo độ dài trong phạm vi 100 cm.', 3, 5, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.06', 'Đo, ước lượng độ dài bằng đơn vị không chính thức (gang tay, bước chân) và bằng thước cm.', 3, 6, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.07', 'Biết một tuần có 7 ngày, tên và thứ tự các ngày trong tuần.', 3, 7, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.08', 'Đọc giờ đúng trên đồng hồ; xem lịch tờ hằng ngày.', 3, 8, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.09', 'Giải quyết vấn đề thực tế đơn giản liên quan đến đo độ dài, xem giờ, xem lịch.', 3, 9, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.AM', 'Âm, chữ, vần và thanh điệu', 'Nhận biết âm, chữ cái, vần, thanh điệu và dấu thanh; quy tắc chính tả cơ bản.', 1, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.01', 'Nhận biết và đọc đúng các âm, chữ cái.', 1, 1, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.02', 'Nhận biết thanh điệu và dấu thanh; đặt dấu thanh đúng vị trí.', 1, 2, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.03', 'Nhận biết và đọc đúng các vần.', 2, 3, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.04', 'Phân biệt quy tắc chính tả c/k, g/gh, ng/ngh.', 2, 4, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.DOC', 'Ghép tiếng, đọc từ, câu và đoạn ngắn', 'Đọc đúng, đọc trơn và hiểu nội dung đơn giản theo tiến trình học.', 2, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.01', 'Ghép âm, vần, thanh thành tiếng; đọc đúng tiếng, từ.', 1, 1, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.02', 'Đọc đúng, rõ ràng câu và đoạn văn ngắn (khoảng 40–60 tiếng/phút).', 3, 2, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.03', 'Ngắt nghỉ hơi đúng ở dấu phẩy, dấu chấm, chỗ kết thúc dòng thơ.', 3, 3, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.04', 'Trả lời câu hỏi đơn giản về chi tiết nổi bật, tường minh trong văn bản.', 2, 4, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.05', 'Liên hệ tranh minh hoạ với chi tiết trong văn bản.', 2, 5, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.06', 'Nhận biết trình tự sự việc trong văn bản thông tin ngắn; hiểu kí hiệu đơn giản, quen thuộc.', 3, 6, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.VIET', 'Viết chữ, chính tả, từ ngữ và câu đơn giản', 'Kĩ thuật viết, chính tả, vốn từ và viết câu ngắn.', 3, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.01', 'Viết đúng chữ thường, chữ số 0–9; bước đầu viết chữ hoa.', 1, 1, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.02', 'Viết đúng chính tả bài nghe – viết, nhìn – viết khoảng 30–35 chữ.', 3, 2, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.03', 'Viết hoa chữ cái đầu câu, đầu tên riêng.', 3, 3, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.04', 'Mở rộng vốn từ: từ ngữ chỉ sự vật, hoạt động, đặc điểm quen thuộc.', 2, 4, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.05', 'Dùng đúng dấu chấm, dấu chấm hỏi.', 3, 5, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.06', 'Điền phần thông tin còn trống; viết câu trả lời, chú thích cho tranh.', 3, 6, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.NN', 'Nghe và nói', 'Nói rõ ràng thành câu, nghe hiểu, giao tiếp lịch sự theo yêu cầu từng giai đoạn.', 4, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.01', 'Nói rõ ràng, thành câu; biết chào hỏi, cảm ơn, xin lỗi, xin phép phù hợp.', 1, 1, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.02', 'Nghe hiểu thông báo, hướng dẫn, yêu cầu, nội quy trong lớp học.', 1, 2, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.03', 'Nghe câu chuyện, trả lời được câu hỏi: ai, cái gì, khi nào, ở đâu.', 2, 3, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.04', 'Kể lại câu chuyện ngắn dựa vào tranh và câu hỏi gợi ý.', 3, 4, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.HELLO', 'Chào hỏi và làm quen', 'Cụm từ chào hỏi, giới thiệu tên, mệnh lệnh lớp học đơn giản.', 1, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.HELLO.01', 'Nghe và đáp lại lời chào: Hello, Hi, Goodbye.', 1, 1, true from public.curriculum_topics where code = 'A1.HELLO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.HELLO.02', 'Hiểu và làm theo chỉ dẫn đơn giản trong lớp (Stand up, Sit down…).', 1, 2, true from public.curriculum_topics where code = 'A1.HELLO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.HELLO.03', 'Nói câu giới thiệu tên: I’m …', 2, 3, false from public.curriculum_topics where code = 'A1.HELLO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.ABC', 'Chữ cái và âm đầu', 'Khoảng 13 chữ cái đầu tiên và âm đầu của từ.', 2, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.ABC.01', 'Nghe, nhận biết khoảng 13 chữ cái đã học.', 1, 1, true from public.curriculum_topics where code = 'A1.ABC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.ABC.02', 'Nhận biết âm đầu của từ quen thuộc.', 2, 2, true from public.curriculum_topics where code = 'A1.ABC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.NUM', 'Số đếm 1–10', 'Nghe, nói số đếm trong phạm vi 10.', 3, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.NUM.01', 'Nghe hiểu các số đếm trong phạm vi 10.', 1, 1, true from public.curriculum_topics where code = 'A1.NUM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.NUM.02', 'Đếm và nói số lượng đồ vật (1–10).', 2, 2, true from public.curriculum_topics where code = 'A1.NUM'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.COLOUR', 'Màu sắc', 'Từ vựng màu sắc cơ bản.', 4, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.COLOUR.01', 'Nghe, nhận biết và nói tên các màu cơ bản.', 1, 1, true from public.curriculum_topics where code = 'A1.COLOUR'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.COLOUR.02', 'Trả lời câu hỏi What colour is it? ở mức từ.', 2, 2, true from public.curriculum_topics where code = 'A1.COLOUR'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.SCHOOL', 'Đồ dùng học tập', 'Đồ vật trong lớp: pen, book, ruler, bag…', 5, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.SCHOOL.01', 'Nghe, nhận biết và nói tên đồ dùng học tập quen thuộc.', 2, 1, true from public.curriculum_topics where code = 'A1.SCHOOL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.FAMILY', 'Gia đình', 'Thành viên gia đình: mother, father, brother, sister…', 6, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.FAMILY.01', 'Nghe, nhận biết và nói tên thành viên trong gia đình.', 2, 1, true from public.curriculum_topics where code = 'A1.FAMILY'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.FAMILY.02', 'Giới thiệu thành viên gia đình bằng câu This is my …', 3, 2, false from public.curriculum_topics where code = 'A1.FAMILY'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.ANIMAL', 'Con vật', 'Con vật quen thuộc: cat, dog, fish, bird…', 7, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.ANIMAL.01', 'Nghe, nhận biết và nói tên các con vật quen thuộc.', 3, 1, true from public.curriculum_topics where code = 'A1.ANIMAL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.EXTRA', 'Chủ đề mở rộng', 'Đồ chơi, quả và đồ ăn, bộ phận cơ thể — chọn theo sách nhà trường dùng.', 8, false from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.EXTRA.01', 'Nhận biết tên đồ chơi quen thuộc.', 3, 1, false from public.curriculum_topics where code = 'A1.EXTRA'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.EXTRA.02', 'Nhận biết tên quả và đồ ăn quen thuộc.', 3, 2, false from public.curriculum_topics where code = 'A1.EXTRA'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.EXTRA.03', 'Nhận biết tên bộ phận cơ thể.', 3, 3, false from public.curriculum_topics where code = 'A1.EXTRA'
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
