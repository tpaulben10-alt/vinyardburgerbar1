import { useState, useEffect } from 'react';
import { Clock, Sparkles, Percent } from 'lucide-react';
import { apiFetch } from '../services/api';

interface HappyHourData {
  active: boolean;
  promotion?: {
    name: string;
    description: string;
    discount_percentage: number;
    banner_text: string;
  };
  discounted_items?: Array<{
    id: number;
    name: string;
    original_price: number;
    discounted_price: string;
  }>;
}

export default function HappyHourBanner() {
  const [happyHour, setHappyHour] = useState<HappyHourData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    checkHappyHour();
    const interval = setInterval(checkHappyHour, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (happyHour?.active && happyHour.promotion) {
      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [happyHour]);

  const checkHappyHour = async () => {
    try {
      const data = await apiFetch('/features/happy-hour/status');
      setHappyHour(data);
    } catch (error) {
      console.error('Error checking happy hour:', error);
    }
  };

  const calculateTimeLeft = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Assuming happy hour ends at 4 PM (16:00)
    let endHour = 16;
    let endMinute = 0;
    
    if (currentHour >= endHour) {
      setTimeLeft('00:00:00');
      return;
    }
    
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);
    
    const diff = endTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  if (!happyHour?.active || !isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white p-4 shadow-lg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="text-yellow-300" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock size={20} className="text-yellow-300" />
                {happyHour.promotion?.banner_text || 'Happy Hour Active!'}
              </h3>
              <p className="text-white/90 text-sm">
                {happyHour.promotion?.description || `Get ${happyHour.promotion?.discount_percentage}% off selected items`}
              </p>
            </div>
          </div>

          {/* Center: Countdown */}
          <div className="flex items-center gap-4 bg-white/20 rounded-xl px-6 py-2">
            <div className="text-center">
              <p className="text-xs text-white/80 uppercase tracking-wide">Ends In</p>
              <p className="text-2xl font-bold font-mono">{timeLeft}</p>
            </div>
            <div className="h-10 w-px bg-white/30"></div>
            <div className="text-center">
              <p className="text-xs text-white/80 uppercase tracking-wide">Discount</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <Percent size={20} />
                {happyHour.promotion?.discount_percentage}%
              </p>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-3">
            <a
              href="/menu"
              className="px-6 py-2 bg-white text-purple-600 rounded-full font-bold hover:bg-yellow-300 hover:text-purple-700 transition-colors shadow-lg"
            >
              Order Now
            </a>
            <button
              onClick={() => setIsVisible(false)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Featured Items */}
        {happyHour.discounted_items && happyHour.discounted_items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-white/80 mb-2">Featured items on sale:</p>
            <div className="flex flex-wrap gap-2">
              {happyHour.discounted_items.slice(0, 5).map(item => (
                <span
                  key={item.id}
                  className="px-3 py-1 bg-white/20 rounded-full text-sm flex items-center gap-2"
                >
                  {item.name}
                  <span className="line-through text-white/60">₱{item.original_price}</span>
                  <span className="text-yellow-300 font-bold">₱{item.discounted_price}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
