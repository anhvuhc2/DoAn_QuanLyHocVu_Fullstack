namespace DoAn_WebHocVu_API.Application.DTOs
{
    public class ServiceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int StatusCode { get; set; }
        public object? Data { get; set; }

        public static ServiceResult Ok(string message, object? data = null)
        {
            return new ServiceResult { Success = true, StatusCode = 200, Message = message, Data = data };
        }

        public static ServiceResult BadRequest(string message, object? data = null)
        {
            return new ServiceResult { Success = false, StatusCode = 400, Message = message, Data = data };
        }

        public static ServiceResult NotFound(string message)
        {
            return new ServiceResult { Success = false, StatusCode = 404, Message = message };
        }

        public static ServiceResult Forbidden(string message)
        {
            return new ServiceResult { Success = false, StatusCode = 403, Message = message };
        }
    }
}
