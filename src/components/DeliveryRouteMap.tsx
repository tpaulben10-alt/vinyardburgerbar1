import { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Phone, Package, Clock } from 'lucide-react';
import { fetchWithAuth } from '../services/api';

// Leaflet CSS and JS will be loaded dynamically
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

interface Delivery {
  id: number;
  delivery_address: string;
  latitude: number;
  longitude: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
}

export default function DeliveryRouteMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      // Load CSS
      if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
      }

      // Load JS
      if (!window.L) {
        const script = document.createElement('script');
        script.src = LEAFLET_JS;
        script.async = true;
        script.onload = () => {
          setLeaflet(window.L);
        };
        document.body.appendChild(script);
      } else {
        setLeaflet(window.L);
      }
    };

    loadLeaflet();
  }, []);

  // Fetch deliveries
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const data = await fetchWithAuth('/features/admin/delivery-routes');
        setDeliveries(data.deliveries || []);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leaflet || !mapRef.current || map) return;

    // Store location: Hinunangan, Southern Leyte
    const storeLocation = [10.3971559, 125.1983495];

    const newMap = leaflet.map(mapRef.current).setView(storeLocation, 14);

    // Add OpenStreetMap tiles
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(newMap);

    // Add store marker
    const storeIcon = leaflet.divIcon({
      className: 'custom-store-marker',
      html: '<div style="background-color: #1B4332; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #F4A261; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span style="color: white; font-size: 20px;">🏪</span></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    leaflet.marker(storeLocation, { icon: storeIcon })
      .addTo(newMap)
      .bindPopup('<b>Vinyard Burger Bar</b><br>Catmonan St., Poblacion<br>Hinunangan, Philippines');

    setMap(newMap);

    return () => {
      newMap.remove();
    };
  }, [leaflet, map]);

  // Add delivery markers
  useEffect(() => {
    if (!map || !leaflet || deliveries.length === 0) return;

    // Clear existing markers (except store)
    map.eachLayer((layer: any) => {
      if (layer instanceof leaflet.Marker && layer !== map.getLayers().find((l: any) => l === layer)) {
        // Keep store marker
        const latLng = layer.getLatLng();
        if (latLng.lat !== 10.3971559 || latLng.lng !== 125.1983495) {
          map.removeLayer(layer);
        }
      }
    });

    // Add delivery markers
    deliveries.forEach((delivery, index) => {
      if (!delivery.latitude || !delivery.longitude) return;

      const colors = ['#E76F51', '#F4A261', '#2A9D8F', '#E9C46A', '#264653'];
      const color = colors[index % colors.length];

      const deliveryIcon = leaflet.divIcon({
        className: 'custom-delivery-marker',
        html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 14px;">${index + 1}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = leaflet.marker([delivery.latitude, delivery.longitude], { icon: deliveryIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1B4332; font-weight: bold;">Order #${delivery.id}</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>${delivery.customer_name}</strong></p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">${delivery.delivery_address}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #E76F51; font-weight: bold;">₱${Number(delivery.total_amount).toFixed(2)}</p>
            <p style="margin: 4px 0; font-size: 12px; text-transform: uppercase; color: #F4A261;">${delivery.status.replace(/_/g, ' ')}</p>
          </div>
        `);

      marker.on('click', () => {
        setSelectedDelivery(delivery);
      });
    });

    // Fit bounds to show all markers
    if (deliveries.length > 0) {
      const bounds = leaflet.latLngBounds(
        deliveries
          .filter(d => d.latitude && d.longitude)
          .map(d => [d.latitude, d.longitude])
      );
      bounds.extend([10.3971559, 125.1983495]); // Include store
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, leaflet, deliveries]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 bg-[#1B4332] text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="text-[#F4A261]" />
            Delivery Routes
          </h2>
          <p className="text-sm text-white/70 mt-1">{deliveries.length} active deliveries</p>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading deliveries...</p>
          ) : deliveries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No active deliveries</p>
          ) : (
            deliveries.map((delivery, index) => (
              <div
                key={delivery.id}
                onClick={() => setSelectedDelivery(delivery)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedDelivery?.id === delivery.id
                    ? 'border-[#F4A261] bg-[#F4A261]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E76F51] text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1B4332] truncate">Order #{delivery.id}</p>
                    <p className="text-sm text-gray-600 truncate">{delivery.customer_name}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(delivery.status)}`}>
                    {delivery.status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-[#E76F51]">₱{Number(delivery.total_amount).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" style={{ minHeight: '500px' }}></div>
        
        {/* Selected Delivery Info */}
        {selectedDelivery && (
          <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-4 max-w-sm z-[1000]">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-[#1B4332]">Order #{selectedDelivery.id}</h3>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Package size={16} className="text-[#F4A261]" />
                {selectedDelivery.customer_name}
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-[#F4A261]" />
                {selectedDelivery.delivery_address}
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-[#F4A261]" />
                {selectedDelivery.customer_phone}
              </p>
              <p className="flex items-center gap-2">
                <Clock size={16} className="text-[#F4A261]" />
                <span className={getStatusColor(selectedDelivery.status)}>
                  {selectedDelivery.status.replace(/_/g, ' ')}
                </span>
              </p>
              <p className="text-xl font-bold text-[#E76F51] mt-3">
                ₱{Number(selectedDelivery.total_amount).toFixed(2)}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDelivery.latitude},${selectedDelivery.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full py-2 bg-[#1B4332] text-white text-center rounded-lg hover:bg-[#2D6A4F] transition-colors"
            >
              Get Directions
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Add TypeScript declaration for window.L
declare global {
  interface Window {
    L: any;
  }
}
