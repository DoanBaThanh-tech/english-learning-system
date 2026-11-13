# Chạy API ở cổng 5041 và tự giải phóng cổng nếu một tiến trình cũ còn giữ.
# Dùng trong PowerShell:  .\run-dev.ps1
$ErrorActionPreference = 'Stop'
$port = 5041

$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
    $owners = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($ownerId in $owners) {
        $name = (Get-Process -Id $ownerId -ErrorAction SilentlyContinue).ProcessName
        Write-Host "Cổng $port đang bị giữ bởi $name (PID $ownerId). Đang dừng..."
        Stop-Process -Id $ownerId -Force
    }
    Start-Sleep -Milliseconds 600
}

Write-Host "Đang chạy API tại http://localhost:$port ..."
dotnet run
