using System.Text.Json;
using EnglishApp.Api.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Common.Middleware;

/// <summary>Chuẩn hóa mọi lỗi API về ProblemDetails JSON, không lộ stack trace ra client.</summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            await WriteAsync(context, ex.StatusCode, ex.Message);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "Database update failed");
            await WriteAsync(context, StatusCodes.Status409Conflict,
                "Dữ liệu không thể lưu. Có thể bản ghi đã tồn tại hoặc đang được tham chiếu.");
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid JSON payload");
            await WriteAsync(context, StatusCodes.Status400BadRequest, "Dữ liệu JSON không hợp lệ.");
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client chủ động hủy request, không cần trả lỗi.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteAsync(context, StatusCodes.Status500InternalServerError,
                "Hệ thống gặp lỗi ngoài dự kiến. Vui lòng thử lại sau.");
        }
    }

    private static async Task WriteAsync(HttpContext context, int statusCode, string detail)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var payload = new
        {
            type = $"https://httpstatuses.com/{statusCode}",
            title = ReasonPhrase(statusCode),
            status = statusCode,
            detail,
            traceId = context.TraceIdentifier
        };

        await context.Response.WriteAsJsonAsync(payload);
    }

    private static string ReasonPhrase(int statusCode) => statusCode switch
    {
        400 => "Yêu cầu không hợp lệ",
        401 => "Chưa xác thực",
        403 => "Không có quyền",
        404 => "Không tìm thấy",
        409 => "Xung đột dữ liệu",
        422 => "Không thể xử lý",
        _ => "Lỗi hệ thống"
    };
}
