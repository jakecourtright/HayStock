-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  unit VARCHAR(50) DEFAULT 'bales',
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Stacks (Products) Table
CREATE TABLE IF NOT EXISTS stacks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  commodity VARCHAR(255),
  bale_size VARCHAR(100),
  quality VARCHAR(100),
  base_price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(50) NOT NULL, -- 'production', 'purchase', 'sale'
  stack_id INTEGER REFERENCES stacks(id) ON DELETE SET NULL,
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  entity VARCHAR(255), -- Buyer or seller name
  price DECIMAL(10, 2) DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
