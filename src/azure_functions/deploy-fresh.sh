#!/bin/bash

# Azure Functions Fresh Deployment Script
echo "Starting fresh Azure Functions deployment..."

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

echo "Stopping function app..."
az functionapp stop --name afimagecut --resource-group az-rg-hackathon2025

echo "Setting WEBSITE_RUN_FROM_PACKAGE=0..."
az functionapp config appsettings set --name afimagecut --resource-group az-rg-hackathon2025 --settings WEBSITE_RUN_FROM_PACKAGE=0

echo "Deploying fresh code to Azure..."
func azure functionapp publish afimagecut --typescript --force --nozip

echo "Starting function app..."
az functionapp start --name afimagecut --resource-group az-rg-hackathon2025

echo "Fresh deployment completed!"
