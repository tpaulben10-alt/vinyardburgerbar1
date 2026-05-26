/**
 * Real-Time Order Status Tracker
 * Animated step-by-step progress visualization
 * Philippine Peso (₱) Currency Support
 */

import React, { useState, useEffect } from 'react';
import { Check, Clock, ChefHat, Package, Home, Truck, AlertCircle } from 'lucide-react';

interface OrderStatusTrackerProps {
  orderId: number;
  currentStatus: string;
  estimatedReadyTime?: string;
}

interface StatusStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const STATUS_STEPS: StatusStep[] = [
  {
    id: 'pending',
    label: 'Order Received',
    description: 'We\'ve got your order!',
    icon: <Check size={20} />,
    color: 'bg-blue-500'
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    description: 'Order confirmed & queued',
    icon: <Clock size={20} />,
    color: 'bg-blue-500'
  },
  {
    id: 'preparing',
    label: 'Grill Master Smashing Patties',
    description: 'Our chefs are cooking up a storm!',
    icon: <ChefHat size={20} />,
    color: 'bg-[#F4A261]'
  },
  {
    id: 'ready',
    label: 'Ready for Pickup',
    description: 'Your order is hot and ready!',
    icon: <Package size={20} />,
    color: 'bg-green-500'
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'On the way to you! 🛵',
    icon: <Truck size={20} />,
    color: 'bg-purple-500'
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Enjoy your meal! 🎉',
    icon: <Home size={20} />,
    color: 'bg-green-600'
  }
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  orderId,
  currentStatus,
  estimatedReadyTime
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const index = STATUS_STEPS.findIndex(step => step.id === currentStatus);
    setCurrentStepIndex(index >= 0 ? index : 0);
    
    // Animate progress
    const targetProgress = ((index + 1) / STATUS_STEPS.length) * 100;
    const timer = setTimeout(() => setProgress(targetProgress), 300);
    
    // Show celebration when delivered
    if (currentStatus === 'delivered') {
      setTimeout(() => setShowCelebration(true), 500);
    }
    
    return () => clearTimeout(timer);
  }, [currentStatus]);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const formatEstimatedTime = () => {
    if (!estimatedReadyTime) return null;
    const date = new Date(estimatedReadyTime);
    return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#1B4332]">Order #{orderId}</h3>
          <p className="text-gray-500">
            {currentStatus === 'delivered' 
              ? 'Enjoy your meal!' 
              : `Estimated ready: ${formatEstimatedTime() || 'Calculating...'}`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F4A261]/10 rounded-full">
          <Clock className="text-[#F4A261]" size={18} />
          <span className="text-sm font-medium text-[#1B4332]">
            {STATUS_STEPS[currentStepIndex]?.label}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#1B4332] via-[#F4A261] to-[#E76F51] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress Percentage */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0%</span>
          <span className="font-medium text-[#F4A261]">{Math.round(progress)}% Complete</span>
          <span>100%</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STATUS_STEPS.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === STATUS_STEPS.length - 1;
          
          return (
            <div 
              key={step.id}
              className={`flex items-start gap-4 transition-all duration-500 ${
                status === 'pending' ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {/* Icon */}
              <div className={`relative flex-shrink-0`}>
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : status === 'current'
                      ? `${step.color} text-white animate-pulse`
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? <Check size={20} /> : step.icon}
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div 
                    className={`absolute left-1/2 top-12 w-0.5 h-8 -translate-x-1/2 transition-colors duration-300 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold ${
                    status === 'current' ? 'text-[#1B4332] text-lg' : 'text-gray-700'
                  }`}>
                    {step.label}
                  </h4>
                  {status === 'current' && (
                    <span className="px-2 py-0.5 bg-[#F4A261] text-white text-xs rounded-full animate-pulse">
                      Current
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${
                  status === 'current' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
                
                {/* Fun Messages for Current Step */}
                {status === 'current' && step.id === 'preparing' && (
                  <div className="mt-3 p-3 bg-[#F4A261]/10 rounded-lg">
                    <p className="text-sm text-[#1B4332] flex items-center gap-2">
                      <span className="text-xl">🔥</span>
                      Our grill master is smashing fresh patties right now!
                    </p>
                  </div>
                )}
                
                {status === 'current' && step.id === 'out_for_delivery' && (
                  <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-700 flex items-center gap-2">
                      <span className="text-xl">🛵</span>
                      Your rider is navigating the streets of Hinunangan!
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Info */}
      {currentStatus === 'out_for_delivery' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start gap-3">
            <Truck className="text-blue-500 mt-1" size={20} />
            <div>
              <h5 className="font-bold text-blue-700">On the way!</h5>
              <p className="text-sm text-blue-600">
                Your order is being delivered. Please have your payment ready!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Celebration */}
      {showCelebration && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-400 to-green-600 rounded-xl text-white text-center animate-bounce">
          <div className="text-4xl mb-2">🎉</div>
          <h4 className="text-xl font-bold">Your order has been delivered!</h4>
          <p className="mt-1">Enjoy your meal and thanks for choosing Vinyard Burger Bar!</p>
          <p className="text-sm mt-2 opacity-80">Don't forget to rate your experience</p>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle size={16} />
          <span>Need help? Call us at 0912 043 1891</span>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-[#F4A261] hover:text-[#E76F51] font-medium"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};

export default OrderStatusTracker;