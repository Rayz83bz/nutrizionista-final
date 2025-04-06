# Vai nella cartella principale del progetto
$projectPath = "C:\Users\DottDanieleBertagnol\Desktop\NutrizionistaFinal"
$zipFilePath = "C:\Users\DottDanieleBertagnol\Desktop\NutrizionistaFinal_clean.zip"

# Filtra tutti i file e cartelle tranne node_modules
$itemsToZip = Get-ChildItem -Path $projectPath -Recurse | Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\bak'
}

# Crea il file ZIP
if (Test-Path $zipFilePath) {
    Remove-Item $zipFilePath
}
Compress-Archive -Path $itemsToZip.FullName -DestinationPath $zipFilePath

Write-Output "✅ Archivio creato: $zipFilePath"
