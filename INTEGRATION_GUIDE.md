# Vinyard Burger Bar - 8 Features Integration Guide

## 📋 Overview

This guide provides step-by-step instructions for integrating all 8 new features into your existing Vinyard Burger Bar system.

---

## 🗄️ Section 1: Database Installation

### Step 1: Run the Schema Upgrade

```bash
# Connect to MySQL and run the upgrade script
mysql -u your_username -p vinyard_burger_db < database_schema_upgrade.sql
```

### Step 2: Verify Installation

```sql
-- Check if all new tables were created
SHOW TABLES LIKE '%upsell%';
SHOW TABLES LIKE '%expense%';
SHOW TABLES LIKE '%happy_hour%';
SHOW TABLES LIKE '%promo%';
```

### Database Changes Summary

| Table/Columns | Purpose |
|--------------|---------|
| `upsell_relationships` | Links primary items to suggested add-ons |
| `menu_item_addons` | Paid customization options |
| `menu_item_removals` | Free removal options |
| `expenses` | Tracks operational costs |
| `happy_hour_schedules` | Time-based discount rules |
| `promo_codes` | Scratch card rewards |
| `user_promo_codes` | User reward assignments |
| `notifications_log` | Notification history |
| `kds_config` | Kitchen display settings |

---

## ⚙️ Section 2: Backend Integration

### Step 1: Install Dependencies

```bash
npm install jsonwebtoken
```

### Step 2: Create Middleware File

Create `server/middleware/auth.js` with the authentication middleware provided in `express_backend_features.js`.

### Step 3: Integrate Routes

In your main `server.js` file:

```javascript
const { router: featureRoutes, applyHappyHourDiscount } = require('./express_backend_features');

// Add Happy Hour middleware to order creation
app.post('/api/orders', authenticateToken, applyHappyHourDiscount, async (req, res) => {
  // Your existing order creation logic
  // Discount is automatically applied via req.happyHour
});

// Mount feature routes
app.use('/api', featureRoutes);
```

### Step 4: Update Environment Variables

```env
# Add to your .env file
JWT_SECRET=your-super-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=vinyard_burger_db
```

---

## 🎨 Section 3: Frontend Integration

### Step 1: Install Dependencies

```bash
npm install lucide-react
npm install chart.js
npm install react-chartjs-2
```

### Step 2: Copy Components

Copy all components from `react_frontend_features.tsx` into your project:

```
src/
├── components/
│   ├── UpsellModal.tsx
│   ├── CustomizationModal.tsx
│   ├── ExpenseTracker.tsx
│   ├── ProfitAnalytics.tsx
│   ├── KDS.tsx
│   ├── DeliveryRouteMap.tsx
│   ├── ScratchCardGame.tsx
│   └── HappyHourBanner.tsx
├── services/
│   └── notifications.ts
```

### Step 3: Update Main App

In your `App.tsx` or main router:

```typescript
import { HappyHourBanner } from './components/HappyHourBanner';
import { KDS } from './components/KDS';
import { DeliveryRouteMap } from './components/DeliveryRouteMap';
import { ProfitAnalytics } from './components/ProfitAnalytics';

// Add to your routes
<Route path="/admin/kds" element={<KDS />} />
<Route path="/admin/delivery" element={<DeliveryRouteMap />} />
<Route path="/admin/analytics" element={<ProfitAnalytics />} />
```

### Step 4: Update Menu Page

Replace your existing Menu page with the integrated version that includes upselling and customization:

```typescript
import { UpsellModal } from './components/UpsellModal';
import { CustomizationModal } from './components/CustomizationModal';
import { HappyHourBanner } from './components/HappyHourBanner';

// Add at top of page
<HappyHourBanner />

// Add modals at bottom
<UpsellModal 
  isOpen={showUpsell} 
  onClose={() => setShowUpsell(false)}
  primaryItem={selectedItem}
  onAddBundle={handleAddBundle}
/>

<CustomizationModal
  isOpen={showCustomization}
  onClose={() => setShowCustomization(false)}
  item={selectedItem}
  onAddToCart={handleAddWithCustomization}
/>
```

---

## 🎯 Feature-Specific Configuration

### Feature 1: Upselling Configuration

Configure bundle deals in database:

```sql
-- Example: Make burgers suggest fries with 10% discount
INSERT INTO upsell_relationships 
  (primary_item_id, suggested_item_id, bundle_discount_percent, bundle_name)
VALUES 
  (1, 15, 10.00, 'Make it a Meal');
```

### Feature 2: Notifications Setup

Add to user login flow:

```typescript
import { notificationService } from '../services/notifications';

// After successful login
await notificationService.requestPermission();
```

### Feature 3: Customization Configuration

Add default add-ons for burgers:

```sql
-- These are automatically added by the schema script
-- Verify they exist:
SELECT * FROM menu_item_addons WHERE menu_item_id IN (SELECT id FROM menu_items WHERE category_id = 4);
```

### Feature 4: Cost Tracking

Update menu item costs:

```sql
-- Set accurate costs for profit calculation
UPDATE menu_items SET cost_to_make = 80.00 WHERE id = 1;
```

### Feature 5: KDS Setup

For kitchen tablets:
1. Navigate to `/admin/kds`
2. Enable fullscreen mode (F11)
3. Configure thresholds in `kds_config` table

### Feature 6: Delivery Map

