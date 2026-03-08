# Parse CSV and create admin-ready format
$inputCsv = "D:\Storny internetowe- Visiualcode\backend\google-maps-crawler\transport_companies.csv"
$outputCsv = "D:\Storny internetowe- Visiualcode\backend\google-maps-crawler\carriers_import_ready.csv"

Write-Host "📄 Reading CSV..." -ForegroundColor Cyan

$data = Import-Csv $inputCsv -Encoding UTF8
$output = @()

foreach ($row in $data) {
    # Extract city from address (pattern: "12-345 City, Country")
    $city = ""
    if ($row.Address -match '\d{2}-\d{3}\s+([^,]+)') {
        $city = $matches[1].Trim()
    } elseif ($row.Address -match ',\s*([^,]+),\s*Polska') {
        $city = $matches[1].Trim()
    }
    
    # Clean website
    $website = $row.Website -replace '^(https?://)?(www\.)?', '' -replace '/$', ''
    
    # Create output row
    $output += [PSCustomObject]@{
        companyName = $row.Name
        phone = $row.Phone
        website = $website
        country = 'PL'
        city = $city
        services = 'transport'
        operatingCountries = 'PL,DE,NL,BE'
        description = if ($city) { "Firma transportowa z $city. Przewóz osób i paczek." } else { "Firma transportowa. Przewóz osób i paczek." }
        isActive = 'true'
        isPremium = 'false'
        isVerified = 'false'
    }
}

# Export to CSV
$output | Export-Csv -Path $outputCsv -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "✅ SUCCESS!" -ForegroundColor Green
Write-Host "📁 Created: carriers_import_ready.csv" -ForegroundColor Yellow
Write-Host "📊 Total companies: $($output.Count)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 File ready for admin panel import!" -ForegroundColor Green
