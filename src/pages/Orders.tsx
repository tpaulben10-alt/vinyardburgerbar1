import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { 
  Package, Clock, CheckCircle, Truck, 
  MapPin, Star, Loader2 
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

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  ready: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: Clock
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSelectedOrder] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderAPI.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Would submit review here
    setShowReviewModal(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F4A261]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-[#1B4332] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-gray-300 mt-2">Track and manage your orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-[#1B4332] mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start ordering your favorite burgers!</p>
            <Link 
              to="/menu" 
              className="inline-block px-8 py-3 bg-[#F4A261] text-[#1B4332] rounded-lg font-bold hover:bg-[#E76F51] hover:text-white transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status] || Clock;
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusColors[order.status]}`}>
                          <StatusIcon size={16} />
                          {statusLabels[order.status]}
                        </span>
                        <span className="text-xl font-bold text-[#E76F51]">
                          ₱{order.total_amount}
                        </span>
                      </div>
                    </div>

                    {/* Order Progress */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((status, idx) => (
                          <div key={status} className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status) && 
                              idx <= ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].indexOf(order.status === 'out_for_delivery' ? 'ready' : order.status)
                                ? 'bg-[#F4A261]' 
                                : 'bg-gray-300'
                            }`} />
                            {idx < 4 && (
                              <div className={`w-full h-1 ${
                                idx < ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].indexOf(order.status === 'out_for_delivery' ? 'ready' : order.status)
                                  ? 'bg-[#F4A261]' 
                                  : 'bg-gray-200'
                              }`} style={{ width: '100px' }} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Ordered</span>
                        <span>Confirmed</span>
                        <span>Preparing</span>
                        <span>Ready</span>
                        <span>Delivered</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      {order.items && JSON.parse(order.items || '[]').map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-2">
                          <span className="text-gray-700">{item.quantity}x {item.name}</span>
                          <span className="font-medium">₱{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Info */}
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{order.delivery_address}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {order.status === 'delivered' && !order.has_review && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowReviewModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold hover:bg-[#E76F51] hover:text-white transition-colors"
                        >
                          <Star size={18} />
                          Rate Order
                        </button>
                      )}
                      <a
                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-[#1B4332] text-[#1B4332] rounded-lg font-semibold hover:bg-[#1B4332] hover:text-white transition-colors"
                      >
                        <MapPin size={18} />
                        View Location
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#1B4332] mb-4">Rate Your Order</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-2xl ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none resize-none"
                  rows={3}
                  placeholder="How was your experience?"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold hover:bg-[#E76F51] hover:text-white transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}