No configuration needed! Uses free OpenStreetMap via Leaflet.js.

### Feature 7: Scratch Card Rewards

Configure rewards in `promo_codes` table:

```sql
INSERT INTO promo_codes (code, description, reward_type, reward_value, is_scratch_card_reward)
VALUES 
  ('CUSTOM-REWARD', 'Free Dessert', 'free_item', 79.00, TRUE);
```

### Feature 8: Happy Hour Schedule

Modify the default schedule or add new ones:

```sql
INSERT INTO happy_hour_schedules 
  (name, discount_percent, applicable_days, start_time, end_time, applicable_categories, banner_text)
VALUES 
  ('Weekend Special', 15.00, 'saturday,sunday', '14:00:00', '17:00:00', '[4,5]', 'Weekend Special! 15% off!');
```

---

## 🧪 Testing Checklist

### Feature 1: Upselling
- [ ] Add burger to cart → Upsell modal appears
- [ ] Select add-ons → Price calculates correctly
- [ ] Click "Add Bundle" → All items added to cart
- [ ] Verify ₱ savings display

### Feature 2: Notifications
- [ ] Login and accept notification permission
- [ ] Place order → Sound plays
- [ ] Admin updates order status → Notification appears
- [ ] Verify on both desktop and mobile

### Feature 3: Customization
- [ ] Click burger → Customization modal opens
- [ ] Select add-ons → Price updates dynamically
- [ ] Select removals → Display correctly
- [ ] Change quantity → Total updates
- [ ] Add to cart → Customizations saved

### Feature 4: Expense Tracker
- [ ] Admin can add expense
- [ ] Categories display correctly
- [ ] Analytics show profit calculations
- [ ] Charts render properly

### Feature 5: KDS
- [ ] Orders appear in KDS view
- [ ] Color coding changes with time
- [ ] Status updates work
- [ ] Customizations display (NO ONIONS)

### Feature 6: Delivery Map
- [ ] Map loads with store location
- [ ] Active orders display as pins
- [ ] Click pin shows order details
- [ ] Sidebar list updates

### Feature 7: Scratch Card
- [ ] Submit review → Scratch card appears
- [ ] Scratching reveals prize
- [ ] 60% threshold auto-reveals
- [ ] Prize credited correctly

### Feature 8: Happy Hour
- [ ] Banner appears during active hours
- [ ] Prices discounted automatically
- [ ] Countdown timer works
- [ ] Banner hidden outside hours

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
mysql -u root -p -e "USE vinyard_burger_db; SHOW TABLES;"
```

### Sound Not Playing
- Check browser autoplay policies
- Ensure user has interacted with page first
- Verify audio URLs are accessible

### Leaflet Map Not Loading
- Check internet connection (tiles load from CDN)
- Verify coordinates are correct
- Check browser console for CORS errors

### Happy Hour Not Activating
- Verify server timezone matches Philippines
- Check database times are in correct format
- Verify current time falls within range

---

## 📊 Performance Optimization

### Database Indexes
All necessary indexes are included in the schema. Key indexes:
- `idx_active_time` on happy_hour_schedules
- `idx_expense_date` on expenses
- `idx_primary` on upsell_relationships

### Frontend Optimization
- Images lazy loaded
- Charts only render when data available
- Map markers batched for efficiency
- Sound files preloaded

---

## 🔐 Security Considerations

1. **All admin routes protected** with `authenticateToken` and `requireAdmin`
2. **SQL injection prevented** via parameterized queries
3. **Input validation** on all endpoints
4. **CORS configured** properly
5. **JWT tokens** required for sensitive operations

---

## 💰 Philippine Peso (₱) Usage

All prices are formatted consistently:

```typescript
// Always use this format for display
₱{Number(price).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}

// Examples:
// ₱175.00
// ₱1,234.50
// ₱15,000.00
```

---

## 🎉 All Features Summary

| # | Feature | Key Component | Free Alternative |
|---|---------|---------------|------------------|
| 1 | Smart Upselling | `UpsellModal.tsx` | Custom logic |
| 2 | Notifications | `notificationService.ts` | Native Browser API |
| 3 | Customization | `CustomizationModal.tsx` | Custom implementation |
| 4 | Expense Tracker | `ExpenseTracker.tsx` | Chart.js (free) |
| 5 | KDS | `KDS.tsx` | Custom dashboard |
| 6 | Delivery Map | `DeliveryRouteMap.tsx` | Leaflet.js + OpenStreetMap |
| 7 | Scratch Card | `ScratchCardGame.tsx` | HTML5 Canvas |
| 8 | Happy Hour | `HappyHourBanner.tsx` | Server time logic |

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all database tables were created
3. Check browser console for JavaScript errors
4. Verify API endpoints are responding

---

## ✅ Deployment Checklist

Before going live:

- [ ] Database schema upgraded
- [ ] Backend routes integrated
- [ ] Frontend components installed
- [ ] Environment variables configured
- [ ] Admin credentials tested
- [ ] All 8 features tested
- [ ] Philippine Peso format verified
- [ ] Mobile responsiveness checked
- [ ] Performance tested
- [ ] Security audit completed

---

**Total Implementation Time:** ~4-6 hours
**Total Files Created:** 10+ components
**Lines of Code:** ~3000+ lines
**Cost:** ₱0.00 (100% FREE!)

🎉 Your Vinyard Burger Bar system is now fully upgraded!