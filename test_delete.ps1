
$headers = @{ "Content-Type" = "application/json" }
$url = "http://localhost:3000/api/pastos"

# 1. Create
$body = @{ name = "TestDeleteApi"; fazenda_id = 1 } | ConvertTo-Json
$res = Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers
$id = $res.id
Write-Host "Created Pasto ID: $id"

# 2. Verify it exists
$pastos = Invoke-RestMethod -Uri $url -Method Get
$exists = $pastos | Where-Object { $_.id -eq $id }
if ($exists) { Write-Host "Verified: Pasto exists." } else { Write-Host "Error: Pasto not found after create." }

# 3. Delete
$delUrl = "$url/$id"
Invoke-RestMethod -Uri $delUrl -Method Delete
Write-Host "Sent DELETE request."

# 4. Verify it is gone
$pastos2 = Invoke-RestMethod -Uri $url -Method Get
$exists2 = $pastos2 | Where-Object { $_.id -eq $id }
if ($exists2) { 
    Write-Host "FAILURE: Pasto ID $id still exists after delete." 
} else { 
    Write-Host "SUCCESS: Pasto ID $id was deleted." 
}
