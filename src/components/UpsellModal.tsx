import { useState, useEffect } from 'react';
import { X, Plus, Check, Sparkles } from 'lucide-react';
import { apiFetch } from '../services/api';

interface UpsellItem {
  id: number;
  suggested_item_id: number;
  name: string;
  description: string;
  price: number;
  discount_amount: number;
  bundle_price: number;
  image_url?: string;
  bundle_name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  primaryItem: any;
  onAddToCart: (items: any[]) => void;
}

export default function UpsellModal({ isOpen, onClose, primaryItem, onAddToCart }: Props) {
  const [upsells, setUpsells] = useState<UpsellItem[]>([]);
  const [selectedUpsells, setSelectedUpsells] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && primaryItem) {
      fetchUpsells();
    }
  }, [isOpen, primaryItem]);

  const fetchUpsells = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/features/upsell/${primaryItem.id}`);
      setUpsells(data.upsell_options || []);
    } catch (error) {
      console.error('Error fetching upsells:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUpsell = (id: number) => {
    setSelectedUpsells(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    let total = primaryItem?.price || 0;
    let savings = 0;
    
    selectedUpsells.forEach(id => {
      const upsell = upsells.find(u => u.id === id);
      if (upsell) {
        total += upsell.bundle_price;
        savings += upsell.discount_amount;
      }
    });
    
    return { total, savings };
  };

  const handleAddToCart = () => {
    const items = [primaryItem];
    
    selectedUpsells.forEach(id => {
      const upsell = upsells.find(u => u.id === id);
      if (upsell) {
        items.push({
          menu_item_id: upsell.suggested_item_id,
          name: upsell.name,
          price: upsell.bundle_price,
          quantity: 1,
          is_upsell: true,
          original_price: upsell.price
        });
      }
    });
    
    onAddToCart(items);
    onClose();
  };

  if (!isOpen) return null;

  const { total, savings } = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#F4A261]" size={24} />
              <h2 className="text-2xl font-bold">Make it a Meal! 🍔✨</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <p className="mt-2 text-white/80">Complete your order with these delicious add-ons</p>
        </div>

        {/* Primary Item */}
        <div className="p-6 bg-[#F4A261]/10 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl">
              🍔
            </div>
            <div>
              <h3 className="font-bold text-[#1B4332]">{primaryItem?.name}</h3>
              <p className="text-[#E76F51] font-bold">₱{primaryItem?.price?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Upsell Options */}
        <div className="p-6 overflow-y-auto max-h-80">
          <h3 className="font-semibold text-[#1B4332] mb-4 flex items-center gap-2">
            <Plus size={18} />
            Add these to your order:
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading suggestions...</div>
          ) : upsells.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No add-ons available</div>
          ) : (
            <div className="space-y-3">
              {upsells.map((upsell) => (
                <label
                  key={upsell.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedUpsells.includes(upsell.id)
                      ? 'border-[#F4A261] bg-[#F4A261]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUpsells.includes(upsell.id)}
                    onChange={() => toggleUpsell(upsell.id)}
                    className="w-5 h-5 text-[#F4A261] rounded focus:ring-[#F4A261]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1B4332]">{upsell.name}</span>
                      {upsell.discount_amount > 0 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Save ₱{upsell.discount_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{upsell.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#E76F51]">₱{upsell.bundle_price.toFixed(2)}</p>
                    {upsell.discount_amount > 0 && (
                      <p className="text-sm text-gray-400 line-through">₱{upsell.price.toFixed(2)}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t">
          {savings > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-green-100 rounded-lg">
              <Sparkles className="text-green-600" size={18} />
              <span className="text-green-700 font-medium">
                You save ₱{savings.toFixed(2)} with this bundle!
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Bundle Total</p>
              <p className="text-2xl font-bold text-[#1B4332]">₱{total.toFixed(2)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="px-8 py-3 bg-[#F4A261] text-[#1B4332] rounded-xl font-bold hover:bg-[#E76F51] hover:text-white transition-colors flex items-center gap-2"
            >
              <Check size={20} />
              Add to Cart
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full text-center text-gray-500 hover:text-[#1B4332] text-sm"
          >
            No thanks, just the burger
          </button>
        </div>
      </div>
    </div>
  );
}
