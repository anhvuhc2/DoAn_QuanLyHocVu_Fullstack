-- 1. TẠO CƠ SỞ DỮ LIỆU
CREATE DATABASE DoAn_WebHocVu_Advanced;
GO
USE DoAn_WebHocVu_Advanced;
GO

-----------------------------------------------------------
-- NHÓM 1: QUẢN TRỊ VÀ PHÂN QUYỀN (CHỨC NĂNG 1)
-----------------------------------------------------------

-- Bảng 1: Tài khoản người dùng
CREATE TABLE TaiKhoan (
    TenDangNhap NVARCHAR(50) PRIMARY KEY,
    MatKhau NVARCHAR(255) NOT NULL, -- Sẽ mã hóa ở code C#
    HoTen NVARCHAR(100) NOT NULL,
    VaiTro NVARCHAR(20) CHECK (VaiTro IN ('HieuTruong', 'GiaoVien', 'PhuHuynh'))
);

-- Bảng 2: Lớp học (Hiệu trưởng quản lý)
CREATE TABLE LopHoc (
    MaLop NVARCHAR(20) PRIMARY KEY,
    TenLop NVARCHAR(50) NOT NULL,
    NienKhoa NVARCHAR(20),
    GVChuNhiem NVARCHAR(50) FOREIGN KEY REFERENCES TaiKhoan(TenDangNhap)
);

-- Bảng 3: Môn học
CREATE TABLE MonHoc (
    MaMon NVARCHAR(20) PRIMARY KEY,
    TenMon NVARCHAR(100) NOT NULL,
    SoTinChi INT DEFAULT 0
);

-- Bảng 4: Phân công giảng dạy (Phân quyền nhập điểm/điểm danh)
CREATE TABLE PhanCongGiangDay (
    MaPhanCong INT IDENTITY(1,1) PRIMARY KEY,
    MaGiaoVien NVARCHAR(50) FOREIGN KEY REFERENCES TaiKhoan(TenDangNhap),
    MaLop NVARCHAR(20) FOREIGN KEY REFERENCES LopHoc(MaLop),
    MaMon NVARCHAR(20) FOREIGN KEY REFERENCES MonHoc(MaMon),
    UNIQUE(MaGiaoVien, MaLop, MaMon) -- Tránh phân công trùng lặp
);

-----------------------------------------------------------
-- NHÓM 2: QUẢN LÝ HỌC TẬP (CHỨC NĂNG 2, 3, 4)
-----------------------------------------------------------

-- Bảng 5: Học sinh
CREATE TABLE HocSinh (
    MaHS NVARCHAR(20) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    NgaySinh DATE,
    MaLop NVARCHAR(20) FOREIGN KEY REFERENCES LopHoc(MaLop),
    TaiKhoanPhuHuynh NVARCHAR(50) FOREIGN KEY REFERENCES TaiKhoan(TenDangNhap)
);

-- Bảng 6: Bảng điểm & Nhận xét (Chức năng 2)
CREATE TABLE BangDiem (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    MaHS NVARCHAR(20) FOREIGN KEY REFERENCES HocSinh(MaHS),
    MaMon NVARCHAR(20) FOREIGN KEY REFERENCES MonHoc(MaMon),
    DiemChuyenCan FLOAT CHECK (DiemChuyenCan BETWEEN 0 AND 10),
    DiemThi FLOAT CHECK (DiemThi BETWEEN 0 AND 10),
    DiemTrungBinh AS (DiemChuyenCan * 0.3 + DiemThi * 0.7) PERSISTED, -- Tự động tính
    NhanXet NVARCHAR(MAX),
    NgayCapNhat DATETIME DEFAULT GETDATE(),
    UNIQUE(MaHS, MaMon)
);

-- Bảng 7: Điểm danh (Chức năng 3)
CREATE TABLE DiemDanh (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    MaHS NVARCHAR(20) FOREIGN KEY REFERENCES HocSinh(MaHS),
    NgayVang DATE DEFAULT GETDATE(),
    TrangThai NVARCHAR(50) CHECK (TrangThai IN (N'Có phép', N'Không phép')),
    NguoiDiemDanh NVARCHAR(50) FOREIGN KEY REFERENCES TaiKhoan(TenDangNhap)
);

