import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menuAPI } from '../services/api';
import { Plus, Minus, ShoppingCart, Check, Flame, Sparkles } from 'lucide-react';
import UpsellModal from '../components/UpsellModal';
import CustomizationModal from '../components/CustomizationModal';
import HappyHourBanner from '../components/HappyHourBanner';
import { notificationService } from '../services/notifications';

interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  customizations?: any;
}

export default function MenuIntegrated() {
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);
  
  // Feature 1: Upselling
  const [showUpsell, setShowUpsell] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Feature 3: Customization
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<any>(null);

  useEffect(() => {
    loadMenu();
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    
    // Request notification permission on load
    notificationService.requestPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const loadMenu = async () => {
    try {
      const data = await menuAPI.getMenu();
      setCategories(data);
      if (data.length > 0) {
        setActiveCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  // Feature 1: Handle item click with upsell
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setCustomizingItem(item);
    
    // Check if item has customizations
    if (item.category_id === 4) { // Burgers category
      setShowCustomization(true);
    } else {
      // For other items, check for upsells
      setShowUpsell(true);
    }
  };

  // Feature 3: Handle add with customizations
  const handleAddWithCustomization = (item: any, customizations: any) => {
    const customPrice = customizations.addons?.reduce((sum: number, addon: any) => 
      sum + (addon?.price || 0), 0) || 0;
    
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id 
            ? { ...i, quantity: i.quantity + customizations.quantity } 
            : i
        );
      }
      return [...prev, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price + customPrice,
        quantity: customizations.quantity,
        image_url: item.image_url,
        customizations
      }];
    });

    // Play sound effect
    notificationService.playSound('orderPlaced');
    
    setAddedToCart(item.id);
    setTimeout(() => setAddedToCart(null), 1000);
    
    // Show upsell after customization
    setTimeout(() => {
      setShowUpsell(true);
    }, 500);
  };

  // Feature 1: Handle upsell add to cart
  const handleUpsellAddToCart = (items: any[]) => {
    setCart((prev) => {
      const newCart = [...prev];
      items.forEach((newItem) => {
        const existing = newCart.find((i) => i.menu_item_id === newItem.menu_item_id);
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          newCart.push(newItem);
        }
      });
      return newCart;
    });

    notificationService.playSound('success');
    
    // Show added feedback
    items.forEach((item, idx) => {
      setTimeout(() => {
        setAddedToCart(item.menu_item_id);
        setTimeout(() => setAddedToCart(null), 1000);
      }, idx * 200);
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.menu_item_id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeItems = categories.find(c => c.id === activeCategory)?.items || [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Feature 8: Happy Hour Banner */}
      <HappyHourBanner />
      
      {/* Header */}
      <div className="bg-[#1B4332] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Our Menu</h1>
          <p className="text-gray-300">Fresh, delicious food made with love</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <h2 className="font-bold text-[#1B4332] mb-4 flex items-center gap-2">
                <Flame size={20} className="text-[#E76F51]" />
                Categories
              </h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? 'bg-[#F4A261] text-[#1B4332] font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-bold text-[#1B4332] mb-3 flex items-center gap-2">
                  <ShoppingCart size={18} />
                  Your Cart ({cartCount})
                </h3>
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.menu_item_id} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1">{item.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              onClick={() => updateQuantity(item.menu_item_id, -1)}
                              className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.menu_item_id, 1)}
                              className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-[#1B4332]">
                        <span>Total:</span>
                        <span>₱{cartTotal.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <Link
                        to="/checkout"
                        className="mt-3 block w-full bg-[#1B4332] text-white text-center py-2 rounded-lg hover:bg-[#2D6A4F] transition-colors"
                      >
                        Checkout
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Your cart is empty</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1">
            {/* Happy Hour Indicator in Menu */}
            <div className="mb-6 flex items-center gap-2 text-[#E76F51]">
              <Sparkles size={20} />
              <span className="font-medium">Click on any item to customize and see bundle deals!</span>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeItems.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => handleItemClick(item)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
                >
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <img
                      src={item.image_url || `https://source.unsplash.com/400x300/?food&sig=${item.id}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-[#F4A261] text-[#1B4332] px-2 py-1 rounded text-sm font-bold">
                      {item.preparation_time} mins
                    </div>
                    {addedToCart === item.id && (
                      <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                        <Check className="text-white" size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-[#1B4332] mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#E76F51]">₱{Number(item.price).toFixed(2)}</span>
                      <span className="text-sm text-[#F4A261] font-medium flex items-center gap-1">
                        <Sparkles size={16} />
                        Click to customize
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature 1: Upsell Modal */}
      <UpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        primaryItem={selectedItem}
        onAddToCart={handleUpsellAddToCart}
      />

      {/* Feature 3: Customization Modal */}
      <CustomizationModal
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        item={customizingItem}
        onAddToCart={handleAddWithCustomization}
      />

      {/* Mobile Cart Button */}
      {cart.length > 0 && (
        <Link
          to="/checkout"
          className="fixed bottom-4 right-4 lg:hidden bg-[#1B4332] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
        >
          <ShoppingCart size={20} />
          <span>{cartCount} items</span>
          <span className="font-bold">₱{cartTotal.toFixed(2)}</span>
        </Link>
      )}
    </div>
  );
}