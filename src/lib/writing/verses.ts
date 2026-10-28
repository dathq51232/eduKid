// Kho câu mẫu cho trang vở luyện chữ: tục ngữ, ca dao dân gian (văn học dân gian, không thuộc bản quyền tác giả nào).
// Cô bấm để chèn vào ô nội dung rồi sửa tuỳ ý; mỗi dòng là một câu / một dòng thơ.
export type VerseGroup = { id: string; label: string; items: string[] };

export const VERSE_GROUPS: VerseGroup[] = [
  {
    id: 'tuc-ngu', label: 'Tục ngữ',
    items: [
      'Nét chữ nết người', 'Ăn quả nhớ kẻ trồng cây', 'Uống nước nhớ nguồn', 'Có chí thì nên',
      'Có công mài sắt có ngày nên kim', 'Tiên học lễ, hậu học văn', 'Không thầy đố mày làm nên',
      'Học thầy không tày học bạn', 'Lá lành đùm lá rách', 'Thương người như thể thương thân',
      'Đói cho sạch, rách cho thơm', 'Tốt gỗ hơn tốt nước sơn', 'Gần mực thì đen, gần đèn thì sáng',
      'Đi một ngày đàng học một sàng khôn', 'Một cây làm chẳng nên non', 'Chị ngã em nâng',
      'Kính trên nhường dưới', 'Anh em thuận hoà là nhà có phúc', 'Học ăn, học nói, học gói, học mở',
    ],
  },
  {
    id: 'ca-dao-gia-dinh', label: 'Ca dao: gia đình',
    items: [
      'Công cha như núi Thái Sơn\nNghĩa mẹ như nước trong nguồn chảy ra',
      'Một lòng thờ mẹ kính cha\nCho tròn chữ hiếu mới là đạo con',
      'Anh em như thể tay chân\nRách lành đùm bọc, dở hay đỡ đần',
      'Uốn cây từ thuở còn non\nDạy con từ thuở con còn bi bô',
      'Con ơi muốn nên thân người\nLắng tai nghe lấy những lời mẹ cha',
      'Ơn cha nặng lắm ai ơi\nNghĩa mẹ bằng trời chín tháng cưu mang',
    ],
  },
  {
    id: 'ca-dao-thay-ban', label: 'Ca dao: thầy cô, bạn bè',
    items: [
      'Muốn sang thì bắc cầu kiều\nMuốn con hay chữ thì yêu lấy thầy',
      'Một chữ cũng là thầy\nNửa chữ cũng là thầy',
      'Lời nói chẳng mất tiền mua\nLựa lời mà nói cho vừa lòng nhau',
      'Chim khôn kêu tiếng rảnh rang\nNgười khôn nói tiếng dịu dàng dễ nghe',
      'Bầu ơi thương lấy bí cùng\nTuy rằng khác giống nhưng chung một giàn',
      'Nhiễu điều phủ lấy giá gương\nNgười trong một nước phải thương nhau cùng',
    ],
  },
  {
    id: 'ca-dao-que-huong', label: 'Ca dao: quê hương, lao động',
    items: [
      'Trong đầm gì đẹp bằng sen\nLá xanh bông trắng lại chen nhị vàng',
      'Đường vô xứ Nghệ quanh quanh\nNon xanh nước biếc như tranh hoạ đồ',
      'Gió đưa cành trúc la đà\nTiếng chuông Trấn Vũ, canh gà Thọ Xương',
      'Ai ơi bưng bát cơm đầy\nDẻo thơm một hạt, đắng cay muôn phần',
      'Cày đồng đang buổi ban trưa\nMồ hôi thánh thót như mưa ruộng cày',
      'Rủ nhau đi cấy đi cày\nBây giờ khó nhọc, có ngày phong lưu',
      'Dù ai đi ngược về xuôi\nNhớ ngày giỗ Tổ mùng mười tháng ba',
    ],
  },
  {
    id: 'chu-cai', label: 'Chữ cái, vần (lặp kín dòng)',
    items: [
      'a\nă\nâ\nb\nc', 'd\nđ\ne\nê\ng', 'h\ni\nk\nl\nm', 'n\no\nô\nơ\np', 'q\nr\ns\nt\nu', 'ư\nv\nx\ny',
      'A\nĂ\nÂ\nB\nC', 'D\nĐ\nE\nÊ\nG', 'H\nI\nK\nL\nM', 'N\nO\nÔ\nƠ\nP', 'Q\nR\nS\nT\nU', 'Ư\nV\nX\nY',
      'an\năn\nân\non\nôn', 'ang\năng\nâng\nong\nông', 'anh\ninh\nach\nich\nuyên',
    ],
  },
];
