import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menuAPI } from '../services/api';
import { Plus, Minus, ShoppingCart, Check, Flame } from 'lucide-react';

interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export default function Menu() {
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  useEffect(() => {
    loadMenu();
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
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

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url
      }];
    });

    setAddedToCart(item.id);
    setTimeout(() => setAddedToCart(null), 1000);
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
      {/* Header */}
      <div className="bg-[#1B4332] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Our Menu</h1>
          <p className="text-gray-300">Fresh, delicious burgers made with 100% pure beef</p>
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
                        <span>₱{cartTotal.toFixed(2)}</span>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeItems.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <img
                      src={item.image_url || `https://source.unsplash.com/400x300/?burger&sig=${item.id}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-[#F4A261] text-[#1B4332] px-2 py-1 rounded text-sm font-bold">
                      {item.preparation_time} mins
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-[#1B4332] mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#E76F51]">₱{item.price.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                          addedToCart === item.id
                            ? 'bg-green-500 text-white'
                            : 'bg-[#F4A261] text-[#1B4332] hover:bg-[#E76F51] hover:text-white'
                        }`}
                      >
                        {addedToCart === item.id ? (
                          <>
                            <Check size={18} />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus size={18} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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