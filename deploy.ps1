#!/usr/bin/env pwsh

Write-Host "Checking gcloud configuration..." -ForegroundColor Cyan

# Check for gcloud
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Please install it first."
    exit 1
}

# Check auth
$account = gcloud config get-value account 2>$null
if ([string]::IsNullOrWhiteSpace($account) -or $account -eq "(unset)") {
    Write-Host "Not authenticated. Initiating login..." -ForegroundColor Yellow
    gcloud auth login
} else {
    Write-Host "Authenticated as: $account" -ForegroundColor Green
}

# Check project
$project = gcloud config get-value project 2>$null
if ([string]::IsNullOrWhiteSpace($project) -or $project -eq "(unset)") {
    Write-Host "No project configured locally." -ForegroundColor Yellow
    Write-Host "Attempting to list projects (you may need to login again if token expired)..."
    
    # Try to list projects. If it fails due to auth, run login.
    try {
        gcloud projects list
        if ($LASTEXITCODE -ne 0) { throw "Auth error" }
    } catch {
        Write-Host "Authentication failed or token expired. Re-authenticating..." -ForegroundColor Yellow
        gcloud auth login
        gcloud projects list
    }

    $project = Read-Host "Please enter the PROJECT_ID from the list above"
    if ([string]::IsNullOrWhiteSpace($project)) {
        Write-Error "Project ID is required."
        exit 1
    }
    gcloud config set project $project
} else {
    Write-Host "Using project: $project" -ForegroundColor Green
    $change = Read-Host "Do you want to change the project? (y/N)"
    if ($change -eq 'y' -or $change -eq 'Y') {
        gcloud projects list
        $project = Read-Host "Enter new PROJECT_ID"
        if (![string]::IsNullOrWhiteSpace($project)) {
            gcloud config set project $project
        }
    }
}

Write-Host "Starting deployment to Cloud Run..." -ForegroundColor Cyan
Write-Host "Service: lidacacau-api"
Write-Host "Region: us-central1"

# Deploy
# Note: Using source . triggers Cloud Build automatically
gcloud run deploy lidacacau-api `
    --source . `
    --region us-central1 `
    --allow-unauthenticated `
    --platform managed

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    $url = gcloud run services describe lidacacau-api --platform managed --region us-central1 --format 'value(status.url)'
    Write-Host "Service URL: $url" -ForegroundColor Cyan
} else {
    Write-Error "Deployment failed. Please check the logs above."
    # Ask if user wants to see logs
    $logs = Read-Host "View logs? (y/N)"
    if ($logs -eq 'y' -or $logs -eq 'Y') {
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=lidacacau-api" --limit 20 --format "value(textPayload)"
    }
}
