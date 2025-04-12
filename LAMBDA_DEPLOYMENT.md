# AWS Lambda Deployment Guide for Bills Generator

This guide explains how to deploy the Bills Generator application to AWS Lambda using the Serverless Framework.

## Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Node.js and npm installed
- Serverless Framework installed globally (`npm install -g serverless`)

## Setup

1. Install the required dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root with the following variables (or set them in the AWS Console):

```
NODE_ENV=production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
DATABASE_URL=your_postgres_connection_string
```

Alternatively, you can use AWS Systems Manager Parameter Store to securely store these values and reference them in your `serverless.yml` file.

## VPC Configuration

Since the application uses PostgreSQL for session storage, you'll need to configure your Lambda function to run within a VPC that has access to your PostgreSQL database:

1. Create a security group that allows outbound traffic to your PostgreSQL database
2. Configure subnets that have access to your PostgreSQL database
3. Update the `serverless.yml` file with your security group and subnet IDs

```yaml
vpc:
  securityGroupIds:
    - sg-xxxxxxxxxxxxxxxxx # Your security group ID
  subnetIds:
    - subnet-xxxxxxxxxxxxxxxxx # Your subnet ID
    - subnet-xxxxxxxxxxxxxxxxx # Your subnet ID
```

## Local Testing

To test the Lambda function locally before deployment:

```bash
npm run offline
```

This will start the Serverless Offline plugin, which emulates AWS Lambda and API Gateway on your local machine.

## Deployment

To deploy the application to AWS Lambda:

```bash
npm run deploy
```

This will package your application and deploy it to AWS Lambda using the Serverless Framework.

## Setting Up Custom Domain

1. In AWS API Gateway, go to "Custom Domain Names" and create a new custom domain.
2. Set up an ACM certificate for your domain.
3. Create an API mapping to connect your custom domain to your API Gateway stage.
4. In Route 53, create an A record (Alias) pointing to your API Gateway custom domain.

## Troubleshooting

### Cold Start Issues

If you experience slow initial response times (cold starts), consider:

- Increasing the Lambda function's memory allocation in `serverless.yml`
- Using Provisioned Concurrency for production workloads

### Session Management

The application uses PostgreSQL for session storage. Make sure your Lambda function has network access to your PostgreSQL database by configuring the VPC settings correctly.

### Database Connection Issues

If you experience database connection issues:

1. Check that your security group allows outbound traffic to your PostgreSQL database
2. Verify that your subnets have proper routing to reach your database
3. Ensure your database credentials are correctly set in environment variables

### Logging

Logs are available in AWS CloudWatch. Check these logs for any errors or issues with your deployed application.

## Architecture Changes

Compared to the EC2 deployment, the Lambda version:

1. Uses `@vendia/serverless-express` to adapt the Express.js application to AWS Lambda
2. Uses PostgreSQL for session storage (same as EC2 version)
3. Optimized package size by excluding unnecessary files
4. Increased timeout and memory settings for Lambda function
5. Runs within a VPC to access the PostgreSQL database