-----------------------------------------------------------
-- NHÓM 3: TƯƠNG TÁC (CHỨC NĂNG 5)
-----------------------------------------------------------

-- Bảng 8: Kế hoạch & Hoạt động (Giáo viên đăng)
CREATE TABLE KeHoachLop (
    MaKeHoach INT IDENTITY(1,1) PRIMARY KEY,
    MaLop NVARCHAR(20) FOREIGN KEY REFERENCES LopHoc(MaLop),
    TieuDe NVARCHAR(200) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    LoaiThongBao NVARCHAR(50), -- 'DiemSo' hoặc 'KeHoach'
    NgayDang DATETIME DEFAULT GETDATE(),
    NguoiDang NVARCHAR(50) FOREIGN KEY REFERENCES TaiKhoan(TenDangNhap)
);

-- Bảng 9: Tương tác phản hồi (Phụ huynh trả lời)
CREATE TABLE TuongTac (
    MaTuongTac INT IDENTITY(1,1) PRIMARY KEY,
    MaKeHoach INT FOREIGN KEY REFERENCES KeHoachLop(MaKeHoach),
    TenDangNhap NVARCHAR(50) FOREIGN KEY REFERENCES TaiKhoan(TenDangNhap),
    NoiDung NVARCHAR(MAX) NOT NULL,
    ThoiGian DATETIME DEFAULT GETDATE()
);
GO
-- Thủ tục kiểm tra xuất bảng điểm tổng hợp
CREATE PROCEDURE sp_KiemTraXuatBangDiem
    @MaLop NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Lấy tổng số học sinh thực tế hiện có trong lớp này
    DECLARE @TongSoHocSinh INT;
    SELECT @TongSoHocSinh = COUNT(*) FROM HocSinh WHERE MaLop = @MaLop;

    -- 2. Lấy số lượng môn học mà lớp này được phân công (từ bảng phân công)
    DECLARE @TongSoMonHoc INT;
    SELECT @TongSoMonHoc = COUNT(DISTINCT MaMon) FROM PhanCongGiangDay WHERE MaLop = @MaLop;

    -- 3. Tính tổng số lượng bản ghi điểm cần phải có (Mỗi HS x Mỗi Môn)
    DECLARE @TongDauDiemCanCo INT = @TongSoHocSinh * @TongSoMonHoc;

    -- 4. Đếm số lượng bản ghi điểm thực tế đã được nhập đủ (phải có cả chuyên cần và điểm thi)
    DECLARE @TongDauDiemDaNhap INT;
    SELECT @TongDauDiemDaNhap = COUNT(*) 
    FROM BangDiem 
    WHERE MaHS IN (SELECT MaHS FROM HocSinh WHERE MaLop = @MaLop)
      AND DiemChuyenCan IS NOT NULL 
      AND DiemThi IS NOT NULL;

    -- 5. Trả về kết quả cho C# xử lý
    -- Nếu tổng điểm đã nhập khớp với tổng điểm cần có và lớn hơn 0
    IF (@TongDauDiemDaNhap = @TongDauDiemCanCo AND @TongDauDiemCanCo > 0)
    BEGIN
        SELECT 
            1 AS ChoPhepXuat, 
            N'Hoàn thành: ' + CAST(@TongDauDiemDaNhap AS NVARCHAR) + '/' + CAST(@TongDauDiemCanCo AS NVARCHAR) AS ThongBao,
            'Success' AS TrangThai;
    END
    ELSE
    BEGIN
        SELECT 
            0 AS ChoPhepXuat, 
            N'Chưa đủ dữ liệu: Mới có ' + CAST(@TongDauDiemDaNhap AS NVARCHAR) + '/' + CAST(@TongDauDiemCanCo AS NVARCHAR) + N' đầu điểm.' AS ThongBao,
            'Warning' AS TrangThai;
    END
END
GO

-- Kiểm tra quyền nhập điểm/điểm danh
CREATE PROCEDURE sp_KiemTraQuyenGiaoVien
    @MaGV NVARCHAR(50),
    @MaLop NVARCHAR(20),
    @MaMon NVARCHAR(20) = NULL -- Có thể để trống nếu là điểm danh
