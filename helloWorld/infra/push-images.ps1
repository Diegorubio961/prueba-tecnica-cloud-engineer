# push-images.ps1
# Builds and pushes Docker images to ECR after terraform apply
# Run from the infra/ directory: .\push-images.ps1

param(
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "=== HelloWorld ECS Image Push ===" -ForegroundColor Cyan

# Get outputs from terraform
Write-Host "`n[1/5] Reading Terraform outputs..." -ForegroundColor Yellow
$BackendUrl  = terraform output -raw ecr_backend_url
$FrontendUrl = terraform output -raw ecr_frontend_url
$AccountId   = ($BackendUrl -split "\.")[0]

if (-not $BackendUrl -or -not $FrontendUrl) {
    Write-Error "Could not read Terraform outputs. Run 'terraform apply' first."
    exit 1
}

Write-Host "  Backend ECR:  $BackendUrl"
Write-Host "  Frontend ECR: $FrontendUrl"

# ECR Login
Write-Host "`n[2/5] Logging into ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $Region |
    docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"

# Build backend
Write-Host "`n[3/5] Building backend image..." -ForegroundColor Yellow
docker build -t "${BackendUrl}:latest" ..\backend
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }

# Build frontend (ECS variant — uses nginx.ecs.conf with localhost:3000)
Write-Host "`n[4/5] Building frontend image (ECS variant)..." -ForegroundColor Yellow
docker build -f ..\frontend\Dockerfile.ecs -t "${FrontendUrl}:latest" ..\frontend
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }

# Push both
Write-Host "`n[5/5] Pushing images to ECR..." -ForegroundColor Yellow
docker push "${BackendUrl}:latest"
docker push "${FrontendUrl}:latest"

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Images pushed successfully. Force a new ECS deployment with:"
$ClusterName = terraform output -raw ecs_cluster_name
$ServiceName = (terraform output -raw ecs_cluster_name) -replace "-cluster", "-service"
Write-Host "  aws ecs update-service --cluster $ClusterName --service $ServiceName --force-new-deployment --region $Region" -ForegroundColor Cyan
