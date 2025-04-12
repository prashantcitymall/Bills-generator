import serverlessExpress from '@vendia/serverless-express';
import app from './app.js';

// Create Lambda handler by wrapping the Express app
export const handler = serverlessExpress({ app });