AS
BEGIN
    IF @MaMon IS NOT NULL
    BEGIN
        -- Kiểm tra quyền dạy môn
        IF EXISTS (SELECT 1 FROM PhanCongGiangDay WHERE MaGiaoVien = @MaGV AND MaLop = @MaLop AND MaMon = @MaMon)
            SELECT 1 AS CoQuyen;
        ELSE
            SELECT 0 AS CoQuyen;
    END
    ELSE
    BEGIN
        -- Kiểm tra quyền chủ nhiệm (để điểm danh)
        IF EXISTS (SELECT 1 FROM LopHoc WHERE MaLop = @MaLop AND GVChuNhiem = @MaGV)
            SELECT 1 AS CoQuyen;
        ELSE
            SELECT 0 AS CoQuyen;
    END
END
GO

--Thêm cột xếp loại vào bảng điểm
ALTER TABLE BangDiem
ADD XepLoai NVARCHAR(10);

--Thêm dữ liệu
-- 1. THÊM DỮ LIỆU MẪU VÀO BẢNG TÀI KHOẢN
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, HoTen, VaiTro) VALUES 
('gv_toan', '123456', N'Thầy Nguyễn Văn Toán', 'GiaoVien'),
('gv_anh', '123456', N'Cô Trần Thị Tiếng Anh', 'GiaoVien'),
('ph_an', '123456', N'Phụ huynh em Nguyễn Văn An', 'PhuHuynh'),
('hieutruong', '123456', N'Thầy Quản Lý Hiệu Trưởng', 'HieuTruong');

-- 2. THÊM DỮ LIỆU MẪU VÀO BẢNG MÔN HỌC
INSERT INTO MonHoc (MaMon, TenMon, SoTinChi) VALUES 
('TOAN', N'Toán học', 0),
('ANH', N'Tiếng Anh', 0);

-- 3. THÊM DỮ LIỆU MẪU VÀO BẢNG LỚP HỌC
INSERT INTO LopHoc (MaLop, TenLop, NienKhoa, GVChuNhiem) VALUES 
('L5A', '5A', '2025-2026', 'gv_toan'),
('L5B', '5B', '2025-2026', 'gv_anh');

-- 4. THÊM DỮ LIỆU VÀO BẢNG PHÂN CÔNG GIẢNG DẠY
-- Không cần chèn MaPhanCong nữa, SQL Server sẽ tự động sinh mã
INSERT INTO PhanCongGiangDay (MaGiaoVien, MaLop, MaMon) VALUES 
('gv_toan', 'L5A', 'TOAN'),
('gv_anh', 'L5A', 'ANH');

-- câu lệnh này để thêm cột TrangThai vào bảng HocSinh
ALTER TABLE HocSinh ADD TrangThai NVARCHAR(50) NOT NULL DEFAULT N'Đang học';
-- câu lệnh này để thêm cột File đính kèm vào bảng kế hoạch lớp
ALTER TABLE KeHoachLop ADD FileDinhKem NVARCHAR(500) NULL;
--Ràng buộc duy nhất (Unique Constraint) kết hợp giữa 2 cột: MaHS + NgayVang bảng Điểm danh
ALTER TABLE DiemDanh
ADD CONSTRAINT UC_HocSinh_NgayVang UNIQUE (MaHS, NgayVang);
--Tạo Ràng buộc duy nhất (Unique Constraint) cho cặp MaHS và MaMon trong Bảng điểm
ALTER TABLE BangDiem
ADD CONSTRAINT UC_HocSinh_MonHoc UNIQUE (MaHS, MaMon);
--thiết lập quy tắc: Một Lớp và Một Môn chỉ xuất hiện đúng 1 lần trong bảng Phân công giảng dạy
ALTER TABLE PhanCongGiangDay
ADD CONSTRAINT UC_Lop_Mon UNIQUE (MaLop, MaMon);
--không cho phép gán một giáo viên chủ nhiệm 2 lớp cùng lúc trong bảng lớp học
ALTER TABLE LopHoc
ADD CONSTRAINT UC_GVChuNhiem UNIQUE (GVChuNhiem);

