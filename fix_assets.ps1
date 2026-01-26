
$dimensions = 800
$color = [System.Drawing.Color]::FromArgb(255, 33, 150, 243) # Blue

Add-Type -AssemblyName System.Drawing

function Create-PlaceholderImage {
    param (
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [string]$Text
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.Clear($color)
    
    $font = New-Object System.Drawing.Font "Arial", 40
    $brush = [System.Drawing.Brushes]::White
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $graphics.DrawString($Text, $font, $brush, ($Width / 2), ($Height / 2), $format)
    
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
    Write-Host "Created $Path"
}

Create-PlaceholderImage -Path "assets\onboarding_1.png" -Width $dimensions -Height $dimensions -Text "1"
Create-PlaceholderImage -Path "assets\onboarding_2.png" -Width $dimensions -Height $dimensions -Text "2"
Create-PlaceholderImage -Path "assets\onboarding_3.png" -Width $dimensions -Height $dimensions -Text "3"
