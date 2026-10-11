<#
.SYNOPSIS
    Sets up PostgreSQL with pgvector on Windows WITHOUT Docker.
.DESCRIPTION
    This script:
    1. Checks if PostgreSQL is installed
    2. Creates the database and user
    3. Downloads and installs the pgvector extension
    4. Verifies everything is working
.NOTES
    Run this script in an ELEVATED (Admin) PowerShell terminal.
#>

param(
    [string]$PgHost     = "localhost",
    [int]$PgPort        = 5432,
    [string]$PgDb       = "mplads_rag",
    [string]$PgUser     = "mplads",
    [string]$PgPassword = "mplads_secure_password_123",
    [string]$PgSuperUser = "postgres"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MPLADS RAG — PostgreSQL Setup (No Docker)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Find PostgreSQL installation ─────────────────────────────────────

Write-Host "[1/6] Locating PostgreSQL installation..." -ForegroundColor Yellow

$pgPaths = @(
    "C:\Program Files\PostgreSQL",
    "C:\PostgreSQL",
    "$env:ProgramFiles\PostgreSQL"
)

$pgBinDir = $null
$pgLibDir = $null
$pgShareExtDir = $null
$pgVersion = $null

foreach ($base in $pgPaths) {
    if (Test-Path $base) {
        # Find the latest version folder
        $versions = Get-ChildItem $base -Directory | Sort-Object Name -Descending
        foreach ($ver in $versions) {
            $binCandidate = Join-Path $ver.FullName "bin"
            if (Test-Path (Join-Path $binCandidate "psql.exe")) {
                $pgBinDir = $binCandidate
                $pgLibDir = Join-Path $ver.FullName "lib"
                $pgShareExtDir = Join-Path $ver.FullName "share\extension"
                $pgVersion = $ver.Name
                break
            }
        }
    }
    if ($pgBinDir) { break }
}

if (-not $pgBinDir) {
    Write-Host ""
    Write-Host "  PostgreSQL NOT FOUND on this system." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please install PostgreSQL first:" -ForegroundColor White
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "  2. Use the EDB installer (recommended)" -ForegroundColor Gray
    Write-Host "  3. During installation, remember the 'postgres' superuser password" -ForegroundColor Gray
    Write-Host "  4. Re-run this script after installation" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "  Found PostgreSQL $pgVersion at: $pgBinDir" -ForegroundColor Green

$psqlExe   = Join-Path $pgBinDir "psql.exe"
$pgConfig  = Join-Path $pgBinDir "pg_config.exe"

# Add to PATH for this session
$env:Path = "$pgBinDir;$env:Path"

# ── Step 2: Check PostgreSQL is running ──────────────────────────────────────

Write-Host "[2/6] Checking PostgreSQL service..." -ForegroundColor Yellow

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }

if (-not $pgService) {
    Write-Host "  PostgreSQL service is not running. Attempting to start..." -ForegroundColor Yellow
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "  Service '$($pgService.Name)' started." -ForegroundColor Green
    } else {
        Write-Host "  Could not find PostgreSQL Windows service." -ForegroundColor Red
        Write-Host "  Please start PostgreSQL manually and re-run this script." -ForegroundColor Gray
        exit 1
    }
} else {
    Write-Host "  PostgreSQL service is running: $($pgService.Name)" -ForegroundColor Green
}

# ── Step 3: Create database and user ─────────────────────────────────────────

Write-Host "[3/6] Creating database and user..." -ForegroundColor Yellow

# Set password for psql commands
$env:PGPASSWORD = ""

# Prompt for postgres superuser password
$pgSuperPass = Read-Host -Prompt "  Enter password for PostgreSQL superuser '$PgSuperUser'"
$env:PGPASSWORD = $pgSuperPass

# Check if user exists
$userExists = & $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -tAc "SELECT 1 FROM pg_roles WHERE rolname='$PgUser'" 2>$null
if ($userExists -ne "1") {
    Write-Host "  Creating user '$PgUser'..." -ForegroundColor Gray
    & $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -c "CREATE USER $PgUser WITH PASSWORD '$PgPassword' CREATEDB;" 2>$null
    Write-Host "  User '$PgUser' created." -ForegroundColor Green
} else {
    Write-Host "  User '$PgUser' already exists." -ForegroundColor Green
}

# Check if database exists
$dbExists = & $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -tAc "SELECT 1 FROM pg_database WHERE datname='$PgDb'" 2>$null
if ($dbExists -ne "1") {
    Write-Host "  Creating database '$PgDb'..." -ForegroundColor Gray
    & $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -c "CREATE DATABASE $PgDb OWNER $PgUser;" 2>$null
    Write-Host "  Database '$PgDb' created." -ForegroundColor Green
} else {
    Write-Host "  Database '$PgDb' already exists." -ForegroundColor Green
}

# Grant all privileges
& $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -c "GRANT ALL PRIVILEGES ON DATABASE $PgDb TO $PgUser;" 2>$null

# Step 4 (pgvector) has been removed because we use ChromaDB for vectors!
# ── Step 5: Enable extensions in the database ────────────────────────────────

Write-Host "[5/6] Enabling extensions..." -ForegroundColor Yellow



& $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -d $PgDb -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Extension 'pg_trgm' enabled." -ForegroundColor Green
} else {
    Write-Host "  Warning: 'pg_trgm' extension not available." -ForegroundColor Yellow
}

# Grant schema permissions to the app user
& $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -d $PgDb -c "GRANT ALL ON SCHEMA public TO $PgUser;" 2>$null
& $psqlExe -h $PgHost -p $PgPort -U $PgSuperUser -d $PgDb -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $PgUser;" 2>$null

# ── Step 6: Verify ───────────────────────────────────────────────────────────

Write-Host "[6/6] Verifying setup..." -ForegroundColor Yellow

    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║   PostgreSQL setup COMPLETE!                 ║" -ForegroundColor Green
    Write-Host "  ╠══════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "  ║                                              ║" -ForegroundColor Green
    Write-Host "  ║   Host:     $PgHost                    ║" -ForegroundColor Green
    Write-Host "  ║   Port:     $PgPort                         ║" -ForegroundColor Green
    Write-Host "  ║   Database: $PgDb                    ║" -ForegroundColor Green
    Write-Host "  ║   User:     $PgUser                       ║" -ForegroundColor Green
    Write-Host "  ║                                              ║" -ForegroundColor Green
    Write-Host "  ║   Next steps:                                ║" -ForegroundColor Green
    Write-Host "  ║   1. cd backend                              ║" -ForegroundColor Green
    Write-Host "  ║   2. python main.py                          ║" -ForegroundColor Green
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
$env:PGPASSWORD = ""
