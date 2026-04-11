#!/bin/bash
# PitchBox Azure Infrastructure Setup
# Run this once to provision all Azure resources

set -e

RESOURCE_GROUP="rg-pitchbox-prod"
LOCATION="centralindia"  # Closest to India users

echo "=== PitchBox Azure Setup ==="

# Login to Azure (if not already logged in)
echo "Checking Azure login..."
az account show > /dev/null 2>&1 || az login

# Create resource group
echo "Creating resource group: $RESOURCE_GROUP"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"

# Deploy Bicep template
echo "Deploying infrastructure..."
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file bicep/main.bicep \
  --parameters location="$LOCATION" appName="pitchbox"

# Get outputs
echo ""
echo "=== Deployment Complete ==="
FUNC_URL=$(az deployment group show \
  --resource-group "$RESOURCE_GROUP" \
  --name main \
  --query "properties.outputs.functionAppUrl.value" \
  --output tsv)

echo "Function App URL: $FUNC_URL"
echo ""
echo "Next steps:"
echo "1. Set Razorpay keys in Azure Function App settings:"
echo "   az functionapp config appsettings set --name func-pitchbox-api --resource-group $RESOURCE_GROUP --settings RAZORPAY_KEY_ID=<key> RAZORPAY_KEY_SECRET=<secret> JWT_SECRET=<secret>"
echo ""
echo "2. Set up GitHub Actions secrets:"
echo "   - AZURE_CREDENTIALS: Service principal JSON"
echo "   az ad sp create-for-rbac --name pitchbox-deploy --role contributor --scopes /subscriptions/<sub-id>/resourceGroups/$RESOURCE_GROUP --json-auth"
echo ""
echo "3. Configure Razorpay webhook URL:"
echo "   ${FUNC_URL}/api/payment/webhook"
