CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(60) UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, brand VARCHAR(80) DEFAULT '',
  category_id INT REFERENCES categories(id) ON DELETE SET NULL, unit VARCHAR(30) NOT NULL DEFAULT 'piece',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0), active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS purchases (id SERIAL PRIMARY KEY, date DATE NOT NULL, note TEXT DEFAULT '');
CREATE INDEX IF NOT EXISTS ix_purchases_date ON purchases(date);
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY, purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL, product_name VARCHAR(160) NOT NULL,
  category_name VARCHAR(60) NOT NULL DEFAULT '', quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0), subtotal NUMERIC(12,2) NOT NULL);
CREATE INDEX IF NOT EXISTS ix_items_purchase ON purchase_items(purchase_id);
