import { useState, useEffect } from 'react';
import { menuAPI } from '../services/api';
import { Plus, Minus, ShoppingCart, Trash2, Receipt, Loader2 } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function POS() {
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await menuAPI.getMenu();
      setCategories(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      // Simulate order completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOrderComplete(true);
      setCart([]);
      setTimeout(() => setOrderComplete(false), 3000);
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const activeItems = categories.find(c => c.id === activeCategory)?.items || [];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold text-[#1B4332] mb-6">Point of Sale</h1>

      {orderComplete && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
          Order completed successfully!
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
          {/* Category Tabs */}
          <div className="flex border-b overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[#1B4332] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-[#F4A261]" size={48} />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeItems.map((item: any) => (
                    <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-4 border rounded-lg hover:shadow-md hover:border-[#F4A261] transition-all text-left"
                  >
                    <p className="font-semibold text-[#1B4332] mb-1">{item.name}</p>
                    <p className="text-[#E76F51] font-bold">₱{item.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white rounded-xl shadow-md flex flex-col">
          <div className="p-4 border-b bg-[#1B4332] text-white rounded-t-xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={24} />
              Current Order
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <ShoppingCart size={48} className="mx-auto mb-4" />
                <p>Tap items to add to cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-[#1B4332]">{item.name}</p>
                      <p className="text-sm text-gray-600">₱{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 bg-[#F4A261] rounded-full flex items-center justify-center hover:bg-[#E76F51]"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (12%)</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-[#1B4332] pt-2 border-t">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex-1 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} className="mx-auto" />
              </button>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing}
                className="flex-[3] py-3 bg-[#F4A261] text-[#1B4332] rounded-lg font-bold hover:bg-[#E76F51] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Receipt size={20} />
                    Charge ₱{total.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}