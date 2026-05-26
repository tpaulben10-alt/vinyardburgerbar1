# Deploying Vinyard Burger Bar to Render

This project is configured for one Render Web Service that serves both the React app and the Express API.

## 1. Configure Aiven MySQL

Use the Aiven database `vinyardburgerbar1` with SSL required.

Required Render environment variables:

```text
DB_HOST=mysql-13153e92-grilledchicken.i.aivencloud.com
DB_PORT=16587
DB_USER=avnadmin
DB_PASSWORD=<set in Render only>
DB_NAME=vinyardburgerbar1
DB_SSL=true
JWT_SECRET=<strong random secret>
```

Optional environment variables:

```text
GOOGLE_CLIENT_ID=<google oauth client id>
VITE_GOOGLE_CLIENT_ID=<google oauth client id>
VITE_GOOGLE_MAPS_API_KEY=<google maps key>
CORS_ORIGIN=<only needed for separate frontend domains>
```

For the single-service Render deployment, leave `VITE_API_URL` unset so browser API calls use the same deployed origin.

## 2. Run the Database Migration

After setting the database env vars, run:

```bash
npm run db:migrate
```

The migration creates the base ordering/POS schema, feature tables, default admin user, menu data, rewards, promo codes, and happy-hour data. It is designed to be safe to run more than once.

Default admin:

```text
Email: admin@vinyardburger.com
Password: admin123
```

Change this password after first login.

## 3. Create Render Web Service

Render settings:

```text
Environment: Node
Build Command: npm ci && npm run build
Start Command: npm start
```

The server uses Render's `PORT`, serves API routes under `/api`, serves the production React build from `dist`, and falls back to `index.html` for frontend routes such as `/menu`, `/checkout`, `/orders`, and `/admin`.

## 4. Verify

Check these after deploy:

```text
GET https://<your-service>.onrender.com/api/health
```

Then verify registration/login, menu loading, checkout, order history, and the admin dashboard tabs.
