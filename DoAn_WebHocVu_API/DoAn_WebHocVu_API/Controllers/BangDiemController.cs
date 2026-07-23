using DoAn_WebHocVu_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using DoAn_WebHocVu_API.Application.Interfaces;
using DoAn_WebHocVu_API.Application.DTOs;

namespace DoAn_WebHocVu_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "GiaoVien,HieuTruong")] // CHỐT CHẶN VÒNG NGOÀI
    public class BangDiemController : ControllerBase
    {
        private readonly IBangDiemService _bangDiemService;

        public BangDiemController(IBangDiemService bangDiemService)
        {
            _bangDiemService = bangDiemService;
        }

        // ====================================================================
        // CHỨC NĂNG: NHẬP ĐIỂM / XẾP LOẠI LINH HOẠT THEO TIỂU HỌC 
        // ====================================================================
        [HttpPost("nhap-diem")]
        public async Task<IActionResult> NhapDiem([FromBody] NhapDiemDto model)
        {
            var maGiaoVien = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var result = await _bangDiemService.NhapDiemAsync(model, maGiaoVien ?? "");

            if (result.Success)
                return Ok(new { message = result.Message, data = result.Data });
            else
                return StatusCode(result.StatusCode, new { message = result.Message, data = result.Data });
        }

        [HttpGet("xem-diem/{maHS}")]
        public async Task<IActionResult> XemDiem(string maHS)
        {
            var result = await _bangDiemService.XemDiemAsync(maHS);
            if (result.Success) return Ok(result.Data);
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        /// <summary>
        /// API: Xuất Bảng Điểm Tổng (Chỉ GVCN mới được xuất)
        /// </summary>
        [HttpGet("xuat-bang-diem-tong/{maLop}")]
        [Authorize(Roles = "GiaoVien,HieuTruong")]
        public async Task<IActionResult> XuatBangDiemTong(string maLop)
        {
            var maGiaoVien = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            bool isHieuTruong = User.IsInRole("HieuTruong");
            
            var result = await _bangDiemService.XuatBangDiemTongAsync(maLop, maGiaoVien ?? "", isHieuTruong);
            
            if (result.Success) return Ok(new { message = result.Message, data = result.Data });
            
            if (!result.Success && result.Data != null)
                return BadRequest(new { message = result.Message, chiTietLoi = result.Data });
            
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        /// <summary>
        /// API: Gửi thông báo điểm cho phụ huynh qua Zalo / SMS (Đã chốt chặn logic quy trình)
        /// </summary>
        [HttpPost("gui-thong-bao-diem/{maLop}")]
        [Authorize(Roles = "GiaoVien")]
        public async Task<IActionResult> GuiThongBaoDiem(string maLop)
        {
            var maGiaoVien = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var result = await _bangDiemService.GuiThongBaoDiemAsync(maLop, maGiaoVien ?? "");

            if (result.Success) return Ok(new { message = result.Message });
            
            if (!result.Success && result.Data != null)
                return BadRequest(new { message = result.Message, chiTietLoi = result.Data });
                
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        public class NhapDiemDto
        {
            public string? MaHS { get; set; }
            public string? MaMon { get; set; }
            public float? DiemThi { get; set; }
            public string? XepLoai { get; set; }
            public string? NhanXet { get; set; }
        }
    }
}