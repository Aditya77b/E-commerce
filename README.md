# Forma Store

A starter e-commerce storefront with a React + Vite frontend, Spring Boot REST API, and MySQL persistence.

## What is included

- Product catalog with category filters and search
- Seven pages of sample products, category filters, search, price filtering, sorting, and direct product detail pages
- Shopping bag with quantity controls
- Saved favorites and shopping bags persisted in the current browser
- Shipping progress indicator in the shopping bag
- Demo checkout that stores customer orders and order items in MySQL
- Transactional stock checks and stock reduction when an order is placed
- Twenty-eight sample products added at startup; missing sample products are added by name on later starts without duplicating the catalog

This starter does not include payment processing, user accounts, or an admin dashboard.

## Run locally on Windows

Requirements: Node.js, Java 17 or newer, and Docker Desktop. The Maven wrapper downloads Maven on first use.

1. Start MySQL from the project root:

   ```powershell
   docker compose up -d mysql
   ```

2. Start the API in a separate terminal:

   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

   The API is available at `http://localhost:8080`. Set `MYSQL_URL`, `MYSQL_USER`, and `MYSQL_PASSWORD` in the environment to override the local database settings. The defaults are for local development only.

3. Start the storefront in another terminal:

   ```powershell
   cd vite
   npm install
   npm run dev
   ```

   Open the URL printed by Vite (normally `http://localhost:5173`). Vite proxies `/api` requests to the Spring Boot server.

The Compose password is for local development only. Change it before using this project outside a local environment.
"# E-commerce" 
