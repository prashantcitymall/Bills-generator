import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = {
  info: (message) => console.log(`DB-INIT: ${message}`),
  error: (message, error) => {
    console.error(`DB-INIT ERROR: ${message}`);
    if (error && error.stack) {
      console.error(error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
};

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection string
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/billgenerator';

// Read the schema SQL file
async function readSchemaFile() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    logger.info(`Reading schema from ${schemaPath}`);
    return fs.readFileSync(schemaPath, 'utf8');
  } catch (error) {
    logger.error('Failed to read schema file', error);
    throw error;
  }
}

// Initialize the database
async function initializeDatabase() {
  let client;
  
  try {
    logger.info(`Connecting to PostgreSQL at ${dbUrl.substring(0, 20)}...`);
    
    // Create a new client
    client = new pg.Client({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Connect to the database
    await client.connect();
    logger.info('Connected to PostgreSQL');
    
    // Read the schema SQL
    const schemaSql = await readSchemaFile();
    
    // Execute the schema SQL
    logger.info('Executing schema SQL...');
    await client.query(schemaSql);
    
    logger.info('Database schema initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize database', error);
    return false;
  } finally {
    if (client) {
      try {
        await client.end();
        logger.info('Database connection closed');
      } catch (err) {
        logger.error('Error closing database connection', err);
      }
    }
  }
}

// Run the initialization
initializeDatabase()
  .then(success => {
    if (success) {
      logger.info('Database initialization completed successfully');
      process.exit(0);
    } else {
      logger.error('Database initialization failed');
      process.exit(1);
    }
  })
  .catch(err => {
    logger.error('Unexpected error during database initialization', err);
    process.exit(1);
  });
