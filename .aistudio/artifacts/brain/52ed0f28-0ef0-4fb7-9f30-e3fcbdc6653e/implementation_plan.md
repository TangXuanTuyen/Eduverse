# Kế Hoạch Nâng Cấp Bản Đồ, Nhân Vật & Tối Ưu HUD Thành Phố EDUVERSE

Kế hoạch toàn diện nâng cấp thế giới khám phá học tập 2D RPG EDUVERSE dành cho học sinh THCS: tái cấu trúc cảnh quan đường đi theo phong cách lát gạch viền cỏ tự nhiên kết nối từng phân khu đặc thù, tăng độ sống động cho nhân vật với hoạt ảnh 4 hướng và camera bám mượt mà, đồng thời thu gọn tối đa giao diện HUD để tối ưu vùng nhìn thế giới game.

### User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định thiết kế cốt lõi đã được xác nhận và áp dụng theo phản hồi của người dùng:

- **Phong cách cảnh quan & đường đi**: Xác nhận sử dụng phong cách **Đường lát gạch viền cỏ tự nhiên với lối đi riêng từng khu**. Mỗi khu vực học tập (Trường học, Thư viện, STEM Lab, Quiz Arcade, Trạm Sửa Lỗi, Quảng Trường Vinh Danh) sẽ sở hữu thảm gạch nền, viền hoa cảnh và chi tiết mặt đất mang bản sắc nhận diện riêng biệt, loại bỏ các ô cỏ caro đơn điệu.
- **Tối ưu hóa thanh HUD & D-pad**: Áp dụng chuẩn thu gọn thanh trên cùng thành dải mỏng tinh tế (Micro-Dock) tích hợp gọn Avatar, Cấp độ, XP/EP và nút Nhiệm vụ; phím joystick/D-pad ảo thu nhỏ 35% ở góc dưới và tự động ẩn khi người chơi dùng bàn phím (WASD / Mũi tên).
- **Hệ thống Camera bám theo (Smooth Camera Tracking)**: Camera nội suy mượt mà (lerp smoothing) giữ nhân vật luôn ở vị trí trung tâm tầm nhìn với góc bù trừ theo hướng di chuyển, tạo cảm giác phiêu lưu RPG chân thực.

---

### 1. Overview & Core Concept

- **What It Does**: Bản đồ thành phố EDUVERSE được nâng cấp từ cấu trúc các khối chữ nhật tách biệt thành một thế giới học tập liền mạch, nơi mỗi công trình là một trạm tri thức sống động. Học sinh điều khiển nhân vật khám phá tự do bằng bàn phím, chuột hoặc cảm ứng, tiếp cận các thử thách Khoa học Tự nhiên với góc nhìn camera điện ảnh mượt mà.
- **Target Audience / Persona**: Học sinh THCS (Lớp 6–9), giáo viên bộ môn KHTN và nhà trường. Giao diện ưu tiên tính giải trí lành mạnh, thân thiện, mang đậm chất game nhập vai học đường nhưng không gây rối mắt hay làm phân tán việc học.
- **Key Value**: Xóa bỏ cảm giác "website bài tập trá hình", mang lại trải nghiệm một trò chơi 2D phiêu lưu thực thụ, kích thích sự tò mò khám phá kiến thức và nâng cao tinh thần tự học.

---

### 2. User Experience & Visual Design

#### A. Trải Nghiệm Khám Phá & Luồng Thao Tác
1. **Khởi động & Xuất hiện**: Học sinh sau khi chọn diện mạo xuất hiện trước sảnh Trường THCS EDUVERSE với làn khói mờ và hiệu ứng chào đón tinh tế.
2. **Di chuyển liền mạch**: Bấm phím (W, A, S, D / Mũi tên) hoặc chạm/click điểm đến trên bản đồ. Nhân vật chuyển động nhịp nhàng với bước chân, vung tay, tóc và phụ kiện lắc nhẹ theo quán tính, chân có bóng đổ mềm mại.
3. **Chuyển tiếp phân khu**: Khi bước từ đại lộ chính vào các nhánh đường lát gạch riêng biệt (lối vào Thư viện sách, khuôn viên công nghệ STEM Lab, sàn neon Quiz Arcade, xưởng gạch Review Station), gạch lát chuyển đổi chất liệu và hoa văn cảnh quan tương ứng.
4. **Tương tác gần**: Đến gần bậc thềm bất kỳ công trình nào, thẻ thông tin mở rộng hiển thị đầy đủ tên, mô tả và điều kiện mở khóa mà không che khuất nhân vật.

