namespace EnglishApp.Api.Common.Exceptions;

/// <summary>Lỗi nghiệp vụ có mã HTTP xác định, được middleware chuyển thành ProblemDetails.</summary>
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}

public sealed class BadRequestException : AppException
{
    public BadRequestException(string message) : base(StatusCodes.Status400BadRequest, message) { }
}

public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Bạn cần đăng nhập để tiếp tục.") : base(StatusCodes.Status401Unauthorized, message) { }
}

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Bạn không có quyền thực hiện thao tác này.") : base(StatusCodes.Status403Forbidden, message) { }
}

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message = "Không tìm thấy dữ liệu.") : base(StatusCodes.Status404NotFound, message) { }
}

public sealed class ConflictException : AppException
{
    public ConflictException(string message) : base(StatusCodes.Status409Conflict, message) { }
}
