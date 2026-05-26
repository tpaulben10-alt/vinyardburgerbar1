# Vinyard Burger Bar - Online Ordering System with POS

## Project Complete! 🎉

A comprehensive restaurant ordering system has been created for **Vinyard Burger Bar** with all requested features.

---

## 📁 Project Structure

```
vinyard-burger-bar/
├── public/
│   └── images/
│       └── hero-burger.png          # Generated hero image
├── server/
│   ├── server.js                     # Express backend server
│   └── database/
│       ├── schema.sql                # Complete database schema with menu
│       └── complete_menu.sql         # Full menu items
├── src/
│   ├── components/
│   │   ├── Navbar.tsx               # Navigation component
│   │   ├── AdminOrders.tsx          # Admin order management
│   │   ├── AdminCustomers.tsx       # Customer management
│   │   ├── AdminMenu.tsx            # Menu management
│   │   └── POS.tsx                  # Point of Sale system
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication context
│   ├── pages/
│   │   ├── Home.tsx                 # Landing page
│   │   ├── Login.tsx                # Login with Google OAuth
│   │   ├── Register.tsx             # User registration
│   │   ├── Menu.tsx                 # Menu browsing & cart
│   │   ├── Checkout.tsx             # Checkout with Google Maps
│   │   ├── Orders.tsx               # Order tracking
│   │   ├── Profile.tsx              # User profile & loyalty
│   │   └── AdminDashboard.tsx       # Admin dashboard
│   ├── services/
│   │   └── api.ts                   # API service functions
│   ├── App.tsx                      # Main app router
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── package.json                     # Dependencies
├── README.md                        # Project documentation
├── RENDER_DEPLOY.md                 # Deployment guide
└── PROJECT_SUMMARY.md               # This file
```

---

## ✨ Features Implemented

### Customer Features
✅ **User Authentication**
- Email/password registration and login
- Google OAuth integration
- JWT-based authentication

✅ **Complete Menu (from your images)**
- **Pasta** (6 items) - ₱175-₱195
- **Fries & Appetizers** (11 items) - ₱85-₱285
- **Sizzling Rice Meals** (5 items) - ₱125-₱185
- **Burgers** (9 items) - ₱175-₱379
- **Flavored Chicken** (6 items) - ₱165-₱515
- **Coffee** (10 items - 12oz & 16oz) - ₱85-₱155
- **Frappe** (8 items - 12oz & 16oz) - ₱125-₱185
- **Milk Shakes** (2 items) - ₱105
- **Beverages** (4 items) - ₱25-₱35

✅ **Ordering System**
- Add to cart functionality
- Real-time cart updates
- Google Maps location picker
- Delivery address input
- Estimated delivery time calculation
- Cash on Delivery (COD) payment

✅ **Order Tracking**
- Real-time order status updates
- Progress indicator (Pending → Confirmed → Preparing → Ready → Delivered)
- Order history

✅ **Loyalty Program**
- Earn 1 point per ₱50 spent
- Redeemable rewards
- Points tracking in profile

✅ **Ratings & Reviews**
- Rate delivered orders
- Write reviews
- View customer feedback

### Admin Features
✅ **Dashboard**
- Sales statistics
- Online customer count
- Pending orders alert
- Monthly revenue tracking

✅ **POS System**
- In-store ordering
- Quick menu access
- Cash payment processing
- Receipt printing ready

✅ **Order Management**
- View all orders
- Update order status
- Filter by status
- View customer location on Google Maps

✅ **Customer Management**
- View registered customers
- See online status
- Contact information
- Order history per customer

✅ **Menu Management**
- Toggle item availability
- Edit menu items (UI ready)
- Category management

---

## 💾 Database Schema

### Tables Created
1. **users** - Customer and admin accounts
2. **categories** - Menu categories (9 categories)
3. **menu_items** - 59 menu items with complete details
4. **orders** - Order records
5. **order_items** - Items in each order
6. **reviews** - Customer ratings and reviews
7. **loyalty_rewards** - Redeemable rewards
8. **loyalty_redemptions** - Reward redemption history

---

## 🔧 Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- Google Maps JavaScript API
- Google OAuth 2.0

### Backend
- Node.js + Express
- MySQL (Aiven compatible)
- JWT Authentication
- bcrypt password hashing
- CORS enabled

---

## 🚀 Deployment Ready

### Environment Variables Required
```env
# Database (Aiven MySQL)
DB_HOST=your-aiven-host
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=defaultdb
DB_PORT=24907
DB_SSL=true

# Security
JWT_SECRET=your-secret-key

# Google Services
GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Frontend
VITE_API_URL=https://your-api.onrender.com/api
```

### Deployment Steps
1. Set up Aiven MySQL database
2. Run `server/database/schema.sql`
3. Deploy backend to Render
4. Deploy frontend to Render/Netlify
5. Configure environment variables
6. Update CORS origins

See `RENDER_DEPLOY.md` for detailed instructions.

---

## 📝 Default Accounts

**Admin Account**
- Email: `admin@vinyardburger.com`
- Password: `admin123`

---

## 🎨 Brand Identity

**Vinyard Burger Bar**
- **Slogan:** "Where Friends & Burgers Gather!"
- **Established:** 2020
- **Colors:**
  - Primary Green: `#1B4332`
  - Accent Orange: `#F4A261`
  - Highlight Red-Orange: `#E76F51`
- **Address:** Catmonan St., Poblacion, Hinunangan, Philippines, 6608
- **Contact:** 0912 043 1891
- **Facebook:** https://www.facebook.com/profile.php?id=100092581604391
- **Hours:** Mon - Sun, 2PM - 10:30PM

---

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected admin routes
- SQL injection prevention (parameterized queries)
- CORS configuration
- Environment variable protection

---

## 📱 Responsive Design

The system is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

---

## 🎯 Next Steps

1. **Set up database** on Aiven
2. **Get Google API keys** (OAuth + Maps)
3. **Deploy to Render** (see RENDER_DEPLOY.md)
4. **Test the system** thoroughly
5. **Train staff** on POS system
6. **Go live!** 🚀

---

## 📞 Support

For technical support or questions, refer to:
- `README.md` - General documentation
- `RENDER_DEPLOY.md` - Deployment guide
- Express.js documentation
- React documentation

---

**Total Menu Items:** 59 items across 9 categories
**Total Lines of Code:** ~5,000+ lines
**Build Status:** ✅ Success

The system is complete and ready for deployment! 🍔✨