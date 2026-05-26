/**
 * Vinyard Burger Bar - React Frontend Components
 * 8 Features Implementation
 * Philippine Peso (₱) Currency
 * Tailwind CSS Styling
 * 100% Free - No Paid APIs
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Plus, Minus, Check, Clock, MapPin, Sparkles, 
  ChefHat, TrendingUp, DollarSign, Calendar, Trash2,
  Volume2, VolumeX, Navigation, Flame
} from 'lucide-react';

// =====================================================
// NOTIFICATION SERVICE (Feature 2)
// =====================================================

class NotificationService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private permission: NotificationPermission = 'default';

  constructor() {
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    this.preloadSounds();
  }

  private preloadSounds() {
    // Free sound effects from reliable CDN
    const sounds = {
      orderPlaced: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
      orderUpdated: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3',
      success: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
      alert: 'https://assets.mixkit.co/sfx/preview/mixkit-kitchen-clock-tick-1938.mp3'
    };

    Object.entries(sounds).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.audioCache.set(key, audio);
    });
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (this.permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    // Update backend preference
    try {
      await fetch('/api/notifications/preference', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled: permission === 'granted' })
      });
    } catch (e) { console.error(e); }
    
    return permission === 'granted';
  }

  playSound(type: keyof typeof this.audioCache = 'orderUpdated') {
    const sound = this.audioCache.get(type);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  showNotification(title: string, options: NotificationOptions = {}) {
    if (this.permission !== 'granted') return;

    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    });
  }

  notifyOrderStatus(orderId: number, status: string, items: string[]) {
    const messages: Record<string, { title: string; body: string; sound: string }> = {
      confirmed: { title: 'Order Confirmed! ✅', body: `Order #${orderId} is being prepared.`, sound: 'success' },
      preparing: { title: 'Now Cooking! 👨‍🍳', body: `Preparing your ${items.join(', ')}.`, sound: 'orderUpdated' },
      ready: { title: 'Order Ready! 🔔', body: 'Your food is ready!', sound: 'alert' },
      out_for_delivery: { title: 'Out for Delivery! 🛵', body: `${items.join(', ')} is on the way!`, sound: 'orderUpdated' },
      delivered: { title: 'Delivered! 🎉', body: 'Enjoy your meal!', sound: 'success' }
    };

    const msg = messages[status];
    if (msg) {
      this.playSound(msg.sound as any);
      this.showNotification(msg.title, { body: msg.body, tag: `order-${orderId}` });
    }
  }
}

export const notificationService = new NotificationService();

// =====================================================
// FEATURE 1: UPSELL MODAL COMPONENT
// =====================================================

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryItem: any;
  onAddBundle: (items: any[]) => void;
}

export const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose, primaryItem, onAddBundle }) => {
  const [upsells, setUpsells] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && primaryItem) fetchUpsells();
  }, [isOpen, primaryItem]);

  const fetchUpsells = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/upsell/${primaryItem.id}`);
      const data = await res.json();
      setUpsells(data.data?.upsell_options || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleSelection = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const calculateTotals = () => {
    let total = primaryItem?.price || 0;
    let savings = 0;
    
    selected.forEach(id => {
      const item = upsells.find(u => u.id === id);
      if (item) {
        total += parseFloat(item.discounted_price);
        savings += parseFloat(item.you_save);
      }
    });
    
    return { total, savings };
  };

  const handleAdd = () => {
    const items = [primaryItem];
    selected.forEach(id => {
      const upsell = upsells.find(u => u.id === id);
      if (upsell) {
        items.push({
          menu_item_id: upsell.suggested_item_id,
          name: upsell.name,
          price: parseFloat(upsell.discounted_price),
          quantity: 1
        });
      }
    });
    onAddBundle(items);
    notificationService.playSound('success');
  };

  if (!isOpen) return null;
  const { total, savings } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-[#F4A261]" />
              Make it a Meal!
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
          </div>
          <p className="text-white/80 mt-2">Add these items and save 10%!</p>
        </div>

        <div className="p-6">
          {/* Primary Item */}
          <div className="bg-[#F4A261]/10 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#1B4332]">{primaryItem?.name}</span>
              <span className="text-[#E76F51] font-bold">₱{primaryItem?.price?.toFixed(2)}</span>
            </div>
          </div>

          {/* Upsell Options */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {upsells.map(item => (
              <label key={item.id} 
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selected.includes(item.id) ? 'border-[#F4A261] bg-[#F4A261]/10' : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selected.includes(item.id)} 
                    onChange={() => toggleSelection(item.id)} className="w-5 h-5 text-[#F4A261]" />
                  <div>
                    <p className="font-semibold text-[#1B4332]">{item.name}</p>
                    <p className="text-sm text-gray-500 line-through">₱{item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#E76F51]">₱{item.discounted_price}</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Save ₱{item.you_save}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Total & Action */}
          <div className="mt-6 pt-4 border-t">
            {savings > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-green-100 rounded-lg text-green-700">
                <Sparkles size={18} />
                <span className="font-semibold">You save ₱{savings.toFixed(2)} with this bundle!</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">Bundle Total</p>
                <p className="text-3xl font-bold text-[#1B4332]">₱{total.toFixed(2)}</p>
              </div>
              <button onClick={handleAdd}
                className="px-8 py-3 bg-[#F4A261] text-[#1B4332] rounded-xl font-bold hover:bg-[#E76F51] hover:text-white transition-colors flex items-center gap-2">
                <Check size={20} /> Add Bundle
              </button>
            </div>
            <button onClick={onClose} className="w-full text-center text-gray-500 hover:text-[#1B4332]">
              No thanks, just the item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// FEATURE 3: CUSTOMIZATION MODAL COMPONENT
// =====================================================

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onAddToCart: (item: any, customizations: any) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({ isOpen, onClose, item, onAddToCart }) => {
  const [addons, setAddons] = useState<any[]>([]);
  const [removals, setRemovals] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [selectedRemovals, setSelectedRemovals] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && item) fetchCustomizations();
  }, [isOpen, item]);

  const fetchCustomizations = async () => {
    try {
      const res = await fetch(`/api/customizations/${item.id}`);
      const data = await res.json();
      setAddons(data.data?.addons || []);
      setRemovals(data.data?.removals || []);
    } catch (e) { console.error(e); }
  };

  const calculateTotal = () => {
    let base = (item?.price || 0) * quantity;
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = addons.find(a => a.id === id);
      return sum + (addon ? addon.price * quantity : 0);
    }, 0);
    return base + addonsTotal;
  };

  const handleAdd = () => {
    const customizations = {
      addons: selectedAddons.map(id => addons.find(a => a.id === id)),
      removals: selectedRemovals.map(id => removals.find(r => r.id === id)),
      quantity
    };
    onAddToCart(item, customizations);
    notificationService.playSound('orderPlaced');
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="bg-[#1B4332] text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Customize Your Order</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Item Info */}
          <div className="bg-[#F4A261]/10 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-[#1B4332]">{item.name}</h3>
            <p className="text-[#E76F51] font-bold text-xl">₱{item.price?.toFixed(2)}</p>
          </div>

          {/* Add-ons */}
          {addons.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-[#1B4332] mb-3 flex items-center gap-2">
                <Plus size={18} className="text-[#F4A261]" /> Add-ons (Extra Charge)
              </h4>
              <div className="space-y-2">
                {addons.map(addon => (
                  <label key={addon.id} 
                    className={`flex justify-between items-center p-3 rounded-lg border-2 cursor-pointer ${
                      selectedAddons.includes(addon.id) ? 'border-[#F4A261] bg-[#F4A261]/10' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedAddons.includes(addon.id)}
                        onChange={() => setSelectedAddons(prev => prev.includes(addon.id) ? prev.filter(i => i !== addon.id) : [...prev, addon.id])}
                        className="w-5 h-5 text-[#F4A261]" />
                      <span className="font-medium">{addon.name}</span>
                    </div>
                    <span className="text-[#E76F51] font-semibold">+₱{addon.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Removals */}
          {removals.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-[#1B4332] mb-3 flex items-center gap-2">
                <Minus size={18} className="text-red-500" /> Remove Ingredients (Free)
              </h4>
              <div className="space-y-2">
                {removals.map(removal => (
                  <label key={removal.id} 
                    className={`flex justify-between items-center p-3 rounded-lg border-2 cursor-pointer ${
                      selectedRemovals.includes(removal.id) ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedRemovals.includes(removal.id)}
                        onChange={() => setSelectedRemovals(prev => prev.includes(removal.id) ? prev.filter(i => i !== removal.id) : [...prev, removal.id])}
                        className="w-5 h-5 text-red-500" />
                      <span className="font-medium">{removal.name}</span>
                    </div>
                    <span className="text-green-600 font-semibold text-sm">Free</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-4">
            <h4 className="font-semibold text-[#1B4332] mb-3">Quantity</h4>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                <Minus size={20} />
              </button>
              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-[#F4A261] flex items-center justify-center hover:bg-[#E76F51]">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-[#1B4332]">₱{calculateTotal().toFixed(2)}</p>
            </div>
            <button onClick={handleAdd}
              className="px-6 py-3 bg-[#F4A261] text-[#1B4332] rounded-xl font-bold hover:bg-[#E76F51] hover:text-white transition-colors flex items-center gap-2">
              <Check size={20} /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// FEATURE 4: EXPENSE TRACKER COMPONENT
// =====================================================

const EXPENSE_CATEGORIES = [
  { value: 'inventory', label: 'Inventory/Raw Materials', color: 'bg-blue-100 text-blue-800' },
  { value: 'utilities', label: 'Utilities', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'rent', label: 'Rent/Lease', color: 'bg-purple-100 text-purple-800' },
  { value: 'salary', label: 'Staff Salaries', color: 'bg-green-100 text-green-800' },
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-800' },
  { value: 'miscellaneous', label: 'Miscellaneous', color: 'bg-gray-100 text-gray-800' }
];

export const ExpenseTracker: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', expense_date: '', category: 'miscellaneous', notes: '' });

  useEffect(() => { if (isOpen) fetchExpenses(); }, [isOpen]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/expenses', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setExpenses(data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) })
      });
      setShowForm(false);
      setFormData({ description: '', amount: '', expense_date: '', category: 'miscellaneous', notes: '' });
      fetchExpenses();
    } catch (e) { console.error(e); }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-[#1B4332] text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Expense Tracker</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-red-50 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-red-600 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">₱{Number(totalExpenses).toLocaleString('en-PH', {minimumFractionDigits: 2})}</p>
            </div>
            <TrendingUp className="text-red-600" size={32} />
          </div>

          <button onClick={() => setShowForm(!showForm)}
            className="w-full mb-4 py-3 border-2 border-dashed border-[#F4A261] text-[#F4A261] rounded-xl font-semibold hover:bg-[#F4A261]/10 flex items-center justify-center gap-2">
            <Plus size={20} /> {showForm ? 'Cancel' : 'Add New Expense'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Electricity Bill" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg">
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold">Save Expense</button>
            </form>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-[#1B4332] flex items-center gap-2"><Calendar size={18} /> Recent Expenses</h3>
            {expenses.length === 0 ? <p className="text-gray-500 text-center py-8">No expenses recorded</p> :
              expenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1B4332]">{exp.description}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.color}`}>
                        {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{new Date(exp.expense_date).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-red-600">-₱{Number(exp.amount).toFixed(2)}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// FEATURE 4: PROFIT ANALYTICS COMPONENT
// =====================================================

// Note: Chart.js needs to be loaded via CDN or npm install chart.js
export const ProfitAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { fetchAnalytics(); }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/analytics/daily-summary?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setAnalytics(data.data);
    } catch (e) { console.error(e); }
  };

  if (!analytics) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1B4332] flex items-center gap-2">
          <TrendingUp className="text-[#F4A261]" /> Profit Analytics
        </h2>
        <div className="flex gap-2">
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})}
            className="px-3 py-2 border rounded-lg text-sm" />
          <span className="self-center">to</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})}
            className="px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Gross Sales</p>
          <p className="text-2xl font-bold text-green-800">₱{Number(analytics.summary?.gross_sales || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium">Total Costs</p>
          <p className="text-2xl font-bold text-red-800">₱{Number((analytics.summary?.cost_of_goods || 0) + (analytics.summary?.total_expenses || 0)).toLocaleString('en-PH', {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">Net Profit</p>
          <p className="text-2xl font-bold text-blue-800">₱{Number(analytics.summary?.net_profit || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm text-purple-700 font-medium">Profit Margin</p>
          <p className="text-2xl font-bold text-purple-800">{analytics.summary?.profit_margin}%</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <canvas ref={chartRef}></canvas>
        <p className="text-center text-gray-500 mt-4">Chart visualization requires Chart.js installation</p>
      </div>
    </div>
  );
};

// =====================================================
// FEATURE 5: KITCHEN DISPLAY SYSTEM (KDS)
// =====================================================

export const KDS: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const fetchTimer = setInterval(fetchOrders, 10000);
    return () => { clearInterval(timer); clearInterval(fetchTimer); };
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/kds/orders', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setOrders(data.data || []);
    } catch (e) { console.error(e); }
  };

  const getBorderColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50 animate-pulse';
      case 'warning': return 'border-orange-400 bg-orange-50';
      default: return 'border-green-400 bg-green-50';
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/kds/${orderId}/${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchOrders();
    } catch (e) { console.error(e); }
  };

  const columns = {
    confirmed: orders.filter(o => o.status === 'confirmed'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready')
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F4A261] rounded-full flex items-center justify-center">
            <ChefHat className="text-[#1B4332]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display System</h1>
            <p className="text-gray-400">{currentTime.toLocaleTimeString()} - {currentTime.toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-400 rounded"></div><span>Normal (&lt;15 min)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-400 rounded"></div><span>Warning (15-25 min)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded animate-pulse"></div><span>Critical (&gt;25 min)</span></div>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {Object.entries(columns).map(([status, columnOrders]) => (
          <div key={status} className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-xl font-bold capitalize mb-4">{status} ({columnOrders.length})</h2>
            <div className="space-y-4 overflow-y-auto h-[calc(100%-60px)]">
              {columnOrders.map(order => (
                <div key={order.id} className={`${getBorderColor(order.urgency_level)} rounded-xl p-4 border-4`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">#{order.id}</span>
                    <div className="flex items-center gap-1 text-gray-900">
                      <Clock size={18} />
                      <span className="font-bold">{order.pending_minutes}m</span>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-800 mb-2">{order.customer_name}</p>
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-700">
                      <span className="font-bold">{item.quantity}x</span> {item.name}
                      {item.removals?.length > 0 && (
                        <span className="text-red-600 ml-2">
                          - {item.removals.map((r: any) => r.name).join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                  {status === 'confirmed' && (
                    <button onClick={() => updateStatus(order.id, 'start')}
                      className="w-full mt-3 py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-bold">Start Cooking</button>
                  )}
                  {status === 'preparing' && (
                    <button onClick={() => updateStatus(order.id, 'ready')}
                      className="w-full mt-3 py-2 bg-green-500 text-white rounded-lg font-bold">Mark Ready</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// FEATURE 6: DELIVERY ROUTE MAP (Leaflet.js)
// =====================================================

export const DeliveryRouteMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    // Load Leaflet
    const loadLeaflet = () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setLeaflet(window.L);
        document.body.appendChild(script);
      } else {
        setLeaflet(window.L);
      }
    };
    loadLeaflet();
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/delivery-routes', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setDeliveries(data.data?.deliveries || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!leaflet || !mapRef.current || map) return;

    const storeLoc = [10.3971559, 125.1983495];
    const newMap = leaflet.map(mapRef.current).setView(storeLoc, 14);
    
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    // Store marker
    const storeIcon = leaflet.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#1B4332;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #F4A261;font-size:20px;">🏪</div>',
      iconSize: [40, 40]
    });
    leaflet.marker(storeLoc, { icon: storeIcon }).addTo(newMap).bindPopup('<b>Vinyard Burger Bar</b>');

    setMap(newMap);
  }, [leaflet, map]);

  useEffect(() => {
    if (!map || !leaflet || !deliveries.length) return;

    // Clear old markers
    map.eachLayer((layer: any) => {
      if (layer instanceof leaflet.Marker && layer.getLatLng().lat !== 10.3971559) {
        map.removeLayer(layer);
      }
    });

    const bounds = leaflet.latLngBounds();
    bounds.extend([10.3971559, 125.1983495]);

    deliveries.forEach((delivery, idx) => {
      if (!delivery.latitude || !delivery.longitude) return;
      
      const colors = ['#E76F51', '#F4A261', '#2A9D8F', '#E9C46A'];
      const color = colors[idx % colors.length];
      
      const icon = leaflet.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;color:white;font-weight:bold;">${idx + 1}</div>`,
        iconSize: [36, 36]
      });

      leaflet.marker([delivery.latitude, delivery.longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>Order #${delivery.id}</b><br>${delivery.customer_name}<br>₱${Number(delivery.total_amount).toFixed(2)}`);
      
      bounds.extend([delivery.latitude, delivery.longitude]);
    });

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, leaflet, deliveries]);

  return (
    <div className="h-full flex">
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 bg-[#1B4332] text-white">
          <h2 className="text-xl font-bold flex items-center gap-2"><Navigation className="text-[#F4A261]" /> Delivery Routes</h2>
          <p className="text-sm text-white/70">{deliveries.length} active deliveries</p>
        </div>
        <div className="p-4 space-y-3">
          {deliveries.map((d, idx) => (
            <div key={d.id} className="p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E76F51] text-white flex items-center justify-center font-bold">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1B4332] truncate">Order #{d.id}</p>
                  <p className="text-sm text-gray-600 truncate">{d.customer_name}</p>
                </div>
              </div>
              <p className="text-[#E76F51] font-bold mt-2">₱{Number(d.total_amount).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
      <div ref={mapRef} className="flex-1" style={{ minHeight: '500px' }}></div>
    </div>
  );
};

// =====================================================
// FEATURE 7: SCRATCH CARD GAME
// =====================================================

interface ScratchCardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (reward: any) => void;
}

export const ScratchCardGame: React.FC<ScratchCardProps> = ({ isOpen, onClose, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [percent, setPercent] = useState(0);

  const CANVAS_WIDTH = 320;
  const CANVAS_HEIGHT = 180;

  useEffect(() => {
    if (!isOpen) return;
    
    const rewards = [
      { type: 'promo', code: 'SCRATCH-FRIES', label: 'FREE SOLO FRIES', emoji: '🍟', color: '#F4A261' },
      { type: 'promo', code: 'SCRATCH-DRINK', label: 'FREE DRINK', emoji: '🥤', color: '#2A9D8F' },
      { type: 'promo', code: 'SCRATCH-10OFF', label: '10% OFF', emoji: '🎉', color: '#E76F51' },
      { type: 'points', label: '50 BONUS POINTS', emoji: '⭐', color: '#E9C46A', value: 50 }
    ];
    setReward(rewards[Math.floor(Math.random() * rewards.length)]);
    setIsRevealed(false);
    setPercent(0);

    // Draw scratch layer
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1B4332';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'rgba(244, 162, 97, 0.1)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, Math.random() * 20 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#F4A261';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH TO WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }, [isOpen]);

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Calculate percent
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const transparent = imageData.data.filter((_, i) => i % 4 === 3 && imageData.data[i] < 128).length;
    const pct = (transparent / (CANVAS_WIDTH * CANVAS_HEIGHT)) * 100;
    setPercent(pct);

    if (pct > 60 && !isRevealed) {
      setIsRevealed(true);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };

  const handleClaim = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/scratch-reward', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onComplete(reward);
      onClose();
    } catch (e) { console.error(e); }
  };

  if (!isOpen || !reward) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-[#F4A261] rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="text-[#1B4332]" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332]">Congratulations!</h2>
          <p className="text-gray-600">Scratch to reveal your prize!</p>
        </div>

        <div className="relative mx-auto mb-6" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center text-white"
            style={{ backgroundColor: reward.color }}>
            <span className="text-6xl mb-2">{reward.emoji}</span>
            <span className="text-xl font-bold">{reward.label}</span>
          </div>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
            className={`absolute inset-0 rounded-xl cursor-pointer ${isRevealed ? 'pointer-events-none' : ''}`}
            onMouseDown={() => setIsScratching(true)}
            onMouseUp={() => setIsScratching(false)}
            onMouseLeave={() => setIsScratching(false)}
            onMouseMove={scratch}
            onTouchStart={() => setIsScratching(true)}
            onTouchEnd={() => setIsScratching(false)}
            onTouchMove={scratch}
          />
        </div>

        {!isRevealed && (
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#F4A261] transition-all" style={{ width: `${(percent / 60) * 100}%` }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Scratch more to reveal!</p>
          </div>
        )}

        {isRevealed && (
          <button onClick={handleClaim}
            className="px-8 py-3 bg-[#F4A261] text-[#1B4332] rounded-xl font-bold text-lg hover:bg-[#E76F51] hover:text-white transition-colors animate-bounce">
            Claim Your Prize! 🎁
          </button>
        )}
      </div>
    </div>
  );
};

// =====================================================
// FEATURE 8: HAPPY HOUR BANNER
// =====================================================

export const HappyHourBanner: React.FC = () => {
  const [active, setActive] = useState(false);
  const [data, setData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    checkHappyHour();
    const interval = setInterval(checkHappyHour, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!active || !data) return;
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date();
      end.setHours(16, 0, 0);
      const diff = end.getTime() - now.getTime();
      if (diff > 0) {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hrs}h ${mins}m`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [active, data]);

  const checkHappyHour = async () => {
    try {
      const res = await fetch('/api/happy-hour/status');
      const result = await res.json();
      setActive(result.active);
      setData(result.data);
    } catch (e) { console.error(e); }
  };

  if (!active || !visible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white p-4 shadow-lg relative">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="text-yellow-300" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} className="text-yellow-300" />
              {data?.banner_text || 'Happy Hour Active!'}
            </h3>
            <p className="text-white/80 text-sm">{data?.description || '10% off selected items'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/20 rounded-xl px-6 py-2">
          <div className="text-center">
            <p className="text-xs text-white/80">Ends In</p>
            <p className="text-2xl font-bold font-mono">{timeLeft}</p>
          </div>
          <div className="h-10 w-px bg-white/30"></div>
          <div className="text-center">
            <p className="text-xs text-white/80">Discount</p>
            <p className="text-2xl font-bold">{data?.discount_percent}%</p>
          </div>
        </div>

        <button onClick={() => setVisible(false)} className="text-white/80 hover:text-white">×</button>
      </div>
    </div>
  );
};

// Export all components
export default {
  UpsellModal,
  CustomizationModal,
  ExpenseTracker,
  ProfitAnalytics,
  KDS,
  DeliveryRouteMap,
  ScratchCardGame,
  HappyHourBanner,
  notificationService
};