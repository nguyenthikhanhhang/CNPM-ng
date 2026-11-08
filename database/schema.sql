-- ODYSSEY - Cơ sở dữ liệu MariaDB / MySQL
CREATE DATABASE IF NOT EXISTS odyssey_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE odyssey_db;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(15)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  price       INT NOT NULL CHECK (price >= 0),
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   VARCHAR(500),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_by  INT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  customer_name  VARCHAR(100) NOT NULL,
  phone          VARCHAR(15)  NOT NULL,
  address        VARCHAR(300) NOT NULL,
  payment_method ENUM('COD','BANK') NOT NULL DEFAULT 'COD',
  status         ENUM('pending','confirmed','shipping','completed','cancelled') NOT NULL DEFAULT 'pending',
  subtotal       INT NOT NULL,
  shipping_fee   INT NOT NULL DEFAULT 30000,
  total          INT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  product_id    INT NOT NULL,
  product_name  VARCHAR(200) NOT NULL,
  unit_price    INT NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
