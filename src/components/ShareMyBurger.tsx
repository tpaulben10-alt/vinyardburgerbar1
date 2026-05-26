/**
 * Share My Burger - Web Share API Integration
 * Allows customers to share their order to social media/messaging
 * Philippine Peso (₱) Currency Support
 */

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, X } from 'lucide-react';

interface ShareMyBurgerProps {
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  orderTotal: number;
}

export const ShareMyBurger: React.FC<ShareMyBurgerProps> = ({ 
  orderItems, 
  orderTotal 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const generateShareText = () => {
    const itemList = orderItems.map(item => 
      `${item.quantity}x ${item.name}`
    ).join(', ');
    
    return `🍔 Just ordered from Vinyard Burger Bar!\n\n` +
           `📦 Order: ${itemList}\n` +
           `💰 Total: ₱${orderTotal.toLocaleString('en-PH', {minimumFractionDigits: 2})}\n\n` +
           `Craving burgers? Order now at vinyardburger.com 🎉`;
  };

  const generateShareData = () => {
    const text = generateShareText();
    
    return {
      title: 'My Vinyard Burger Order',
      text: text,
      url: 'https://vinyardburger.com'
    };
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(generateShareData());
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: show modal with copy options
      setShowModal(true);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFacebookShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleNativeShare}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
          shared 
            ? 'bg-green-500 text-white' 
            : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'
        }`}
      >
        {shared ? (
          <>
            <Check size={18} /> Shared!
          </>
        ) : (
          <>
            <Share2 size={18} /> Share My Order
          </>
        )}
      </button>

      {/* Fallback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1B4332]">Share Your Order</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-[#F4A261]/10 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🍔</span>
                <span className="font-bold text-[#1B4332]">
                  {itemCount} item{itemCount > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {orderItems.map(i => `${i.quantity}x ${i.name}`).join(', ')}
              </p>
              <p className="text-[#E76F51] font-bold text-lg mt-2">
                ₱{orderTotal.toLocaleString('en-PH', {minimumFractionDigits: 2})}
              </p>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleFacebookShare}
                className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              <button
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 p-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>
            </div>

            {/* Copy Text Option */}
            <button
              onClick={handleCopyText}
              className={`w-full p-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                copied 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 hover:border-[#F4A261]'
              }`}
            >
              {copied ? (
                <>
                  <Check size={18} /> Copied to clipboard!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copy Order Details
                </>
              )}
            </button>

            {/* Messenger Link */}
            <a
              href={`fb-messenger://share?link=${encodeURIComponent('https://vinyardburger.com')}`}
              className="mt-3 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <MessageCircle size={20} /> Share on Messenger
            </a>

            <p className="text-center text-xs text-gray-400 mt-4">
              Share your order and get your friends craving! 🎉
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// Compact version for cart/checkout
export const ShareMyBurgerCompact: React.FC<ShareMyBurgerProps> = ({ 
  orderItems, 
  orderTotal 
}) => {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const text = `🍔 Ordering ${itemCount} items from Vinyard Burger Bar for ₱${orderTotal.toLocaleString('en-PH', {minimumFractionDigits: 2})}! Join me?`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vinyard Burger Bar',
          text: text,
          url: 'https://vinyardburger.com'
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (e) {
        // Cancelled
      }
    } else {
      // Copy to clipboard fallback
      navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-[#F4A261] hover:text-[#E76F51] font-medium transition-colors"
    >
      {shared ? (
        <><Check size={14} /> Copied!</>
      ) : (
        <><Share2 size={14} /> Share Order</>
      )}
    </button>
  );
};

export default ShareMyBurger;