#### B. Bản Sắc Thị Giác & Ngôn Ngữ Thiết Kế
- **Phong cách Tilemap**: 2D Pixel-Art kết hợp Top-down RPG ấm áp. Bãi cỏ xanh tự nhiên với 3 sắc thái chuyển tiếp mềm mại, điểm xuyết cụm cỏ dại, hoa dại cánh nhỏ và hoa ven đường thay cho lưới caro cũ.
- **Hệ thống Giao thông & Đường đi**: 
  - *Đại lộ trung tâm*: Lát đá hoa cương màu xám ấm với viền gạch bo tự nhiên.
  - *Lối đi nhánh Thư viện*: Gạch đất nung cổ điển viền bồn hoa oải hương và bụi dương xỉ.
  - *Lối đi nhánh STEM Lab*: Đá phiến xanh titan viền đèn năng lượng sinh học.
  - *Lối đi nhánh Quiz Arcade*: Gạch mosaic tím thẫm viền hoa neon rực rỡ.
  - *Lối đi nhánh Trạm Sửa Lỗi*: Gạch thẻ công nghiệp đỏ ấm viền bụi hoa thạch thảo.
- **Bảng Màu (60-30-10 Budget)**:
  - *60% Nền tảng tự nhiên*: Xanh cỏ organic (`#2D7A3E`, `#38934C`, `#46AA5B`), đất đá trung tính (`#78716C`, `#A8A29E`).
  - *30% Cấu trúc công trình*: Trắng ngà thuộc địa (`#FEF3C7`), đỏ ngói trường học (`#DC2626`), gạch nung xưởng chế tác (`#9A3412`), tím neon arcade (`#7E22CE`).
  - *10% Điểm nhấn hành động*: Hổ phách XP (`#F59E0B`), vàng tia sét EP (`#FBBF24`), xanh dương tương tác (`#2563EB`).

#### C. Thiết Kế Thu Gọn HUD (Minimalist HUD Dock)
- **Profile Strip Góc Trái**: Rút gọn chiều cao còn 42px, avatar tròn 32px kèm tên và lớp học gọn gàng, thanh XP mỏng 4px nằm chìm bên dưới tên mà không chiếm diện tích ngang.
- **Utility Cluster Góc Phải**: Gộp điểm EP và nút Nhiệm Vụ thành một cụm pill siêu mỏng mờ (`backdrop-blur-md bg-slate-900/80`), icon tối giản, không che tầm nhìn phía trên của bản đồ.
- **Cụm D-pad Tự Ẩn (Smart D-pad)**: Kích thước thu nhỏ 30%, có nút gập/mở một chạm, tự động giảm độ mờ (opacity 0.25) khi chuột đứng yên hoặc đang nhấn phím điều hướng trên máy tính.

---

### 3. Key Product Decisions & Trade-Offs

#### Quyết Định 1: Tái thiết kế Tilemap Ground Engine bằng Canvas Rendering linh hoạt
- **Cách tiếp cận**: Thay thế thuật toán vẽ mảng ô caro phẳng bằng hệ thống đa lớp: Lớp nền cỏ organic đa sắc thái -> Lớp đường đi bo viền tự nhiên theo mask tile -> Lớp trang trí mặt đất đặc thù từng khu vực (hoa lá, đá sỏi, gờ viền).
- **Lý do**: Duy trì hiệu năng 60 FPS mượt mà trên trình duyệt mà không cần tải thêm thư viện ngoài nặng nề, tương thích tuyệt đối với cấu trúc Canvas hiện có.
- **Phương án thay thế đã cân nhắc**: Tải sprite sheet hình ảnh ngoài từ CDN; bị bác bỏ do rủi ro mạng chập chờn và vỡ tỷ lệ scale pixel.

#### Quyết Định 2: Tăng cường hoạt ảnh nhân vật 4 hướng với chuyển động vi mô
- **Cách tiếp cận**: Bổ sung bộ khung chuyển động 4 hướng rõ rệt: Quay mặt xuống (Front), Quay lưng (Back), Đi sang trái (Left), Đi sang phải (Right). Mỗi hướng có hoạt ảnh vung tay, co chân so le, chuyển động khăn quàng đỏ/áo đồng phục và bóng đổ elip tự co giãn theo nhịp bước.
- **Lý do**: Tạo cảm xúc sống động, giúp học sinh gắn kết với nhân vật đại diện của chính mình trong thế giới ảo.
- **Phương án thay thế đã cân nhắc**: Giữ nguyên sprite tĩnh trượt trên mặt đất; bị loại bỏ vì gây cảm giác cơ học và thiếu chuyên nghiệp.

