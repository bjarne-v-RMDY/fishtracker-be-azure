#!/bin/bash

# Azure Functions Source Deployment Script
echo "Starting Azure Functions source deployment..."

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

echo "Setting WEBSITE_RUN_FROM_PACKAGE=0 before deployment..."
az functionapp config appsettings set --name afimagecut --resource-group az-rg-hackathon2025 --settings WEBSITE_RUN_FROM_PACKAGE=0

echo "Deploying source code to Azure..."
func azure functionapp publish afimagecut --typescript --force --nozip

echo "Source deployment completed!"
