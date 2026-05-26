/**
 * Interactive Combo Builder Modal
 * Supercharges the ordering experience with bundle deals
 * Philippine Peso (₱) Currency Support
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Sparkles, Flame, CupSoda } from 'lucide-react';

interface ComboOption {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
}

interface ComboBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  baseItem: {
    id: number;
    name: string;
    price: number;
    image_url?: string;
  } | null;
  onAddToCart: (items: any[]) => void;
}

const COMBO_OPTIONS: ComboOption[] = [
  {
    id: 'fries_drink_combo',
    name: 'Fries + Drink Combo',
    price: 50,
    description: 'Classic Fries + Iced Tea',
    icon: <span className="text-2xl">🍟</span>,
    popular: true
  },
  {
    id: 'extra_bacon',
    name: 'Extra Bacon Strips',
    price: 30,
    description: '3 crispy bacon strips',
    icon: <Flame className="text-red-500" size={24} />
  },
  {
    id: 'extra_cheese',
    name: 'Extra Cheese Slice',
    price: 20,
    description: 'Melted cheddar cheese',
    icon: <Sparkles className="text-yellow-400" size={24} />
  },
  {
    id: 'upgrade_drink',
    name: 'Upgrade to Large Drink',
    price: 15,
    description: '16oz instead of 12oz',
    icon: <CupSoda className="text-blue-400" size={24} />
  }
];

export const ComboBuilderModal: React.FC<ComboBuilderProps> = ({ 
  isOpen, 
  onClose, 
  baseItem, 
  onAddToCart 
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedOptions([]);
      setQuantity(1);
      setShowCelebration(false);
    }
  }, [isOpen]);

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const calculateTotal = () => {
    if (!baseItem) return 0;
    
    let baseTotal = baseItem.price * quantity;
    const addonsTotal = selectedOptions.reduce((sum, optionId) => {
      const option = COMBO_OPTIONS.find(opt => opt.id === optionId);
      return sum + (option ? option.price * quantity : 0);
    }, 0);
    
    // Apply combo discount if fries_drink_combo is selected
    const hasCombo = selectedOptions.includes('fries_drink_combo');
    const comboDiscount = hasCombo ? 10 : 0; // ₱10 discount for combo
    
    return baseTotal + addonsTotal - comboDiscount;
  };

  const calculateSavings = () => {
    const hasCombo = selectedOptions.includes('fries_drink_combo');
    return hasCombo ? 10 : 0;
  };

  const handleAddToCart = () => {
    if (!baseItem) return;

    const items: any[] = [{
      menu_item_id: baseItem.id,
      name: baseItem.name,
      price: baseItem.price,
      quantity: quantity,
      image_url: baseItem.image_url
    }];

    // Add selected combo options as separate line items
    selectedOptions.forEach((optionId) => {
      const option = COMBO_OPTIONS.find(opt => opt.id === optionId);
      if (option) {
        items.push({
          menu_item_id: baseItem.id,
          name: `${baseItem.name} + ${option.name}`,
          price: option.price,
          quantity: quantity,
          is_combo_addon: true
        });
      }
    });

    setShowCelebration(true);
    
    setTimeout(() => {
      onAddToCart(items);
      onClose();
    }, 800);
  };

  // Play sound effect
  const playAddSound = () => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
    audio.play().catch(() => {});
  };

  if (!isOpen || !baseItem) return null;

  const total = calculateTotal();
  const savings = calculateSavings();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4A261]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="text-[#F4A261]" size={28} />
                Build Your Perfect Combo
              </h2>
              <p className="text-white/80 mt-1">Customize and save with our bundle deals!</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Base Item Display */}
          <div className="bg-gradient-to-r from-[#F4A261]/10 to-transparent rounded-2xl p-5 mb-6 border-2 border-[#F4A261]/20">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-[#1B4332] rounded-xl flex items-center justify-center text-4xl">
                🍔
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#1B4332]">{baseItem.name}</h3>
                <p className="text-[#E76F51] text-2xl font-bold">₱{baseItem.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl p-2 shadow-sm">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-xl font-bold">−</span>
                </button>
                <span className="text-xl font-bold text-[#1B4332] w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-[#F4A261] rounded-lg flex items-center justify-center hover:bg-[#E76F51] transition-colors"
                >
                  <Plus size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Combo Options */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-[#1B4332] mb-4 flex items-center gap-2">
              <Sparkles className="text-[#F4A261]" size={20} />
              Add to Your Combo
              {savings > 0 && (
                <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                  You save ₱{savings}!
                </span>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMBO_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => { toggleOption(option.id); playAddSound(); }}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedOptions.includes(option.id)
                      ? 'border-[#F4A261] bg-[#F4A261]/10 shadow-lg'
                      : 'border-gray-200 hover:border-[#F4A261]/50 hover:shadow-md'
                  }`}
                >
                  {option.popular && (
                    <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      POPULAR
                    </span>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedOptions.includes(option.id) ? 'bg-[#F4A261]' : 'bg-gray-100'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-[#1B4332]">{option.name}</h5>
                        {selectedOptions.includes(option.id) && (
                          <Check className="text-[#F4A261]" size={20} />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{option.description}</p>
                      <p className="text-[#E76F51] font-bold">
                        +₱{option.price.toFixed(2)}
                        {option.id === 'fries_drink_combo' && (
                          <span className="ml-2 text-xs text-green-600 font-normal">
                            (Save ₱10)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Quick Presets</h4>
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => setSelectedOptions(['fries_drink_combo'])}
                className="px-4 py-2 bg-[#1B4332]/5 hover:bg-[#1B4332]/10 rounded-full text-sm font-medium text-[#1B4332] transition-colors"
              >
                🍟 Classic Combo
              </button>
              <button 
                onClick={() => setSelectedOptions(['extra_bacon', 'extra_cheese'])}
                className="px-4 py-2 bg-[#1B4332]/5 hover:bg-[#1B4332]/10 rounded-full text-sm font-medium text-[#1B4332] transition-colors"
              >
                🥓 Bacon Lover
              </button>
              <button 
                onClick={() => setSelectedOptions(['fries_drink_combo', 'extra_bacon', 'extra_cheese'])}
                className="px-4 py-2 bg-[#F4A261]/20 hover:bg-[#F4A261]/30 rounded-full text-sm font-medium text-[#1B4332] transition-colors"
              >
                ⭐ Full Feast
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Total */}
        <div className="p-6 bg-gray-50 border-t">
          {showCelebration && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-center font-medium animate-pulse">
              🎉 Awesome combo added to cart!
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Your Combo Total</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#1B4332]">
                  ₱{total.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
                {savings > 0 && (
                  <span className="text-sm text-green-600 font-medium">
                    (Saved ₱{savings}!)
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {quantity} × {baseItem.name}
                {selectedOptions.length > 0 && ` + ${selectedOptions.length} add-on${selectedOptions.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={showCelebration}
              className="px-8 py-4 bg-[#F4A261] text-[#1B4332] rounded-xl font-bold text-lg hover:bg-[#E76F51] hover:text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2 shadow-lg"
            >
              <Check size={24} />
              Add Combo to Cart
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full text-center text-gray-500 hover:text-[#1B4332] text-sm py-2"
          >
            Skip combos, just add {baseItem.name}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboBuilderModal;