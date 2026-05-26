# Vinyard Burger Bar - Frontend Supercharge Features
## 5 New Interactive Components Guide

### 🎯 Features Overview

| # | Feature | Component | Key Benefit |
|---|---------|-----------|-------------|
| 1 | **Interactive Combo Builder** | `ComboBuilderModal.tsx` | Upsell with bundle deals (+₱50 fries/drink combo) |
| 2 | **Local Order History** | `LocalOrderHistory.tsx` | Quick reorder from past orders via localStorage |
| 3 | **Real-Time Order Tracker** | `OrderStatusTracker.tsx` | Animated progress visualization |
| 4 | **Share My Burger** | `ShareMyBurger.tsx` | Native Web Share API integration |
| 5 | **Operating Hours Badge** | `OperatingHoursBadge.tsx` | Live open/closed status with Philippines timezone |

---

## 📦 Installation

### Step 1: Copy Components

Copy all 5 components to your React project:

```
src/
├── components/
│   ├── ComboBuilderModal.tsx
│   ├── LocalOrderHistory.tsx
│   ├── OrderStatusTracker.tsx
│   ├── ShareMyBurger.tsx
│   └── OperatingHoursBadge.tsx
```

### Step 2: Install Dependencies

```bash
npm install lucide-react
```

---

## 🎨 Feature 1: Interactive Combo Builder

### Description
Opens when customer clicks on a menu item. Offers bundle deals:
- **Fries + Drink Combo**: ₱50 (Save ₱10!)
- **Extra Bacon**: ₱30
- **Extra Cheese**: ₱20
- **Upgrade to Large Drink**: ₱15

### Usage

```tsx
import { ComboBuilderModal } from './components/ComboBuilderModal';

const MenuPage = () => {
  const [showComboBuilder, setShowComboBuilder] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowComboBuilder(true);
  };

  const handleAddCombo = (items) => {
    // Add all items to cart
    items.forEach(item => addToCart(item));
  };

  return (
    <>
      {/* Menu items */}
      {menuItems.map(item => (
        <div onClick={() => handleItemClick(item)}>
          {item.name} - ₱{item.price}
        </div>
      ))}

      {/* Combo Builder Modal */}
      <ComboBuilderModal
        isOpen={showComboBuilder}
        onClose={() => setShowComboBuilder(false)}
        baseItem={selectedItem}
        onAddToCart={handleAddCombo}
      />
    </>
  );
};
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Controls modal visibility |
| `onClose` | () => void | Called when modal closes |
| `baseItem` | {id, name, price, image_url} | Selected menu item |
| `onAddToCart` | (items[]) => void | Callback with all items |

---

## 📋 Feature 2: Local Order History & Quick Reorder

### Description
Stores last 10 orders in browser localStorage for instant reordering. No login required!

### Usage

```tsx
import { LocalOrderHistory, saveOrderToHistory } from './components/LocalOrderHistory';

// 1. Display order history on homepage/cart
const Homepage = () => {
  const handleReorder = (items) => {
    items.forEach(item => addToCart(item));
  };

  return (
    <div>
      <LocalOrderHistory onReorder={handleReorder} />
    </div>
  );
};

// 2. Save order when checkout completes
const CheckoutPage = () => {
  const completeOrder = async () => {
    const order = await submitOrder();
    
    // Save to local history
    saveOrderToHistory({
      items: order.items,
      total: order.total,
      status: 'completed'
    });
  };
};
```

### API

```typescript
// Save order to history
saveOrderToHistory({
  items: [{ name: 'Titan Ultimate', quantity: 1, price: 379 }],
  total: 379,
  status: 'completed'
});
```

---

## 🚚 Feature 3: Real-Time Order Status Tracker

### Description
Animated step-by-step order progress with fun status messages:
- "Order Received" ✅
- "Grill Master Smashing Patties" 👨‍🍳🔥
- "Ready for Pickup" 📦
- "Out for Delivery" 🛵
- "Delivered" 🎉

### Usage

```tsx
import { OrderStatusTracker } from './components/OrderStatusTracker';

const OrderTrackingPage = ({ orderId, currentStatus }) => {
  return (
    <OrderStatusTracker
      orderId={orderId}
      currentStatus={currentStatus} // 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'
      estimatedReadyTime="2024-01-15T18:30:00"
    />
  );
};
```

### Status Flow

```
pending → confirmed → preparing → ready → out_for_delivery → delivered
   ⬇        ⬇           ⬇          ⬇           ⬇              ⬇
Received Confirmed   Cooking    Ready     On the way     Enjoy! 🎉
```

### Auto Color Coding
- ✅ **Completed steps**: Green
- 🟡 **Current step**: Orange with pulse animation
- ⚪ **Pending steps**: Gray

---

## 📤 Feature 4: Share My Burger (Web Share API)

### Description
Native Web Share integration. Falls back to copy-to-clipboard on unsupported browsers.

### Usage

```tsx
import { ShareMyBurger, ShareMyBurgerCompact } from './components/ShareMyBurger';

// Full version (order confirmation page)
<OrderConfirmationPage>
  <ShareMyBurger
    orderItems={[
      { name: 'Titan Ultimate', quantity: 1, price: 379 },
      { name: 'Fries', quantity: 1, price: 85 }
    ]}
    orderTotal={464}
  />
</OrderConfirmationPage>

// Compact version (cart sidebar)
<CartSidebar>
  <ShareMyBurgerCompact
    orderItems={cartItems}
    orderTotal={cartTotal}
  />
</CartSidebar>
```

### Generated Share Text

```
🍔 Just ordered from Vinyard Burger Bar!

📦 Order: 1x Titan Ultimate, 1x Fries
💰 Total: ₱464.00

Craving burgers? Order now at vinyardburger.com 🎉
```

### Platforms Supported
- ✅ Native Web Share (mobile)
- ✅ Facebook
- ✅ Twitter/X
- ✅ Facebook Messenger
- ✅ Copy to Clipboard

---

## 🕐 Feature 5: Live Operating Hours Badge

### Description
Shows real-time open/closed status based on Philippines timezone (Asia/Manila).

### Store Hours
- **Open**: 2:00 PM - 10:30 PM
- **Days**: Monday - Sunday
- **Timezone**: Philippines (GMT+8)

### Usage

```tsx
import { OperatingHoursBadge, useOperatingHours } from './components/OperatingHoursBadge';

// Badge variant (header/navbar)
<Navbar>
  <OperatingHoursBadge 
    variant="badge" 
    showFullSchedule={true} 
  />
</Navbar>

// Banner variant (homepage hero)
<HeroSection>
  <OperatingHoursBadge 
    variant="banner" 
    showFullSchedule={true} 
  />
</HeroSection>

// Compact variant (footer)
<Footer>
  <OperatingHoursBadge variant="compact" />
</Footer>

// Hook usage (disable ordering when closed)
const OrderButton = () => {
  const { isOpen, isClosingSoon } = useOperatingHours();
  
  return (
    <button disabled={!isOpen}>
      {isOpen 
        ? isClosingSoon 
          ? 'Order Now - Closing Soon!' 
          : 'Order Now'
        : 'Closed - Opens 2PM'
      }
    </button>
  );
};
```

### Status Display

| Status | Visual | Message |
|--------|--------|---------|
| 🟢 Open | Green pulse | "Open Now • Closes in Xh Ym" |
| 🟡 Closing Soon | Orange pulse | "Closing Soon • X min left!" |
| 🔴 Closed | Red static | "Closed • Opens tomorrow at 2PM" |

---

## 💰 Philippine Peso (₱) Formatting

All components use consistent ₱ formatting:

```typescript
// Use this format everywhere
₱{Number(price).toLocaleString('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}

// Examples:
// ₱50.00
// ₱175.00
// ₱1,234.50
// ₱15,000.00
```

---

## 🔧 Integration Example

### Complete Menu Page with All Features

```tsx
import React, { useState } from 'react';
import { ComboBuilderModal } from './components/ComboBuilderModal';
import { LocalOrderHistory } from './components/LocalOrderHistory';
import { OperatingHoursBadge } from './components/OperatingHoursBadge';
import { HappyHourBanner } from './components/HappyHourBanner'; // From previous features

const MenuPage = () => {
  const [cart, setCart] = useState([]);
  const [showComboBuilder, setShowComboBuilder] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const addToCart = (items) => {
    setCart(prev => [...prev, ...items]);
  };

  const handleReorder = (items) => {
    items.forEach(item => addToCart([item]));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Operating Hours Badge */}
      <div className="bg-[#1B4332] text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1>Vinyard Burger Bar</h1>
          <OperatingHoursBadge variant="badge" showFullSchedule />
        </div>
      </div>

      {/* Happy Hour Banner */}
      <HappyHourBanner />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Reorder History */}
            <LocalOrderHistory onReorder={handleReorder} />
            
            {/* Cart Summary */}
            <CartSummary cart={cart} />
          </div>

          {/* Menu Grid */}
          <div className="lg:col-span-3">
            <MenuGrid onItemClick={(item) => {
              setSelectedItem(item);
              setShowComboBuilder(true);
            }} />
          </div>
        </div>
      </div>

      {/* Combo Builder Modal */}
      <ComboBuilderModal
        isOpen={showComboBuilder}
        onClose={() => setShowComboBuilder(false)}
        baseItem={selectedItem}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default MenuPage;
```

---

## 📱 Responsive Design

All components are fully responsive:
- ✅ Mobile-optimized touch targets
- ✅ Tablet-friendly layouts
- ✅ Desktop-enhanced views
- ✅ Works on all screen sizes

---

## 🎨 Styling

All components use Tailwind CSS with Vinyard Burger Bar colors:

```css
Primary Green: #1B4332
Accent Orange: #F4A261
Highlight Red-Orange: #E76F51
```

---

## 🔒 100% FREE - No Paid APIs

| Feature | Technology | Cost |
|---------|------------|------|
| Combo Builder | Custom React | ₱0 |
| Order History | localStorage | ₱0 |
| Order Tracker | Custom Animation | ₱0 |
| Share Button | Native Web Share API | ₱0 |
| Hours Badge | JavaScript Date | ₱0 |

---

## 🎉 Summary

**Total Components**: 5
**Total Lines of Code**: ~1000+
**Dependencies**: lucide-react only
**Cost**: ₱0.00 (100% FREE!)

Your Vinyard Burger Bar frontend is now SUPERCHARGED! 🚀🍔