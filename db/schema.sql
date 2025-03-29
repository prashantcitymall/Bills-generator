-- Schema for Bills-generator PostgreSQL database

-- Create session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Create users table for profile management
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "google_id" varchar UNIQUE,
  "display_name" varchar NOT NULL,
  "email" varchar UNIQUE,
  "profile_picture" varchar,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create bills table for bill management
CREATE TABLE IF NOT EXISTS "bills" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "bill_number" varchar NOT NULL,
  "customer_name" varchar NOT NULL,
  "customer_address" text,
  "customer_phone" varchar,
  "bill_date" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "total_amount" decimal(10,2) NOT NULL,
  "payment_status" varchar NOT NULL DEFAULT 'unpaid',
  "items" json NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS "IDX_bills_user_id" ON "bills" ("user_id");

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_bills_modtime
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