-- Ép cột VaiTro không được phép để trống (Bao gồm cả việc dọn dữ liệu cũ trước)

ALTER TABLE TaiKhoan 
ALTER COLUMN VaiTro NVARCHAR(50) NOT NULL;

--  Tạo ràng buộc CHECK: Chỉ cho nhập 1 trong 3 vai trò cố định
ALTER TABLE TaiKhoan
ADD CONSTRAINT CHK_VaiTro CHECK (VaiTro IN ('GiaoVien', 'HieuTruong', 'PhuHuynh'));

--  Ép các cột cơ bản không được để trống (NULL)
ALTER TABLE KeHoachLop ALTER COLUMN TieuDe NVARCHAR(255) NOT NULL;
ALTER TABLE KeHoachLop ALTER COLUMN NoiDung NVARCHAR(MAX) NOT NULL;
ALTER TABLE KeHoachLop ALTER COLUMN LoaiThongBao NVARCHAR(50) NOT NULL;

-- Giới hạn cột LoaiThongBao chỉ được phép nhận đúng 2 dạng của bạn
ALTER TABLE KeHoachLop
ADD CONSTRAINT CHK_LoaiThongBao CHECK (LoaiThongBao IN (N'Báo điểm', N'Báo kế hoạch'));

-- Ép các cột của bảng TuongTac không được NULL và tạo khóa ngoại chống nick ma
ALTER TABLE TuongTac ALTER COLUMN NoiDung NVARCHAR(MAX) NOT NULL;
-- PHẦN 2: CÁC LỆNH TỪ TAB (55) - KHÓA NGOẠI VÀ TRUY VẤN DỮ LIỆU
-- =========================================================================
-- 1. Xóa khóa ngoại cũ đang cản đường
ALTER TABLE HocSinh DROP CONSTRAINT FK__HocSinh__TaiKhoa__1FCDBCEB;
GO

-- 2. Tạo lại khóa ngoại mới, tích hợp tự động cập nhật dây chuyền (ON UPDATE CASCADE)
ALTER TABLE HocSinh 
ADD CONSTRAINT FK_HocSinh_TaiKhoan 
FOREIGN KEY (TaiKhoanPhuHuynh) REFERENCES TaiKhoan(TenDangNhap) 
ON UPDATE CASCADE;
GO

-- 3. Truy vấn xem dữ liệu
SELECT * FROM KeHoachLop ORDER BY NgayDang DESC;
SELECT * FROM TuongTac ORDER BY ThoiGian DESC;

 -- 1. Xóa ràng buộc cũ đang gây khó dễ
ALTER TABLE dbo.LopHoc DROP CONSTRAINT UC_GVChuNhiem;

-- 2. Tạo ràng buộc mới: Chỉ cấm trùng lặp khi GVChuNhiem KHÁC NULL
CREATE UNIQUE INDEX UC_GVChuNhiem ON dbo.LopHoc(GVChuNhiem) WHERE GVChuNhiem IS NOT NULL;


-- Lệnh 1: Khóa trùng lịch lớp (Chỉ kiểm tra khi ĐÃ XẾP LỊCH - Khác NULL)
CREATE UNIQUE INDEX UQ_Lop_ThoiGian ON dbo.PhanCongGiangDay(MaLop, Thu, Buoi, Tiet) 
WHERE Thu IS NOT NULL AND Buoi IS NOT NULL AND Tiet IS NOT NULL;
GO

-- Lệnh 2: Khóa trùng lịch giáo viên (Chỉ kiểm tra khi ĐÃ XẾP LỊCH - Khác NULL)
CREATE UNIQUE INDEX UQ_GiaoVien_ThoiGian ON dbo.PhanCongGiangDay(MaGiaoVien, Thu, Buoi, Tiet) 
WHERE Thu IS NOT NULL AND Buoi IS NOT NULL AND Tiet IS NOT NULL;
GO

-- Khóa chống điểm danh trùng lặp: 1 học sinh chỉ có tối đa 1 bản ghi điểm danh trong 1 ngày
ALTER TABLE dbo.DiemDanh
ADD CONSTRAINT UQ_HocSinh_NgayDiemDanh UNIQUE (MaHS, NgayVang);
GO