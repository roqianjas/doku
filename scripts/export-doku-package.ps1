param(
    [Parameter(Mandatory = $false)]
    [string]$Destination = ".\exports\roqianjas-doku-laravel",

    [Parameter(Mandatory = $false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$source = Join-Path $PSScriptRoot "..\packages\doku-laravel"
$source = [System.IO.Path]::GetFullPath($source)
$destinationPath = [System.IO.Path]::GetFullPath($Destination)

if (-not (Test-Path -LiteralPath $source)) {
    throw "Source package directory not found: $source"
}

if ((Test-Path -LiteralPath $destinationPath) -and -not $Force) {
    throw "Destination already exists. Use -Force to overwrite: $destinationPath"
}

if (Test-Path -LiteralPath $destinationPath) {
    Remove-Item -LiteralPath $destinationPath -Recurse -Force
}

New-Item -ItemType Directory -Path $destinationPath | Out-Null

Get-ChildItem -LiteralPath $source -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $destinationPath -Recurse -Force
}

$readmeAppendix = @(
    '',
    '## Publish Workflow',
    '',
    'If this folder has been exported into its own repository directory, the usual next steps are:',
    '',
    '```bash',
    'composer install',
    'composer test',
    'git init',
    'git branch -M main',
    'git add .',
    'git commit -m "Initial package extraction"',
    'git remote add origin git@github.com:roqianjas/doku-laravel.git',
    'git push -u origin main',
    '```',
    ''
) -join [Environment]::NewLine

$readmePath = Join-Path $destinationPath 'README.md'
if (Test-Path -LiteralPath $readmePath) {
    Add-Content -LiteralPath $readmePath -Value $readmeAppendix
}

Write-Host ''
Write-Host 'Package exported successfully.' -ForegroundColor Green
Write-Host "Source      : $source"
Write-Host "Destination : $destinationPath"
Write-Host ''
Write-Host 'Suggested next steps:' -ForegroundColor Cyan
Write-Host "1. cd `"$destinationPath`""
Write-Host '2. composer install'
Write-Host '3. composer test'
Write-Host '4. git init'
Write-Host '5. git remote add origin git@github.com:roqianjas/doku-laravel.git'
Write-Host '6. git add .'
Write-Host '7. git commit -m "Initial package extraction"'
Write-Host '8. git push -u origin main'
