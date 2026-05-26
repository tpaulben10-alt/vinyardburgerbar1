# Vinyard Burger Bar - Online Ordering System with POS

A comprehensive restaurant ordering system with Point of Sale (POS) functionality for Vinyard Burger Bar, featuring online ordering, customer management, order tracking, loyalty rewards, and admin dashboard.

![Vinyard Burger Bar](public/images/hero-burger.png)

## Features

### Customer Features
- **User Authentication**: Register/Login with email or Google account
- **Browse Menu**: View categorized menu items with descriptions and prices
- **Online Ordering**: Add items to cart and checkout
- **Order Tracking**: Real-time order status updates
- **Delivery Address**: Pin location on Google Maps for delivery
- **Payment Options**: Cash on Delivery (COD)
- **Order History**: View past orders and reorder
- **Ratings & Reviews**: Rate delivered orders
- **Loyalty Program**: Earn points (1 point per ₱50 spent) and redeem rewards
- **Profile Management**: Update personal information and addresses

### Admin Features
- **Dashboard**: View sales statistics, online customers, pending orders
- **POS System**: In-store point of sale for walk-in customers
- **Order Management**: View all orders, update order status
- **Customer Management**: View registered customers and online status
- **Menu Management**: Add/edit menu items, toggle availability
- **Real-time Updates**: Monitor online customers

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tool
- Tailwind CSS for styling
- React Router for navigation
- Google Maps API for location services
- Google OAuth for authentication

### Backend
- Node.js with Express
- MySQL database (Aiven for cloud hosting)
- JWT for authentication
- bcrypt for password hashing
- Google Auth Library

## Installation

### Prerequisites
- Node.js 18+ 
- MySQL database (local or Aiven)
- Google Cloud Console account (for Maps and OAuth)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vinyard-burger-bar.git
cd vinyard-burger-bar
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```env
# Database
DB_HOST=mysql-13153e92-grilledchicken.i.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=yourpassword
DB_NAME=vinyardburgerbar1
DB_PORT=16587
DB_SSL=true

# JWT
JWT_SECRET=your-super-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Frontend
# Leave VITE_API_URL unset for the single-service Render deployment.
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

4. **Set up the database**
```bash
npm run db:migrate
```

5. **Start the development server**
```bash
# Frontend dev server
npm run dev

# Production-style API/static server after npm run build
npm start
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Admin Credentials
- Email: admin@vinyardburger.com
- Password: admin123

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables in Render dashboard
4. Set build command: `npm ci && npm run build`
5. Set start command: `npm start`
6. Run `npm run db:migrate` once with the same database environment variables

### Database (Aiven)

1. Create a MySQL database on Aiven
2. Copy connection details to environment variables
3. Enable SSL connection
4. Run `npm run db:migrate` to set up tables and seed data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get specific item

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Admin
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/online-users` - Get online users
- `GET /api/admin/dashboard-stats` - Get dashboard statistics

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews` - Get all reviews

### Loyalty
- `GET /api/loyalty/rewards` - Get available rewards
- `POST /api/loyalty/redeem` - Redeem reward

## Business Information

**Vinyard Burger Bar**
- Address: Catmonan St., Poblacion, Hinunangan, Philippines, 6608
- Contact: 0912 043 1891
- Facebook: https://www.facebook.com/profile.php?id=100092581604391
- Google Maps: https://www.google.com/maps/place/Vinyard+Burger+Bar
- Hours: Mon - Sun, 2PM - 10:30PM
- Established: 2020

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@vinyardburger.com or contact us through Facebook.

---

Made with ❤️ for Vinyard Burger Bar
