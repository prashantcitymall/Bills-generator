#!/bin/bash

# Deployment script for AWS Lambda
echo "Starting AWS Lambda deployment process"

# Initialize logger
log_info() {
  echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
  echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_warn() {
  echo "[WARN] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
  log_error "AWS CLI is not configured. Please run 'aws configure' first."
  exit 1
fi

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
  log_info "Serverless Framework not found. Installing..."
  npm install -g serverless
fi

# Install dependencies if needed
if [ ! -d "node_modules/@vendia" ]; then
  log_info "Installing dependencies..."
  npm install
fi

# Validate environment variables
log_info "Validating environment variables..."
if [ -f ".env" ]; then
  log_info "Found .env file"
  # Check for required variables
  source .env
  MISSING_VARS=""

  if [ -z "$GOOGLE_CLIENT_ID" ]; then MISSING_VARS="$MISSING_VARS GOOGLE_CLIENT_ID"; fi
  if [ -z "$GOOGLE_CLIENT_SECRET" ]; then MISSING_VARS="$MISSING_VARS GOOGLE_CLIENT_SECRET"; fi
  if [ -z "$SESSION_SECRET" ]; then MISSING_VARS="$MISSING_VARS SESSION_SECRET"; fi
  if [ -z "$DATABASE_URL" ]; then MISSING_VARS="$MISSING_VARS DATABASE_URL"; fi
  if [ -z "$DATABASE_URL_LOCAL" ]; then MISSING_VARS="$MISSING_VARS DATABASE_URL_LOCAL"; fi
  if [ -z "$NGROK_HOSTNAME" ]; then MISSING_VARS="$MISSING_VARS NGROK_HOSTNAME"; fi
  if [ -z "$GOOGLE_CLIENT_ID_LOCAL" ]; then MISSING_VARS="$MISSING_VARS GOOGLE_CLIENT_ID_LOCAL"; fi
  if [ -z "$GOOGLE_CLIENT_SECRET_LOCAL" ]; then MISSING_VARS="$MISSING_VARS GOOGLE_CLIENT_SECRET_LOCAL"; fi

  if [ ! -z "$MISSING_VARS" ]; then
    log_warn "Missing environment variables:$MISSING_VARS"
    log_warn "You'll need to set these in the AWS Lambda console after deployment"
  fi
else
  log_warn "No .env file found. You'll need to set environment variables in the AWS Lambda console."
fi

# Check VPC configuration in serverless.yml
log_info "Checking VPC configuration..."
if grep -q "sg-xxxxxxxxxxxxxxxxx" serverless.yml; then
  log_warn "Default security group ID found in serverless.yml. Please update with your actual security group ID."
fi

if grep -q "subnet-xxxxxxxxxxxxxxxxx" serverless.yml; then
  log_warn "Default subnet IDs found in serverless.yml. Please update with your actual subnet IDs."
fi

# Deploy to AWS Lambda
log_info "Deploying to AWS Lambda..."
npm run deploy

if [ $? -eq 0 ]; then
  log_info "Deployment successful!"
  log_info "Your API Gateway URL should be shown above."
  log_info "To set up a custom domain, follow the instructions in LAMBDA_DEPLOYMENT.md"
  log_info "IMPORTANT: Make sure your Lambda function has network access to your PostgreSQL database."
else
  log_error "Deployment failed. Please check the error messages above."
  exit 1
fi
