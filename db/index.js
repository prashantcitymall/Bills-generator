import pg from "pg";
import pgPromise from "pg-promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize logger
const logger = {
  info: (message) => console.log(`DB: ${message}`),
  error: (message, error) => {
    console.error(`DB ERROR: ${message}`);
    if (error && error.stack) {
      console.error(error.stack.split("\n").slice(0, 3).join("\n"));
    }
  },
};

// PostgreSQL connection configuration
const pgConfig = {
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://sushant:8JDxnvrjwCHid7g@billcreator.cb6aeu424474.eu-north-1.rds.amazonaws.com:5432/bc",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

// Initialize pg-promise with options
const initOptions = {
  // Initialization Options
  error(error, e) {
    if (e.cn) {
      // Connection-related error
      logger.error(`Connection error to ${e.cn.database}:`, error);
    } else if (e.query) {
      // Query-related error
      logger.error(`Query error for: ${e.query}`, error);
    } else {
      // Generic error
      logger.error("Unexpected database error:", error);
    }
  },
};

// Create pg-promise instance
const pgp = pgPromise(initOptions);

// Create database instance
const db = pgp(pgConfig);

// Test database connection
async function testConnection() {
  try {
    logger.info("Testing database connection...");
    await db.one("SELECT 1 AS connected");
    logger.info("Database connection successful");
    return true;
  } catch (error) {
    logger.error("Database connection failed:", error);
    return false;
  }
}

// User-related database operations
const users = {
  // Find or create a user based on Google profile
  async findOrCreate(profile) {
    logger.info(`Looking up user with Google ID: ${profile.id}`);

    try {
      // Try to find existing user
      const user = await db.oneOrNone(
        "SELECT * FROM users WHERE google_id = $1",
        [profile.id]
      );

      if (user) {
        logger.info(`Found existing user: ${user.id}`);
        return user;
      }

      // Create new user if not found
      logger.info(`Creating new user for Google ID: ${profile.id}`);
      const email =
        profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const photo =
        profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      const newUser = await db.one(
        `INSERT INTO users (google_id, display_name, email, profile_picture)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [profile.id, profile.displayName, email, photo]
      );

      logger.info(`Created new user with ID: ${newUser.id}`);
      return newUser;
    } catch (error) {
      logger.error("Error finding or creating user:", error);
      throw error;
    }
  },

  // Get user by ID
  async findById(id) {
    try {
      logger.info(`Finding user by ID: ${id}`);
      return await db.oneOrNone("SELECT * FROM users WHERE id = $1", [id]);
    } catch (error) {
      logger.error(`Error finding user by ID ${id}:`, error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(id, updates) {
    try {
      logger.info(`Updating profile for user ID: ${id}`);
      const allowedFields = ["display_name", "email", "profile_picture"];
      const fields = Object.keys(updates).filter((field) =>
        allowedFields.includes(field)
      );

      if (fields.length === 0) {
        logger.info("No valid fields to update");
        return await this.findById(id);
      }

      // Build update query dynamically
      const setClause = fields
        .map((field, index) => `${field} = $${index + 2}`)
        .join(", ");
      const values = fields.map((field) => updates[field]);

      const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`;
      return await db.one(query, [id, ...values]);
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },
};

// Bills-related database operations
const bills = {
  // Create a new bill
  async create(userId, billData) {
    try {
      logger.info(`Creating new bill for user ID: ${userId}`);

      const query = `
        INSERT INTO bills (
          user_id, bill_number, customer_name, customer_address,
          customer_phone, total_amount, payment_status, items, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `;

      return await db.one(query, [
        userId,
        billData.billNumber,
        billData.customerName,
        billData.customerAddress,
        billData.customerPhone,
        billData.totalAmount,
        billData.paymentStatus || "unpaid",
        JSON.stringify(billData.items),
        billData.notes,
      ]);
    } catch (error) {
      logger.error("Error creating bill:", error);
      throw error;
    }
  },

  // Get all bills for a user
  async findByUserId(userId) {
    try {
      logger.info(`Finding bills for user ID: ${userId}`);
      return await db.any(
        "SELECT * FROM bills WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
    } catch (error) {
      logger.error(`Error finding bills for user ${userId}:`, error);
      throw error;
    }
  },

  // Get a specific bill by ID
  async findById(id, userId) {
    try {
      logger.info(`Finding bill ID: ${id} for user ID: ${userId}`);
      return await db.oneOrNone(
        "SELECT * FROM bills WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
    } catch (error) {
      logger.error(`Error finding bill ${id}:`, error);
      throw error;
    }
  },

  // Update a bill
  async update(id, userId, updates) {
    try {
      logger.info(`Updating bill ID: ${id} for user ID: ${userId}`);

      // Check if bill exists and belongs to user
      const bill = await this.findById(id, userId);
      if (!bill) {
        logger.error(
          `Bill ${id} not found or doesn't belong to user ${userId}`
        );
        return null;
      }

      const allowedFields = [
        "customer_name",
        "customer_address",
        "customer_phone",
        "total_amount",
        "payment_status",
        "items",
        "notes",
      ];

      // Convert camelCase to snake_case for database fields
      const dbUpdates = {};
      Object.keys(updates).forEach((key) => {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );
        if (allowedFields.includes(snakeKey)) {
          dbUpdates[snakeKey] = updates[key];
        }
      });

      if (dbUpdates.items) {
        dbUpdates.items = JSON.stringify(dbUpdates.items);
      }

      // Build update query dynamically
      const fields = Object.keys(dbUpdates);
      if (fields.length === 0) {
        logger.info("No valid fields to update");
        return bill;
      }

      const setClause = fields
        .map((field, index) => `${field} = $${index + 3}`)
        .join(", ");
      const values = fields.map((field) => dbUpdates[field]);

      const query = `UPDATE bills SET ${setClause} WHERE id = $1 AND user_id = $2 RETURNING *`;
      return await db.one(query, [id, userId, ...values]);
    } catch (error) {
      logger.error(`Error updating bill ${id}:`, error);
      throw error;
    }
  },

  // Delete a bill
  async delete(id, userId) {
    try {
      logger.info(`Deleting bill ID: ${id} for user ID: ${userId}`);
      const result = await db.result(
        "DELETE FROM bills WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Error deleting bill ${id}:`, error);
      throw error;
    }
  },
};

export { db, pgConfig, testConnection, users, bills };
