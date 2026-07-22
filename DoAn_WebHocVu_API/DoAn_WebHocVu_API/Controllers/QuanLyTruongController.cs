using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_WebHocVu_API.Models;

namespace DoAn_WebHocVu_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "HieuTruong")] // <--- Ổ KHÓA ĐỘC QUYỀN
    public class QuanLyTruongController : ControllerBase
    {
        private readonly DoAnWebHocVuAdvancedContext _context;

        public QuanLyTruongController(DoAnWebHocVuAdvancedContext context)
        {
            _context = context;
        }
         // 1. Lấy danh sách tất cả giáo viên để Hiệu trưởng chọn
        [HttpGet("danh-sach-giao-vien")]   
        public async Task<IActionResult> GetGiaoVien()
        {
            var ds = await _context.TaiKhoans
                .Where(t => t.VaiTro == "GiaoVien")
                .Select(t => new { t.TenDangNhap, t.HoTen })
                .ToListAsync();
            return Ok(ds);
        }
        // 2. PHÂN CÔNG CHỦ NHIỆM (Cập nhật bảng LopHoc)
        [HttpPost("phan-cong-chu-nhiem")]
        public async Task<IActionResult> PhanCongChuNhiem(string maLop, string maGVCN)
        {
            // 1. KIỂM TRA LỚP CÓ TỒN TẠI KHÔNG
            var lop = await _context.LopHocs.FindAsync(maLop);
            if (lop == null) return NotFound(new { message = "Không tìm thấy lớp học" });

            // 2. HỖ TRỢ GỠ BỎ CHỦ NHIỆM (Nếu truyền trống hoặc "none"/"null")
            if (string.IsNullOrWhiteSpace(maGVCN) || maGVCN.ToLower() == "none" || maGVCN.ToLower() == "null")
            {
                lop.GvchuNhiem = null;
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Đã giải phóng giáo viên chủ nhiệm cho lớp {lop.TenLop}" });
            }

            // 3. CHỐT CHẶN BẢO VỆ LỚP: Nếu lớp đang có GVCN rồi và muốn phân công người khác, yêu cầu giải phóng trước
            if (!string.IsNullOrEmpty(lop.GvchuNhiem) && lop.GvchuNhiem != maGVCN)
            {
                return BadRequest(new { message = $"Lớp {lop.TenLop} hiện đã có Giáo viên chủ nhiệm là {lop.GvchuNhiem}. Vui lòng giải phóng/gỡ GVCN cũ của lớp này trước khi phân công người mới!" });
            }

            // 4. GÁC CỔNG C#: Kiểm tra giáo viên mới này đã chủ nhiệm lớp khác chưa
            var daChuNhiemLopKhac = await _context.LopHocs
                .AnyAsync(l => l.GvchuNhiem == maGVCN && l.MaLop != maLop);

            if (daChuNhiemLopKhac)
            {
                return BadRequest(new { message = $"Giáo viên {maGVCN} hiện đang làm chủ nhiệm cho một lớp khác. Vui lòng chọn người khác!" });
            }

            // 5. TIẾN HÀNH CẬP NHẬT NẾU HỢP LỆ
            lop.GvchuNhiem = maGVCN;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã phân công {maGVCN} làm chủ nhiệm lớp {lop.TenLop}" });
        }

        private string ChuanHoaThu(string? thu)
        {
            if (string.IsNullOrEmpty(thu)) return "";
            string t = thu.Trim().ToLower();
            if (t == "2" || t == "thứ 2" || t == "thu 2" || t == "hai" || t == "thứ hai") return "Thứ 2";
            if (t == "3" || t == "thứ 3" || t == "thu 3" || t == "ba" || t == "thứ ba") return "Thứ 3";
            if (t == "4" || t == "thứ 4" || t == "thu 4" || t == "tư" || t == "thứ tư") return "Thứ 4";
            if (t == "5" || t == "thứ 5" || t == "thu 5" || t == "năm" || t == "thứ năm") return "Thứ 5";
            if (t == "6" || t == "thứ 6" || t == "thu 6" || t == "sáu" || t == "thứ sáu") return "Thứ 6";
            if (t == "7" || t == "thứ 7" || t == "thu 7" || t == "bảy" || t == "thứ bảy") return "Thứ 7";
            return thu;
        }

        private string ChuanHoaBuoi(string? buoi)
        {
            if (string.IsNullOrEmpty(buoi)) return "";
            string b = buoi.Trim().ToLower();
            if (b == "sáng" || b == "sang" || b == "s") return "Sáng";
            if (b == "chiều" || b == "chieu" || b == "c") return "Chiều";
            return buoi;
        }

        // 3. PHÂN CÔNG BỘ MÔN (Thêm vào bảng PhanCongGiangDay)
        [HttpPost("phan-cong-bo-mon")]
        public async Task<IActionResult> PhanCongBoMon(PhanCongGiangDay pc)
        {
            // Chuẩn hóa dữ liệu ngày và buổi để truy vấn chính xác
            pc.Thu = ChuanHoaThu(pc.Thu);
            pc.Buoi = ChuanHoaBuoi(pc.Buoi);

            // 0. CHỐT CHẶN TRÙNG LỊCH HỌC CỦA LỚP: Lớp này tại thời điểm này đã có môn học khác được gán chưa
            if (!string.IsNullOrEmpty(pc.Thu) && !string.IsNullOrEmpty(pc.Buoi) && pc.Tiet.HasValue)
            {
                var lopBiTrungLich = await _context.PhanCongGiangDays
                    .FirstOrDefaultAsync(p => p.MaLop == pc.MaLop
                                           && p.Thu == pc.Thu
                                           && p.Buoi == pc.Buoi
                                           && p.Tiet == pc.Tiet);

                if (lopBiTrungLich != null)
                {
                    return BadRequest(new
                    {
                        message = $"❌ Lỗi trùng lịch học của Lớp: Lớp '{pc.MaLop}' vào {pc.Thu} - Buổi {pc.Buoi} - Tiết {pc.Tiet} hiện đã được phân công dạy môn '{lopBiTrungLich.MaMon}' do giáo viên '{lopBiTrungLich.MaGiaoVien}' phụ trách rồi!"
                    });
                }
            }

            // 1. CHỐT CHẶN 1: Kiểm tra xem Lớp này đã có giáo viên khác dạy môn này chưa
            var gvKhacDaDayMonNay = await _context.PhanCongGiangDays
                .FirstOrDefaultAsync(p => p.MaLop == pc.MaLop && p.MaMon == pc.MaMon && p.MaGiaoVien != pc.MaGiaoVien);

            if (gvKhacDaDayMonNay != null)
            {
                return BadRequest(new
                {
                    message = $"❌ Lỗi: Môn '{pc.MaMon}' ở lớp '{pc.MaLop}' hiện đã được phân công cho giáo viên '{gvKhacDaDayMonNay.MaGiaoVien}' phụ trách rồi! Không thể phân cho giáo viên khác dạy cùng môn."
                });
            }

            // CHỐT CHẶN 2: Kiểm tra xem Giáo viên này có bị trùng lịch dạy ở lớp khác vào đúng thời gian này không!
            var lichBiTrung = await _context.PhanCongGiangDays
                .FirstOrDefaultAsync(p => p.MaGiaoVien == pc.MaGiaoVien
                                       && p.Thu == pc.Thu
                                       && p.Buoi == pc.Buoi
                                       && p.Tiet == pc.Tiet);

            if (lichBiTrung != null)
            {
                return BadRequest(new
                {
                    message = $"⚠️ Lỗi trùng lịch! Giáo viên này đã được phân công dạy môn '{lichBiTrung.MaMon}' cho lớp '{lichBiTrung.MaLop}' vào Tiết {pc.Tiet} - Buổi {pc.Buoi} - {pc.Thu} rồi!"
                });
            }

            // 3. TIẾN HÀNH CẬP NHẬT HOẶC THÊM MỚI:
            // Tìm xem có dòng phân công chờ (chưa ghi nhận lịch học) của GIÁO VIÊN ĐÓ cho LỚP/MÔN ĐÓ không
            var dongCho = await _context.PhanCongGiangDays
                .FirstOrDefaultAsync(p => p.MaLop == pc.MaLop 
                                       && p.MaMon == pc.MaMon 
                                       && p.MaGiaoVien == pc.MaGiaoVien 
                                       && (string.IsNullOrEmpty(p.Thu) || p.Thu == "NULL" || p.Thu == ""));

            if (dongCho != null)
            {
                // Cập nhật lịch học vào dòng chờ
                dongCho.Thu = pc.Thu;
                dongCho.Buoi = pc.Buoi;
                dongCho.Tiet = pc.Tiet;
                _context.PhanCongGiangDays.Update(dongCho);
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Đã xếp lịch dạy môn {pc.MaMon} lớp {pc.MaLop} cho giáo viên {pc.MaGiaoVien} thành công (cập nhật dòng chờ)!" });
            }

            // Nếu không có dòng chờ (hoặc đã xếp xong hết các buổi), tạo một dòng mới
            _context.PhanCongGiangDays.Add(pc);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xếp thêm lịch dạy bộ môn thành công!" });
        }
        /// <summary>
        /// API: Hiệu trưởng cấp lại mật khẩu mặc định (123456) cho giáo viên bị quên
        /// </summary>
        [HttpPut("reset-mat-khau/{tenDangNhap}")]
        [Authorize(Roles = "HieuTruong")]
        public async Task<IActionResult> ResetMatKhauGiaoVien(string tenDangNhap)
        {
            var taiKhoan = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.TenDangNhap == tenDangNhap);

            if (taiKhoan == null)
            {
                return NotFound(new { message = $"Không tìm thấy tài khoản {tenDangNhap} trong hệ thống." });
            }

            if (taiKhoan.VaiTro == "HieuTruong")
            {
                return BadRequest(new { message = "Không thể tự reset mật khẩu của tài khoản quản trị cấp cao." });
            }

            // Cấp lại mật khẩu mặc định
            taiKhoan.MatKhau = "123456";

            _context.TaiKhoans.Update(taiKhoan);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã reset mật khẩu của {tenDangNhap} thành công!",
                matKhauMoi = "123456",
                luuY = "Vui lòng yêu cầu đăng nhập và đổi mật khẩu ngay lập tức."
            });
        }
    }
}