# Bills-generator

A modern bill generation web application with Google OAuth authentication and PostgreSQL database integration.

## Features

- User authentication via Google OAuth
- Session management with PostgreSQL
- Bill creation and management
- User profile management
- Responsive design

## Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Google OAuth credentials

## Database Setup

### Local Development

1. Install PostgreSQL on your local machine or use a Docker container
2. Create a new database:
   ```sql
   CREATE DATABASE billgenerator;
   ```
3. Initialize the database schema:
   ```bash
   node db/init-db.js
   ```

### AWS RDS (Production)

1. Create an RDS PostgreSQL instance in the same VPC as your EC2 instance
2. Configure security groups to allow your EC2 instance to connect to RDS
3. Create a database user and database
4. Update your `.env` file with the RDS connection string
5. Initialize the database schema:
   ```bash
   NODE_ENV=production node db/init-db.js
   ```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Add your Google OAuth credentials
   - Set `SESSION_SECRET` to a secure random string
   - Set `NODE_ENV` to `development` or `production`

## Installation

```bash
# Install dependencies
npm install

# Initialize the database
node db/init-db.js

# Start the server
npm start
```

## Development

```bash
# Run in development mode with auto-restart
npm run dev
```

## Deployment to AWS EC2

1. Set up an EC2 instance with Node.js installed
2. Clone the repository to your EC2 instance
3. Install PM2 for process management:
   ```bash
   npm install -g pm2
   ```
4. Configure your environment variables in `.env`
5. Initialize the database:
   ```bash
   NODE_ENV=production node db/init-db.js
   ```
6. Start the application with PM2:
   ```bash
   pm2 start server.js --name bills-generator
   ```
7. Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Troubleshooting

### Database Connection Issues

- Verify your PostgreSQL connection string in `.env`
- Check that your EC2 security group allows outbound traffic to your RDS instance
- Ensure your RDS security group allows inbound traffic from your EC2 instance
- Verify that the database user has appropriate permissions

### Authentication Issues

- Verify your Google OAuth credentials
- Ensure the authorized redirect URIs are correctly configured in Google Cloud Console
- Check that your callback URL matches what's configured in Google Cloud Console