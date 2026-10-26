// Bài mẫu 3D dựng sẵn (lời giảng, câu hỏi do EduChain Kids tự viết) + khung bài STEM 5 bước cho các bài còn lại.
import { ASSET_BY_ID } from './assets';
import { STEM_LESSONS, stemKey, type StemLesson } from './stem-catalog';
import { emptyLesson, uid, type Lesson3D, type Obj3D, type Scene3D } from './types';

function o(type: string, x: number, z: number, extra: Partial<Obj3D> = {}): Obj3D {
  const a = ASSET_BY_ID[type];
  return { id: uid(), type, x, y: a?.y ?? 0, z, ry: 0, s: 1, color: a?.color ?? '#999999', name: a?.name ?? type, spot: { on: false, title: '', text: '' }, fx: { type: '', speed: 1 }, ...extra };
}
const spot = (title: string, text: string) => ({ on: true, title, text });
const sc = (caption: string, cam: number[], tgt: number[], focus = ''): Scene3D => ({ caption, cam, tgt, focus });
const HOME = { cam: [13, 9, 15], tgt: [0, 1.5, 0] };

export type Template = { id: string; title: string; grade: number; subject: string; stem?: string; desc: string; make: () => Lesson3D };

export const TEMPLATES: Template[] = [
  { id: 'water', title: 'Sự chuyển thể của nước', grade: 4, subject: 'Khoa học', stem: '4-1', desc: 'Nước đá tan, nước bay hơi, mây, mưa; thanh nhiệt độ điều khiển.', make: () => {
    const sun = o('sun', 7, -5, { y: 7, fx: { type: 'pulse', speed: 0.6 }, spot: spot('Nhiệt từ Mặt Trời', 'Mặt Trời làm nước nóng lên. Nước càng nóng thì bay hơi càng nhanh.') });
    const sea = o('sea', 5, 2, { fx: { type: 'up', speed: 1 }, spot: spot('Bay hơi', 'Nước ở thể lỏng nóng lên biến thành hơi nước (thể khí) bay lên cao.') });
    const cloud = o('cloud', -3, -1, { y: 6, fx: { type: 'rain', speed: 1 }, spot: spot('Ngưng tụ và mưa', 'Hơi nước gặp lạnh trên cao ngưng tụ thành giọt nước nhỏ, tụ lại thành mây rồi rơi xuống thành mưa.') });
    const ice = o('ice', -6, 4, { spot: spot('Nước ở thể rắn', 'Nước đá là nước ở thể rắn. Gặp nóng, nước đá tan thành nước lỏng (nóng chảy).'), fx: { type: 'heat', speed: 0.6 } });
    const mt = o('mountain', -6, -3, { spot: spot('Đông đặc', 'Trên núi cao rất lạnh, nước có thể đông đặc thành băng tuyết.') });
    return { ...emptyLesson(4, 'Sự chuyển thể của nước'), subject: 'Khoa học', stem: '4-1', base: 'grass',
      objects: [sun, sea, cloud, ice, mt, o('pot', -1.5, 4, { fx: { type: 'up', speed: 1.3 }, spot: spot('Đun nước', 'Đun nóng, nước trong nồi sôi và bay hơi rất nhanh.') }), o('tree', 1, -4), o('label', 0, 6, { y: 3.4, name: 'Rắn – Lỏng – Khí' })],
      links: [{ id: uid(), from: sea.id, to: cloud.id, kind: 'arrow', label: 'Bay hơi' }, { id: uid(), from: cloud.id, to: mt.id, kind: 'arrow', label: 'Mưa' }, { id: uid(), from: ice.id, to: sea.id, kind: 'arrow', label: 'Nóng chảy' }],
      controls: [{ id: uid(), label: 'Nắng Mặt Trời', kind: 'slider', action: 'speed', targets: [sea.id, cloud.id, sun.id] }],
      scenes: [sc('Nước có ở những thể nào? Hãy tìm nước ở thể rắn, lỏng và khí trên sa bàn.', HOME.cam, HOME.tgt), sc('Nước đá gặp nóng thì sao?', [-1, 4, 11], [-5, 0.5, 3], ice.id), sc('Nắng làm nước biển nóng lên và bay hơi.', [14, 6, 10], [5, 1.5, 1], sea.id), sc('Hơi nước gặp lạnh ngưng tụ thành mây, rồi mưa rơi xuống.', [4, 7, 12], [-3, 4, -1], cloud.id)],
      quiz: [{ type: 'spot', q: 'Bấm vào nơi có nước ở thể rắn.', target: ice.id }, { type: 'choice', q: 'Hơi nước gặp lạnh sẽ thế nào?', opts: ['Ngưng tụ thành giọt nước', 'Nóng chảy', 'Biến mất'], a: 0 }] };
  } },
  { id: 'solar', title: 'Mặt Trời – Trái Đất – Mặt Trăng', grade: 3, subject: 'Tự nhiên và Xã hội', stem: '3-16', desc: 'Trái Đất tự quay và quay quanh Mặt Trời, Mặt Trăng quay quanh.', make: () => {
    const sun = o('sun', 0, 0, { y: 2.5, s: 1.6, fx: { type: 'pulse', speed: 0.5 }, spot: spot('Mặt Trời', 'Mặt Trời là một ngôi sao, tự phát ra ánh sáng và nhiệt.') });
    const earth = o('earth', 6, 0, { y: 2.2, fx: { type: 'orbit', speed: 0.6 }, spot: spot('Trái Đất', 'Trái Đất là hành tinh chúng ta sống. Trái Đất vừa tự quay quanh mình vừa quay quanh Mặt Trời.') });
    const moon = o('moon', 8.5, 0, { y: 2.6, fx: { type: 'orbit', speed: 0.6 }, spot: spot('Mặt Trăng', 'Mặt Trăng là vệ tinh của Trái Đất, không tự phát sáng mà phản chiếu ánh sáng Mặt Trời.') });
    return { ...emptyLesson(3, 'Mặt Trời – Trái Đất – Mặt Trăng'), subject: 'Tự nhiên và Xã hội', stem: '3-16', base: 'space', objects: [sun, earth, moon],
      links: [], controls: [{ id: uid(), label: 'Tốc độ quay', kind: 'slider', action: 'speed', targets: [earth.id, moon.id] }],
      scenes: [sc('Quan sát hệ Mặt Trời thu nhỏ: đâu là Mặt Trời, Trái Đất, Mặt Trăng?', [0, 12, 16], [0, 2, 0]), sc('Trái Đất tự quay nên có ngày và đêm.', [9, 5, 8], [5, 2, 0], earth.id), sc('Mặt Trăng là vệ tinh của Trái Đất.', [10, 5, 6], [7, 2.5, 0], moon.id)],
      quiz: [{ type: 'spot', q: 'Bấm vào vệ tinh của Trái Đất.', target: moon.id }, { type: 'choice', q: 'Vì sao có ngày và đêm?', opts: ['Vì Trái Đất tự quay quanh mình', 'Vì Mặt Trời tắt', 'Vì có mây che'], a: 0 }] };
  } },
  { id: 'daynight', title: 'Bầu trời ngày và đêm', grade: 1, subject: 'Tự nhiên và Xã hội', stem: '1-15', desc: 'Ban ngày có Mặt Trời, ban đêm có Mặt Trăng và sao.', make: () => {
    const sun = o('sun', -6, -4, { y: 6, spot: spot('Ban ngày', 'Ban ngày có Mặt Trời chiếu sáng, trời sáng và ấm.') });
    const moon = o('moon', 6, -4, { y: 6, spot: spot('Ban đêm', 'Ban đêm trời tối, ta thấy Mặt Trăng và các vì sao.') });
    const star = o('star', 4, -2, { y: 7, fx: { type: 'blink', speed: 0.6 } });
    return { ...emptyLesson(1, 'Bầu trời ngày và đêm'), subject: 'Tự nhiên và Xã hội', stem: '1-15', base: 'grass',
      objects: [sun, moon, star, o('star', 8, -1, { y: 6.5, fx: { type: 'blink', speed: 0.8 } }), o('house', 0, 0), o('tree', -3, 2), o('kid', 2, 2), o('cloud', -2, -3, { y: 5 })], links: [], controls: [],
      scenes: [sc('Bầu trời có gì vào ban ngày? Có gì vào ban đêm?', HOME.cam, HOME.tgt), sc('Ban ngày: Mặt Trời chiếu sáng.', [-2, 5, 10], [-5, 4, -3], sun.id), sc('Ban đêm: Mặt Trăng và các vì sao.', [9, 5, 9], [5, 5, -3], moon.id)],
      quiz: [{ type: 'spot', q: 'Bấm vào thứ chiếu sáng ban ngày.', target: sun.id }] };
  } },
  { id: 'traffic', title: 'Đèn tín hiệu và biển báo', grade: 1, subject: 'Tự nhiên và Xã hội', stem: '1-7', desc: 'Đèn giao thông đổi màu, biển báo, vạch qua đường.', make: () => {
    const light = o('traffic', 2.5, -1.8, { on: true, fx: { type: 'traffic', speed: 1 }, spot: spot('Đèn tín hiệu', 'Đèn đỏ: dừng lại. Đèn vàng: đi chậm, chuẩn bị dừng. Đèn xanh: được đi.') });
    const cw = o('crosswalk', 0, 0, { spot: spot('Vạch qua đường', 'Đi bộ qua đường đúng vạch kẻ trắng khi đèn cho người đi bộ bật xanh.') });
    const stop = o('sign-stop', -3, -2, { spot: spot('Biển cấm', 'Biển tròn viền đỏ là biển cấm. Biển này cấm đi ngược chiều.') });
    const warn = o('sign-warn', -6, 2, { spot: spot('Biển nguy hiểm', 'Biển tam giác vàng viền đỏ báo phía trước có nguy hiểm, cần đi chậm.') });
    return { ...emptyLesson(1, 'Đèn tín hiệu và biển báo giao thông'), subject: 'Tự nhiên và Xã hội', stem: '1-7', base: 'road',
      objects: [cw, light, stop, warn, o('sign-info', 6, 2, { name: 'Trường học' }), o('car', -5, 0.5, { ry: 0 }), o('kid', 0.5, 1.6), o('house', -7, -5), o('tree', 6, -5)], links: [],
      controls: [{ id: uid(), label: 'Đèn giao thông', kind: 'switch', action: 'on', targets: [light.id] }],
      scenes: [sc('Trên đường có những gì giúp mọi người đi lại an toàn?', HOME.cam, HOME.tgt), sc('Đèn tín hiệu đổi màu: đỏ, vàng, xanh.', [6, 4, 6], [2.5, 2.2, -1.8], light.id), sc('Biển báo có nhiều hình dạng: tròn, tam giác, vuông.', [-2, 4, 9], [-4, 1.4, 0], stop.id), sc('Đi bộ qua đường ở đâu?', [3, 5, 7], [0, 0, 0], cw.id)],
      quiz: [{ type: 'choice', q: 'Đèn màu gì thì phải dừng lại?', opts: ['Đèn đỏ', 'Đèn xanh', 'Đèn vàng'], a: 0 }, { type: 'spot', q: 'Bấm vào biển báo hình tam giác.', target: warn.id }] };
  } },
  { id: 'plant', title: 'Các bộ phận của cây', grade: 3, subject: 'Tự nhiên và Xã hội', stem: '3-7', desc: 'Tách rời rễ, thân, lá, hoa, quả để quan sát.', make: () => {
    const p = o('plant-parts', 0, 0, { s: 1.6, spot: spot('Cây xanh', 'Cây thường có rễ, thân, lá, hoa và quả. Mỗi bộ phận làm một việc khác nhau.') });
    return { ...emptyLesson(3, 'Các bộ phận của cây'), subject: 'Tự nhiên và Xã hội', stem: '3-7', base: 'grass',
      objects: [p, o('tree', -6, -3), o('fruit-tree', 6, -3), o('flower', 4, 3), o('flower', 5, 2.4, { color: '#f59e0b' }), o('pot-plant', -5, 3), o('label', 0, -4, { y: 4.4, name: 'Rễ · Thân · Lá · Hoa · Quả' })], links: [],
      controls: [{ id: uid(), label: 'Tách các bộ phận', kind: 'switch', action: 'split', targets: [p.id] }],
      scenes: [sc('Cây gồm những bộ phận nào?', [10, 6, 13], [0, 3, 0], p.id), sc('Bật "Tách các bộ phận" để xem riêng từng phần: rễ hút nước, thân nâng đỡ, lá làm thức ăn.', [8, 5, 11], [0, 3, 0], p.id), sc('So sánh với các cây khác xung quanh.', HOME.cam, HOME.tgt)],
      quiz: [{ type: 'choice', q: 'Bộ phận nào hút nước cho cây?', opts: ['Rễ', 'Hoa', 'Quả'], a: 0 }] };
  } },
  { id: 'foodchain', title: 'Chuỗi thức ăn', grade: 4, subject: 'Khoa học', stem: '4-14', desc: 'Mũi tên nối: cỏ → châu chấu → ếch → cáo.', make: () => {
    const g = o('grass', -6, 0, { s: 2, spot: spot('Cỏ', 'Cỏ tự làm ra thức ăn nhờ ánh sáng. Cỏ là thức ăn của châu chấu.') });
    const h = o('grasshopper', -2, 0, { s: 1.6, spot: spot('Châu chấu', 'Châu chấu ăn cỏ, rồi lại là thức ăn của ếch.') });
    const f = o('frog', 2, 0, { s: 1.4, spot: spot('Ếch', 'Ếch ăn châu chấu và là thức ăn của cáo, rắn…') });
    const fx = o('fox', 6, 0, { spot: spot('Cáo', 'Cáo ăn ếch. Khi chết, xác cáo lại thành chất dinh dưỡng cho đất và cỏ.') });
    return { ...emptyLesson(4, 'Chuỗi thức ăn trong tự nhiên'), subject: 'Khoa học', stem: '4-14', base: 'grass',
      objects: [g, h, f, fx, o('sun', -6, -6, { y: 6 }), o('lake', 2, -4), o('tree', 8, -5)],
      links: [{ id: uid(), from: g.id, to: h.id, kind: 'arrow', label: 'bị ăn bởi' }, { id: uid(), from: h.id, to: f.id, kind: 'arrow', label: 'bị ăn bởi' }, { id: uid(), from: f.id, to: fx.id, kind: 'arrow', label: 'bị ăn bởi' }],
      controls: [], scenes: [sc('Con vật nào ăn con vật nào? Theo dõi các mũi tên.', [0, 7, 13], [0, 1, 0]), sc('Mở đầu chuỗi thức ăn thường là cây xanh.', [-4, 3, 6], [-5, 0.5, 0], g.id), sc('Cuối chuỗi là con vật không bị con nào trong chuỗi ăn.', [8, 3, 6], [6, 0.8, 0], fx.id)],
      quiz: [{ type: 'spot', q: 'Bấm vào sinh vật đứng đầu chuỗi thức ăn.', target: g.id }, { type: 'choice', q: 'Ếch ăn gì trong chuỗi này?', opts: ['Châu chấu', 'Cỏ', 'Cáo'], a: 0 }] };
  } },
  { id: 'circuit', title: 'Mạch điện đơn giản', grade: 5, subject: 'Khoa học', stem: '5-4', desc: 'Pin – công tắc – bóng đèn; đóng công tắc thì đèn sáng.', make: () => {
    const b = o('battery', -4, 1.5, { s: 1.5, spot: spot('Pin', 'Pin là nguồn điện. Dòng điện đi từ một cực, qua dây dẫn, về cực còn lại.') });
    const sw = o('switch', 0, -2, { s: 1.5, on: false, spot: spot('Công tắc', 'Công tắc đóng thì mạch kín, đèn sáng. Công tắc mở thì mạch hở, đèn tắt.') });
    const bulb = o('bulb', 4, 1.5, { s: 1.5, on: false, spot: spot('Bóng đèn', 'Bóng đèn sáng khi có dòng điện chạy qua.') });
    return { ...emptyLesson(5, 'Mạch điện đơn giản'), subject: 'Khoa học', stem: '5-4', base: 'desk', objects: [b, sw, bulb, o('label', 0, -4, { y: 2.6, name: 'Mạch kín – Mạch hở' })],
      links: [{ id: uid(), from: b.id, to: sw.id, kind: 'wire', label: '' }, { id: uid(), from: sw.id, to: bulb.id, kind: 'wire', label: '' }, { id: uid(), from: bulb.id, to: b.id, kind: 'wire', label: 'Dây dẫn' }],
      controls: [{ id: uid(), label: 'Đóng công tắc', kind: 'switch', action: 'on', targets: [sw.id, bulb.id] }],
      scenes: [sc('Mạch điện gồm những bộ phận nào?', [0, 8, 9], [0, 0.5, 0]), sc('Bấm "Đóng công tắc" ở góc màn hình: đèn có sáng không?', [3, 5, 7], [1.5, 0.8, 0], bulb.id)],
      quiz: [{ type: 'choice', q: 'Khi công tắc mở, mạch điện là:', opts: ['Mạch hở – đèn tắt', 'Mạch kín – đèn sáng'], a: 0 }, { type: 'spot', q: 'Bấm vào nguồn điện của mạch.', target: b.id }] };
  } },
  { id: 'turbine', title: 'Máy phát điện gió', grade: 5, subject: 'Công nghệ', stem: '5-13', desc: 'Gió làm cánh quạt quay, đèn sáng; tách rời bộ phận để lắp ráp.', make: () => {
    const t = o('turbine', 0, -1, { s: 1.3, fx: { type: 'spin', speed: 1 }, spot: spot('Máy phát điện gió', 'Gió thổi làm cánh quạt quay, trục quay làm máy phát tạo ra điện.') });
    const w = o('wind-sock', -5, 1, { fx: { type: 'wind', speed: 1 }, spot: spot('Gió', 'Gió càng mạnh, cánh quạt quay càng nhanh, điện tạo ra càng nhiều.') });
    const bulb = o('bulb', 4, 2, { s: 1.4, on: true, spot: spot('Bóng đèn', 'Điện từ máy phát làm bóng đèn sáng.') });
    return { ...emptyLesson(5, 'Máy phát điện gió'), subject: 'Công nghệ', stem: '5-13', base: 'grass',
      objects: [t, w, bulb, o('ruler', 0, 3.5, { appear: 3 }), o('hill', -7, -5), o('tree', 7, -4)],
      links: [{ id: uid(), from: t.id, to: bulb.id, kind: 'wire', label: 'Dây điện' }],
      controls: [{ id: uid(), label: 'Sức gió', kind: 'slider', action: 'speed', targets: [t.id, w.id] }, { id: uid(), label: 'Tách rời bộ phận', kind: 'switch', action: 'split', targets: [t.id] }],
      scenes: [sc('Làm thế nào để tạo ra điện từ gió?', HOME.cam, HOME.tgt), sc('Kéo thanh "Sức gió": cánh quạt quay nhanh hay chậm?', [11, 7, 13], [0, 3, -1], t.id), sc('Tách rời bộ phận: chân đế, trụ, thân máy, cánh quạt. Đo chiều dài bằng thước.', [10, 6, 12], [0, 3, 0], t.id)],
      quiz: [{ type: 'choice', q: 'Gió mạnh hơn thì cánh quạt:', opts: ['Quay nhanh hơn', 'Đứng yên', 'Quay chậm hơn'], a: 0 }] };
  } },
  { id: 'tray10', title: 'Khay 10 học Toán', grade: 1, subject: 'Toán', stem: '1-1', desc: 'Đếm chấm tròn trên khay 10 ô, thẻ số.', make: () => {
    const tray = o('tray10', 0, 0, { s: 1.8, spot: spot('Khay 10', 'Khay có 10 ô, mỗi hàng 5 ô. Đặt mỗi chấm tròn vào một ô để đếm nhanh.') });
    const dots = [0, 1, 2, 3, 4, 5, 6].map((i) => o('counter', -2 + (i % 5) * 1, i < 5 ? -0.5 : 0.5, { y: 0.1, appear: i < 5 ? 2 : 3 }));
    const card = o('card', 5, 0, { name: '7', ry: -0.5, appear: 3, spot: spot('Số 7', 'Có 7 chấm tròn: một hàng đầy 5 và thêm 2.') });
    return { ...emptyLesson(1, 'Trải nghiệm cùng khay 10'), subject: 'Toán', stem: '1-1', base: 'desk', objects: [tray, ...dots, card], links: [], controls: [],
      scenes: [sc('Đây là khay 10. Khay có mấy ô?', [0, 7, 6], [0, 0, 0], tray.id), sc('Đặt 5 chấm tròn: đầy một hàng.', [0, 6, 5], [0, 0, 0]), sc('Thêm 2 chấm nữa. Tất cả có mấy chấm?', [2, 6, 6], [1, 0, 0], card.id)],
      quiz: [{ type: 'choice', q: 'Khay 10 đầy hai hàng có bao nhiêu chấm?', opts: ['10', '5', '7'], a: 0 }] };
  } },
  { id: 'clock', title: 'Đồng hồ và xem giờ', grade: 1, subject: 'Toán', stem: '1-14', desc: 'Kim giờ, kim phút chạy; có bản số La Mã (lớp 3).', make: () => {
    const c = o('clock', -2.5, 0, { s: 1.6, fx: { type: 'clock', speed: 1 }, spot: spot('Kim giờ và kim phút', 'Kim ngắn chỉ giờ, kim dài chỉ phút. Kim dài quay một vòng thì kim ngắn chỉ sang số tiếp theo.') });
    const r = o('clock', 2.5, 0, { s: 1.6, name: 'Đồng hồ La Mã', spot: spot('Số La Mã', 'Đồng hồ này dùng số La Mã: I = 1, V = 5, X = 10, XII = 12.') });
    return { ...emptyLesson(1, 'Đồng hồ và xem giờ'), subject: 'Toán', stem: '1-14', base: 'desk', objects: [c, r], links: [], controls: [{ id: uid(), label: 'Tốc độ kim', kind: 'slider', action: 'speed', targets: [c.id] }],
      scenes: [sc('Đồng hồ có những kim nào?', [0, 3, 9], [0, 2, 0], c.id), sc('Đồng hồ dùng số La Mã (lớp 3).', [3, 3, 6], [2.5, 2, 0], r.id)],
      quiz: [{ type: 'choice', q: 'Kim ngắn của đồng hồ chỉ gì?', opts: ['Giờ', 'Phút', 'Giây'], a: 0 }] };
  } },
  { id: 'lifecycle', title: 'Vòng đời của động vật', grade: 5, subject: 'Khoa học', stem: '5-9', desc: 'Trứng → nòng nọc → ếch; trứng → sâu → bướm; xuất hiện theo từng cảnh.', make: () => {
    const e1 = o('egg', -6, -2, { spot: spot('Trứng ếch', 'Ếch đẻ trứng dưới nước.') });
    const t1 = o('tadpole', -2, -2, { appear: 2, spot: spot('Nòng nọc', 'Trứng nở thành nòng nọc, sống dưới nước, có đuôi.') });
    const f1 = o('frog', 2, -2, { appear: 2, s: 1.3, spot: spot('Ếch trưởng thành', 'Nòng nọc mọc chân, rụng đuôi, thành ếch.') });
    const e2 = o('egg', -6, 3, { s: 0.6, appear: 3 });
    const c2 = o('caterpillar', -2, 3, { appear: 3, s: 1.4, spot: spot('Sâu non', 'Trứng bướm nở thành sâu, sâu ăn lá rất nhiều.') });
    const b2 = o('butterfly', 2.5, 3, { appear: 3, y: 1.2, fx: { type: 'bob', speed: 1 }, spot: spot('Bướm', 'Sâu hóa nhộng rồi thành bướm.') });
    return { ...emptyLesson(5, 'Vòng đời của động vật'), subject: 'Khoa học', stem: '5-9', base: 'grass', objects: [o('lake', -4, -2), e1, t1, f1, e2, c2, b2, o('tree', 7, 3)],
      links: [{ id: uid(), from: e1.id, to: t1.id, kind: 'arrow', label: '' }, { id: uid(), from: t1.id, to: f1.id, kind: 'arrow', label: '' }, { id: uid(), from: e2.id, to: c2.id, kind: 'arrow', label: '' }, { id: uid(), from: c2.id, to: b2.id, kind: 'arrow', label: '' }],
      controls: [], scenes: [sc('Một con vật lớn lên như thế nào?', [-4, 5, 7], [-6, 0.5, -2], e1.id), sc('Vòng đời của ếch.', [0, 6, 7], [-2, 0.5, -2]), sc('Vòng đời của bướm.', [0, 6, 11], [-1, 0.5, 3])],
      quiz: [{ type: 'choice', q: 'Nòng nọc lớn lên thành con gì?', opts: ['Con ếch', 'Con cá', 'Con bướm'], a: 0 }] };
  } },
  { id: 'shapes', title: 'Nhận biết khối hình', grade: 1, subject: 'Toán', stem: '1-4', desc: 'Khối lập phương, hộp chữ nhật, trụ, cầu, nón tự quay.', make: () => {
    const T: [string, string][] = [['cube', 'Có 6 mặt đều là hình vuông.'], ['cuboid', 'Có 6 mặt là hình chữ nhật. Ví dụ: hộp bút, viên gạch.'], ['cyl', 'Hai đầu là hình tròn, lăn được. Ví dụ: lon sữa.'], ['ball', 'Tròn đều mọi phía. Ví dụ: quả bóng.'], ['cone', 'Đáy hình tròn, đỉnh nhọn. Ví dụ: nón lá.']];
    const objs = T.map(([t, d], i) => o(t, -6 + i * 3, 0, { fx: { type: 'spin', speed: 0.6 }, spot: spot(ASSET_BY_ID[t].name, d) }));
    return { ...emptyLesson(1, 'Nhận biết khối hình'), subject: 'Toán', stem: '1-4', base: 'desk', objects: [...objs, o('sign', 0, -4, { name: 'Khối hình quanh em' })], links: [], controls: [],
      scenes: [sc('Trên bàn có những khối hình nào?', [0, 7, 12], [0, 1, 0]), sc('Khối lập phương: 6 mặt vuông.', [-6, 3, 5], [-6, 0.6, 0], objs[0].id), sc('Khối cầu lăn được về mọi phía.', [3, 3, 5], [3, 0.7, 0], objs[3].id)],
      quiz: [{ type: 'spot', q: 'Bấm vào khối trụ.', target: objs[2].id }, { type: 'choice', q: 'Quả bóng có dạng khối gì?', opts: ['Khối cầu', 'Khối lập phương', 'Khối nón'], a: 0 }] };
  } },
];
export const TEMPLATE_BY_ID: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

