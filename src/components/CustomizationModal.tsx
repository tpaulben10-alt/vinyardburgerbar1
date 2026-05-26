import { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { apiFetch } from '../services/api';

interface Addon {
  id: number;
  name: string;
  price: number;
}

interface Removal {
  id: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onAddToCart: (item: any, customizations: any) => void;
}

export default function CustomizationModal({ isOpen, onClose, item, onAddToCart }: Props) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [removals, setRemovals] = useState<Removal[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [selectedRemovals, setSelectedRemovals] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      fetchCustomizations();
    }
  }, [isOpen, item]);

  const fetchCustomizations = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/features/customizations/${item.id}`);
      setAddons(data.addons || []);
      setRemovals(data.removals || []);
    } catch (error) {
      console.error('Error fetching customizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (id: number) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleRemoval = (id: number) => {
    setSelectedRemovals(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    let total = (item?.price || 0) * quantity;
    
    selectedAddons.forEach(id => {
      const addon = addons.find(a => a.id === id);
      if (addon) {
        total += addon.price * quantity;
      }
    });
    
    return total;
  };

  const handleAddToCart = () => {
    const customizations = {
      addons: selectedAddons.map(id => addons.find(a => a.id === id)),
      removals: selectedRemovals.map(id => removals.find(r => r.id === id)),
      quantity
    };
    
    onAddToCart(item, customizations);
    
    // Reset state
    setSelectedAddons([]);
    setSelectedRemovals([]);
    setQuantity(1);
    onClose();
  };

  if (!isOpen || !item) return null;

  const hasCustomizations = addons.length > 0 || removals.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#1B4332] text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Customize Your Order</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Item Info */}
        <div className="p-4 bg-[#F4A261]/10 border-b">
          <h3 className="font-bold text-[#1B4332] text-lg">{item.name}</h3>
          <p className="text-[#E76F51] font-bold text-xl">₱{item.price?.toFixed(2)}</p>
        </div>

        <div className="overflow-y-auto max-h-96 p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading options...</div>
          ) : !hasCustomizations ? (
            <div className="text-center py-8 text-gray-500">No customization options available</div>
          ) : (
            <>
              {/* Add-ons Section */}
              {addons.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-[#1B4332] mb-3 flex items-center gap-2">
                    <Plus size={18} className="text-[#F4A261]" />
                    Add-ons (Extra Charge)
                  </h4>
                  <div className="space-y-2">
                    {addons.map(addon => (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedAddons.includes(addon.id)
                            ? 'border-[#F4A261] bg-[#F4A261]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="w-5 h-5 text-[#F4A261] rounded focus:ring-[#F4A261]"
                          />
                          <span className="font-medium text-[#1B4332]">{addon.name}</span>
                        </div>
                        <span className="text-[#E76F51] font-semibold">+₱{addon.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Removals Section */}
              {removals.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-[#1B4332] mb-3 flex items-center gap-2">
                    <Minus size={18} className="text-red-500" />
                    Remove Ingredients (Free)
                  </h4>
                  <div className="space-y-2">
                    {removals.map(removal => (
                      <label
                        key={removal.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedRemovals.includes(removal.id)
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedRemovals.includes(removal.id)}
                            onChange={() => toggleRemoval(removal.id)}
                            className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                          />
                          <span className="font-medium text-[#1B4332]">{removal.name}</span>
                        </div>
                        <span className="text-green-600 font-semibold text-sm">Free</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quantity Selector */}
          <div className="mb-4">
            <h4 className="font-semibold text-[#1B4332] mb-3">Quantity</h4>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
              >
                <Minus size={20} />
              </button>
              <span className="text-2xl font-bold text-[#1B4332] w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-[#F4A261] flex items-center justify-center hover:bg-[#E76F51]"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-[#1B4332]">₱{calculateTotal().toFixed(2)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="px-6 py-3 bg-[#F4A261] text-[#1B4332] rounded-xl font-bold hover:bg-[#E76F51] hover:text-white transition-colors flex items-center gap-2"
            >
              <Check size={20} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
