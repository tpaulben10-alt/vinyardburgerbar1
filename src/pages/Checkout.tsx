import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { MapPin, CreditCard, Clock, Loader2, ArrowLeft, Truck } from 'lucide-react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px'
};

// Default to Hinunangan, Southern Leyte
const defaultCenter = {
  lat: 10.3971559,
  lng: 125.1983495
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setMapLoaded] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  
  const [formData, setFormData] = useState({
    delivery_address: user?.address || '',
    phone: user?.phone || '',
    payment_method: 'cash_on_delivery',
    notes: '',
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (parsedCart.length === 0) {
        navigate('/menu');
      }
      setCart(parsedCart);
    } else {
      navigate('/menu');
    }
  }, [isAuthenticated, navigate]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cartTotal > 500 ? 0 : 50;
  const totalAmount = cartTotal + deliveryFee;
  const estimatedMinutes = 15 + (cart.length * 5);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          customizations: {}
        })),
        total_amount: totalAmount,
        delivery_address: formData.delivery_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        payment_method: formData.payment_method,
        notes: formData.notes
      };

      const response = await orderAPI.createOrder(orderData);
      
      // Clear cart
      localStorage.removeItem('cart');
      
      // Navigate to order confirmation
      navigate(`/orders/${response.orderId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-[#1B4332] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:text-[#F4A261]">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold mt-4">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Form */}
          <div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
                  <MapPin className="text-[#E76F51]" />
                  Delivery Location
                </h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pin your location on the map
                  </label>
                  <div className="rounded-lg overflow-hidden border">
                    <LoadScript 
                      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
                      onLoad={() => setMapLoaded(true)}
                    >
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={markerPosition}
                        zoom={15}
                        onClick={handleMapClick}
                      >
                        <Marker position={markerPosition} />
                      </GoogleMap>
                    </LoadScript>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Click on the map to set your delivery location
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complete Address
                  </label>
                  <textarea
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none resize-none"
                    rows={3}
                    placeholder="House number, street, barangay, landmarks..."
                    required
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none"
                    placeholder="09123456789"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
                  <CreditCard className="text-[#E76F51]" />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      value="cash_on_delivery"
                      checked={formData.payment_method === 'cash_on_delivery'}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#1B4332]">Cash on Delivery</p>
                      <p className="text-sm text-gray-500">Pay when your order arrives</p>
                    </div>
                    <Truck className="text-[#F4A261]" />
                  </label>
                  
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-60">
                    <input
                      type="radio"
                      value="gcash"
                      disabled
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#1B4332]">GCash</p>
                      <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-[#1B4332] mb-4">Additional Notes</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none resize-none"
                  rows={3}
                  placeholder="Any special instructions for your order..."
                />
              </div>
            </form>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-[#1B4332] mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.menu_item_id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🍔</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1B4332]">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold">₱{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₱{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₱${deliveryFee.toFixed(2)}`}</span>
                </div>
                {deliveryFee === 0 && (
                  <p className="text-sm text-green-600">Free delivery for orders over ₱500!</p>
                )}
                <div className="flex justify-between text-xl font-bold text-[#1B4332] pt-2">
                  <span>Total</span>
                  <span>₱{totalAmount.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#F4A261]/10 rounded-lg flex items-center gap-3">
                <Clock className="text-[#E76F51]" size={24} />
                <div>
                  <p className="font-semibold text-[#1B4332]">Estimated Time</p>
                  <p className="text-sm text-gray-600">{estimatedMinutes} - {estimatedMinutes + 10} minutes</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 bg-[#1B4332] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#2D6A4F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Placing Order...
                  </>
                ) : (
                  `Place Order - ₱${totalAmount.toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}