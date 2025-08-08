#!/bin/bash

# Azure Functions Deployment Script
echo "Starting Azure Functions deployment..."

# Clean and build
echo "Cleaning previous build..."
npm run clean

echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "Build failed - dist directory not found"
    exit 1
fi

echo "Build successful. Deploying to Azure..."
func azure functionapp publish afimagecut --typescript --force

echo "Setting WEBSITE_RUN_FROM_PACKAGE=0 to ensure functions run from source..."
az functionapp config appsettings set --name afimagecut --resource-group az-rg-hackathon2025 --settings WEBSITE_RUN_FROM_PACKAGE=0

echo "Deployment completed!"
