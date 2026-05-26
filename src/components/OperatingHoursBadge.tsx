/**
 * Live Operating Hours Badge
 * Programmatically checks system clock for open/closed status
 * Philippine timezone (Asia/Manila) support
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

const STORE_SCHEDULE: OperatingHours[] = [
  { day: 'Monday', open: '14:00', close: '22:30', isOpen: true },
  { day: 'Tuesday', open: '14:00', close: '22:30', isOpen: true },
  { day: 'Wednesday', open: '14:00', close: '22:30', isOpen: true },
  { day: 'Thursday', open: '14:00', close: '22:30', isOpen: true },
  { day: 'Friday', open: '14:00', close: '22:30', isOpen: true },
  { day: 'Saturday', open: '14:00', close: '22:30', isOpen: true },
  { day: 'Sunday', open: '14:00', close: '22:30', isOpen: true }
];

interface OperatingHoursBadgeProps {
  showFullSchedule?: boolean;
  variant?: 'badge' | 'banner' | 'compact';
}

export const OperatingHoursBadge: React.FC<OperatingHoursBadgeProps> = ({ 
  showFullSchedule = false,
  variant = 'badge'
}) => {
  const [status, setStatus] = useState<'open' | 'closed' | 'closing-soon'>('closed');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeUntilClose, setTimeUntilClose] = useState<string>('');
  const [nextOpening, setNextOpening] = useState<string>('');

  useEffect(() => {
    checkOperatingStatus();
    const interval = setInterval(checkOperatingStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkOperatingStatus = () => {
    // Get current time in Philippines timezone
    const now = new Date();
    const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    setCurrentTime(phTime);

    const currentDay = phTime.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTimeStr = phTime.toTimeString().slice(0, 5); // HH:MM format
    
    const todaySchedule = STORE_SCHEDULE.find(s => s.day === currentDay);
    
    if (!todaySchedule || !todaySchedule.isOpen) {
      setStatus('closed');
      calculateNextOpening(phTime);
      return;
    }

    const openTime = todaySchedule.open;
    const closeTime = todaySchedule.close;

    if (currentTimeStr >= openTime && currentTimeStr < closeTime) {
      // Currently open
      const closeMinutes = timeToMinutes(closeTime);
      const currentMinutes = timeToMinutes(currentTimeStr);
      const minutesUntilClose = closeMinutes - currentMinutes;

      if (minutesUntilClose <= 30) {
        setStatus('closing-soon');
        setTimeUntilClose(formatDuration(minutesUntilClose));
      } else {
        setStatus('open');
        setTimeUntilClose(formatDuration(minutesUntilClose));
      }
    } else if (currentTimeStr < openTime) {
      // Before opening
      setStatus('closed');
      setNextOpening(`Opens today at ${formatTime(openTime)}`);
    } else {
      // After closing
      setStatus('closed');
      calculateNextOpening(phTime);
    }
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculateNextOpening = (currentDate: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = currentDate.getDay();
    
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      const schedule = STORE_SCHEDULE.find(s => s.day === nextDay);
      
      if (schedule && schedule.isOpen) {
        const dayName = i === 1 ? 'Tomorrow' : nextDay;
        setNextOpening(`Opens ${dayName} at ${formatTime(schedule.open)}`);
        break;
      }
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return {
          bgColor: 'bg-green-500',
          bgGradient: 'from-green-500 to-green-600',
          textColor: 'text-white',
          icon: <div className="w-2 h-2 bg-white rounded-full animate-pulse" />,
          label: 'Open Now',
          subtext: `Closes in ${timeUntilClose}`
        };
      case 'closing-soon':
        return {
          bgColor: 'bg-orange-500',
          bgGradient: 'from-orange-500 to-red-500',
          textColor: 'text-white',
          icon: <AlertCircle size={16} className="animate-pulse" />,
          label: 'Closing Soon',
          subtext: `${timeUntilClose} left to order!`
        };
      case 'closed':
        return {
          bgColor: 'bg-red-500',
          bgGradient: 'from-red-500 to-red-600',
          textColor: 'text-white',
          icon: <div className="w-2 h-2 bg-white rounded-full" />,
          label: 'Closed',
          subtext: nextOpening
        };
    }
  };

  const config = getStatusConfig();

  // Compact variant (just the badge)
  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        {config.icon}
        {config.label}
      </span>
    );
  }

  // Banner variant (full width with schedule)
  if (variant === 'banner') {
    return (
      <div className={`w-full bg-gradient-to-r ${config.bgGradient} text-white p-4 rounded-xl shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{config.label}</h3>
                {status === 'open' && config.icon}
              </div>
              <p className="text-white/90 text-sm">{config.subtext}</p>
            </div>
          </div>
          
          {showFullSchedule && (
            <div className="hidden md:block text-right">
              <p className="text-sm text-white/80">Store Hours</p>
              <p className="font-medium">2:00 PM - 10:30 PM Daily</p>
            </div>
          )}
        </div>

        {showFullSchedule && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {STORE_SCHEDULE.map((day) => (
                <div key={day.day} className="opacity-80">
                  <p className="font-medium">{day.day.slice(0, 3)}</p>
                  <p>2PM-10:30PM</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default badge variant
  return (
    <div className="relative group">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor} ${config.textColor} font-medium shadow-md cursor-pointer transition-transform hover:scale-105`}>
        {config.icon}
        <span>{config.label}</span>
        <span className="text-xs opacity-80">• {config.subtext}</span>
      </div>

      {/* Tooltip with full schedule */}
      {showFullSchedule && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <h4 className="font-bold text-[#1B4332] mb-3">Store Hours</h4>
          <div className="space-y-2">
            {STORE_SCHEDULE.map((schedule) => (
              <div key={schedule.day} className="flex justify-between text-sm">
                <span className={schedule.day === currentTime.toLocaleDateString('en-US', { weekday: 'long' }) ? 'font-bold text-[#F4A261]' : 'text-gray-600'}>
                  {schedule.day}
                </span>
                <span className="text-gray-500">
                  {formatTime(schedule.open)} - {formatTime(schedule.close)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-gray-400">
            All times in Philippines (GMT+8)
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for using operating hours in other components
export const useOperatingHours = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeUntilClose, setTimeUntilClose] = useState<number>(0);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const currentTimeStr = phTime.toTimeString().slice(0, 5);
      
      const todaySchedule = STORE_SCHEDULE.find(
        s => s.day === phTime.toLocaleDateString('en-US', { weekday: 'long' })
      );
      
      if (todaySchedule && currentTimeStr >= todaySchedule.open && currentTimeStr < todaySchedule.close) {
        setIsOpen(true);
        const closeMinutes = parseInt(todaySchedule.close.split(':')[0]) * 60 + parseInt(todaySchedule.close.split(':')[1]);
        const currentMinutes = parseInt(currentTimeStr.split(':')[0]) * 60 + parseInt(currentTimeStr.split(':')[1]);
        setTimeUntilClose(closeMinutes - currentMinutes);
      } else {
        setIsOpen(false);
        setTimeUntilClose(0);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return { isOpen, timeUntilClose, isClosingSoon: timeUntilClose <= 30 };
};

export default OperatingHoursBadge;