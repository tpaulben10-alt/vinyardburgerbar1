/**
 * Local Order History & Quick Reorder
 * Uses browser localStorage for fast access
 * Philippine Peso (₱) Currency Support
 */

import React, { useState, useEffect } from 'react';
import { History, RotateCcw, ChevronRight, Trash2, Check } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface PastOrder {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: string;
}

interface LocalOrderHistoryProps {
  onReorder: (items: OrderItem[]) => void;
}

const STORAGE_KEY = 'vinyard_order_history';
const MAX_HISTORY_ITEMS = 10;

// Standalone function to save order history (export separately)
export const saveOrderToHistory = (order: {
  items: OrderItem[];
  total: number;
  status: string;
}) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let history: PastOrder[] = stored ? JSON.parse(stored) : [];

    const newOrder: PastOrder = {
      id: `order_${Date.now()}`,
      date: new Date().toISOString(),
      items: order.items,
      total: order.total,
      status: order.status
    };

    // Add to beginning, limit to MAX_HISTORY_ITEMS
    history = [newOrder, ...history].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error saving order history:', error);
    return false;
  }
};

export const LocalOrderHistory: React.FC<LocalOrderHistoryProps> = ({ onReorder }) => {
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrderHistory();
  }, []);

  const loadOrderHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setOrders(parsed);
      }
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  const handleReorder = (order: PastOrder) => {
    onReorder(order.items);
    setSelectedOrder(order.id);
    
    // Play success sound
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
    audio.play().catch(() => {});

    // Reset selection after animation
    setTimeout(() => setSelectedOrder(null), 2000);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your order history?')) {
      localStorage.removeItem(STORAGE_KEY);
      setOrders([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  const getOrderSummary = (items: OrderItem[]) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    if (itemCount === 1) return items[0]?.name || '1 item';
    return `${items[0]?.name} + ${itemCount - 1} more`;
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="text-[#F4A261]" size={24} />
          <h3 className="text-lg font-bold text-[#1B4332]">Order History</h3>
        </div>
        <p className="text-gray-500 text-center py-4">
          Your past orders will appear here for quick reordering
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F4A261]/20 rounded-full flex items-center justify-center">
            <History className="text-[#F4A261]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1B4332]">Quick Reorder</h3>
            <p className="text-sm text-gray-500">{orders.length} past order{orders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <ChevronRight 
          size={20} 
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t">
          <div className="max-h-80 overflow-y-auto">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                  selectedOrder === order.id ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#1B4332]">
                        {getOrderSummary(order.items)}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {formatDate(order.date)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </p>
                    <p className="text-[#E76F51] font-bold mt-1">
                      ₱{order.total.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleReorder(order)}
                    disabled={selectedOrder === order.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedOrder === order.id
                        ? 'bg-green-500 text-white'
                        : 'bg-[#F4A261] text-[#1B4332] hover:bg-[#E76F51] hover:text-white'
                    }`}
                  >
                    {selectedOrder === order.id ? (
                      <>
                        <Check size={16} /> Added!
                      </>
                    ) : (
                      <>
                        <RotateCcw size={16} /> Reorder
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Last {orders.length} orders stored locally on this device
            </p>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
            >
              <Trash2 size={14} /> Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalOrderHistory;