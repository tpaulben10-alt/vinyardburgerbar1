import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  RefreshCw, MapPin, Loader2
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await adminAPI.getOrders(params);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-[#1B4332]">Order Management</h1>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold hover:bg-[#E76F51] hover:text-white transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All Orders' : statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#F4A261]" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#1B4332]">#{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#1B4332]">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[#E76F51] hover:underline"
                      >
                        View Items
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#E76F51]">₱{Number(order.total_amount).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none text-sm"
                      >
                        {Object.keys(statusLabels).map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1B4332]">Order #{selectedOrder.id}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-[#1B4332] mb-2">Customer Info</h3>
                  <p className="text-sm"><strong>Name:</strong> {selectedOrder.customer_name}</p>
                  <p className="text-sm"><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                  <p className="text-sm"><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${statusColors[selectedOrder.status]}`}>
                      {statusLabels[selectedOrder.status]}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1B4332] mb-2">Delivery Address</h3>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#E76F51] hover:underline mt-2 inline-block"
                  >
                    View on Google Maps →
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1B4332] mb-2">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(statusLabels).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedOrder.id, status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedOrder.status === status
                            ? 'bg-[#1B4332] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-[#1B4332]">
                    <span>Total Amount</span>
                    <span>₱{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}