#### Quyết Định 3: Thu gọn HUD để ưu tiên Viewport không gian game
- **Cách tiếp cận**: Chuyển đổi toàn bộ các khối HUD to góc trên thành các thanh nổi bán trong suốt, ôm sát viền màn hình, tăng tỷ lệ hiển thị của bản đồ lên hơn 90% diện tích màn hình.
- **Lý do**: Tránh che khuất các công trình và lối đi khi nhân vật di chuyển lên góc trên bản đồ.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          EDUVERSE GAME CANVAS                          │
│                                                                        │
│  ┌──────────────────────┐              ┌────────────────────────────┐  │
│  │ Compact Profile Dock │              │ Compact EP & Quests Anchor │  │
│  │ (Avatar, Name, XP)   │              │ (EP Badge, Map, Sound)     │  │
│  └──────────┬───────────┘              └─────────────┬──────────────┘  │
│             │                                        │                 │
│             ▼                                        ▼                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     CITY MAP VIEWPORT ENGINE                     │  │
│  │                                                                  │  │
│  │   ┌──────────────────────────────────────────────────────────┐   │  │
│  │   │ 1. Organic Multi-tone Ground & Brick Pavement Tilemap    │   │  │
│  │   │    - Zone 1: Scholastic Limestone Plaza                  │   │  │
│  │   │    - Zone 2: Library Natural Cobblestone & Flower Beds   │   │  │
│  │   │    - Zone 3: STEM Slate & Tech Conduit Lines             │   │  │
│  │   │    - Zone 4: Arcade Neon Pavers                          │   │  │
│  │   │    - Zone 5: Review Station Brick & Cobblestone Path     │   │  │
│  │   │    - Zone 6: Trophy Marble Aisle                         │   │  │
│  │   └──────────────────────────┬───────────────────────────────┘   │  │
│  │                              │                                   │  │
│  │   ┌──────────────────────────▼───────────────────────────────┐   │  │
│  │   │ 2. Dynamic 4-Direction Player Engine                     │   │  │
│  │   │    - Scale factor: 1.15x (Optimized proportions)         │   │  │
│  │   │    - 4-Way Gait cycle (Left, Right, Up, Down)            │   │  │
│  │   │    - Dynamic Elliptic Foot Shadow with Ground Contact    │   │  │
│  │   │    - Floating Auto-fitting Student Nameplate             │   │  │
│  │   └──────────────────────────┬───────────────────────────────┘   │  │
│  │                              │                                   │  │
│  │   ┌──────────────────────────▼───────────────────────────────┐   │  │
│  │   │ 3. Smooth Camera Follower (Lerp X/Y)                     │   │  │
│  │   │    - Deadzone & Elastic Clamping                         │   │  │
│  │   └──────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│             ▲                                        ▲                 │
│             │                                        │                 │
│  ┌──────────┴───────────┐              ┌─────────────┴──────────────┐  │
│  │ Smart Auto-hide D-pad│              │ Expanded Proximity Card    │  │
│  │ (Touch-optimized)    │              │ (Full Vietnamese Desc)     │  │
│  └──────────────────────┘              └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Thành Phần & Dữ Liệu Tương Tác
- **Bản Đồ (`src/components/city/CityMapCanvas.tsx`)**:
  - `drawGround`: Lập trình lại các layer nền cỏ hạt nhuyễn tự nhiên; hệ thống ma trận đường đi nối liền các cửa công trình với viền đá gọt góc (curb stones) và hoa văn lát gạch đặc thù.
  - `drawPlayer`: Hoàn thiện trọn vẹn bộ vẽ 4 hướng (up, down, left, right) với cử động tay chân so le, xoay thân và phụ kiện tương ứng.
  - `camera`: Tăng tốc độ nội suy camera và căn chỉnh trung tâm mượt mà theo vị trí nhân vật.
- **Giao diện HUD (`src/components/city/CityHUD.tsx`)**:
  - Thiết kế lại thẻ hồ sơ học sinh mỏng nhẹ, tinh giản khoảng đệm.
  - Thu gọn thanh điều hướng trên cùng thành các nút biểu tượng tròn có tooltip.
  - Tối ưu cụm D-pad cảm ứng: giảm bán kính, thêm chế độ tự làm mờ khi nhàn rỗi.
