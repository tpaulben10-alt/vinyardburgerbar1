import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, ChefHat, AlertTriangle } from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface KDSOrder {
  id: number;
  customer_name: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    customizations: any;
  }>;
  status: string;
  created_at: string;
  pending_minutes: number;
  estimated_prep_time: number;
  urgency: 'normal' | 'warning' | 'critical';
  color: string;
}

export default function KDS() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/features/admin/kds/orders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching KDS orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStartPreparing = async (orderId: number) => {
    try {
      await fetchWithAuth(`/features/admin/kds/${orderId}/start`, { method: 'PUT' });
      fetchOrders();
    } catch (error) {
      console.error('Error starting order:', error);
    }
  };

  const handleMarkReady = async (orderId: number) => {
    try {
      await fetchWithAuth(`/features/admin/kds/${orderId}/ready`, { method: 'PUT' });
      fetchOrders();
    } catch (error) {
      console.error('Error marking ready:', error);
    }
  };

  // Filter orders by status
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F4A261] rounded-full flex items-center justify-center">
            <ChefHat className="text-[#1B4332]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display System</h1>
            <p className="text-gray-400">Vinyard Burger Bar</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</p>
          <p className="text-gray-400">{currentTime.toLocaleDateString()}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span>Normal (&lt;15 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-400 rounded"></div>
          <span>Warning (15-25 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Critical (&gt;25 min)</span>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Confirmed Column */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} />
              Confirmed ({confirmedOrders.length})
            </h2>
          </div>
          <div className="space-y-4 overflow-y-auto h-[calc(100%-60px)]">
            {confirmedOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onAction={() => handleStartPreparing(order.id)}
                actionLabel="Start Cooking"
                actionColor="bg-[#F4A261]"
              />
            ))}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ChefHat size={20} />
              Preparing ({preparingOrders.length})
            </h2>
          </div>
          <div className="space-y-4 overflow-y-auto h-[calc(100%-60px)]">
            {preparingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onAction={() => handleMarkReady(order.id)}
                actionLabel="Mark Ready"
                actionColor="bg-green-500"
              />
            ))}
          </div>
        </div>

        {/* Ready Column */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle size={20} />
              Ready ({readyOrders.length})
            </h2>
          </div>
          <div className="space-y-4 overflow-y-auto h-[calc(100%-60px)]">
            {readyOrders.map(order => (
              <div
                key={order.id}
                className="bg-green-100 text-gray-900 rounded-xl p-4 border-4 border-green-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">#{order.id}</span>
                  <span className="text-green-700 font-bold text-lg">READY!</span>
                </div>
                <p className="font-semibold">{order.customer_name}</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-sm mt-1">
                    {item.quantity}x {item.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: KDSOrder;
  onAction: () => void;
  actionLabel: string;
  actionColor: string;
}

function OrderCard({ order, onAction, actionLabel, actionColor }: OrderCardProps) {
  const getBorderColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-orange-400 bg-orange-50';
      default: return 'border-green-400 bg-green-50';
    }
  };

  const getTimerColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className={`${getBorderColor(order.urgency)} rounded-xl p-4 border-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900">#{order.id}</span>
        <div className={`flex items-center gap-1 ${getTimerColor(order.urgency)}`}>
          {order.urgency === 'critical' && <AlertTriangle size={18} />}
          <Clock size={18} />
          <span className="font-bold">{order.pending_minutes}m</span>
        </div>
      </div>
      
      <p className="font-semibold text-gray-800 mb-2">{order.customer_name}</p>
      
      <div className="space-y-1 mb-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="text-sm text-gray-700">
            <span className="font-bold">{item.quantity}x</span> {item.name}
            {item.customizations && (
              <div className="ml-4 text-red-600 text-xs">
                {item.customizations.removals?.map((r: any) => (
                  <span key={r.id} className="mr-2">NO {r.name.toUpperCase()}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button
        onClick={onAction}
        className={`w-full py-2 ${actionColor} text-white rounded-lg font-bold hover:opacity-90 transition-opacity`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
