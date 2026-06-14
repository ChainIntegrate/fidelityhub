# Build frontend
Set-Location client
npm run build

# Copia sulla VPS
scp -r dist\* root@31.14.140.170:/var/www/fidelityhub/dist/

# Esegui script VPS
ssh root@31.14.140.170 "/root/deploy-fidelityhub.sh"

Write-Host "Deploy completato!"