/** Khung bài 3D theo quy trình STEM 5 bước, đặt sẵn đồ vật gợi ý — giáo viên chỉ cần viết lời giảng */
export function stemSkeleton(s: StemLesson): Lesson3D {
  const ids = s.assets.filter((a) => ASSET_BY_ID[a]).slice(0, 8);
  const n = ids.length;
  const objs = ids.map((t, i) => {
    const ang = n > 1 ? Math.PI * (0.15 + (0.7 * i) / (n - 1)) : Math.PI / 2;
    return o(t, Math.round(-Math.cos(ang) * 7 * 10) / 10, Math.round(-Math.sin(ang) * 3.5 * 10) / 10 + 1, { spot: { on: false, title: '', text: '' } });
  });
  if (objs[0]) objs[0].spot = { on: true, title: objs[0].name, text: '' };
  const mats = s.materials.length ? o('materials', 6.5, 4.5, { spot: spot('Vật liệu cho mỗi nhóm', s.materials.join(' · ')) }) : null;
  const sign = o('sign', 0, -5, { name: s.title });
  const objects = [...objs, sign, ...(mats ? [mats] : [])];
  const focus = objs[0]?.id ?? '';
  return {
    ...emptyLesson(s.g, s.title), subject: s.lead, stem: stemKey(s), base: ['Toán'].includes(s.lead) ? 'desk' : 'grass', objects,
    scenes: [
      sc(`Nêu vấn đề: ${s.title}. Quan sát mô hình, cùng nêu điều cần tìm hiểu hoặc sản phẩm cần làm.`, HOME.cam, HOME.tgt),
      sc('Kiến thức nền: bấm vào các ghim số để tìm hiểu.', [6, 5, 10], [0, 1, 0], focus),
      sc('Đề xuất giải pháp: nhóm em sẽ làm sản phẩm thế nào, dùng vật liệu gì?', [9, 4, 9], [5, 0.5, 3], mats?.id ?? ''),
      sc('Chế tạo – thử nghiệm: quan sát mô hình mẫu, so sánh với sản phẩm của nhóm.', [0, 6, 11], [0, 1, 0]),
      sc('Chia sẻ – điều chỉnh: sản phẩm đạt yêu cầu chưa? Cần sửa điều gì?', HOME.cam, HOME.tgt),
    ],
  };
}
/** Bài 3D mới từ một bài STEM: có bài mẫu thì dùng bài mẫu, không thì dựng khung 5 bước */
export function lessonFromStem(s: StemLesson): Lesson3D {
  const t = s.tpl ? TEMPLATE_BY_ID[s.tpl] : null;
  if (t) { const L = t.make(); return { ...L, grade: s.g, stem: stemKey(s), title: s.title }; }
  return stemSkeleton(s);
}
export const stemByKey = (k?: string) => (k ? STEM_LESSONS.find((s) => stemKey(s) === k) : undefined);
