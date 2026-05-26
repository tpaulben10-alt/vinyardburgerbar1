// Notification Service for Order Updates
import { fetchWithAuth } from './api';

// Free sound effect URLs (using reliable CDN sources)
const SOUND_URLS = {
  orderPlaced: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
  orderUpdated: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3',
  alert: 'https://assets.mixkit.co/sfx/preview/mixkit-kitchen-clock-tick-1938.mp3',
  success: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'
};

class NotificationService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private permission: NotificationPermission = 'default';

  constructor() {
    this.init();
  }

  async init() {
    // Check notification permission
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    
    // Preload sounds
    this.preloadSounds();
  }

  private preloadSounds() {
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.sounds.set(key, audio);
    });
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    // Update user preference in backend
    try {
      await fetchWithAuth('/features/notifications/preference', {
        method: 'PUT',
        body: JSON.stringify({ enabled: permission === 'granted' })
      });
    } catch (error) {
      console.error('Error updating notification preference:', error);
    }
    
    return permission === 'granted';
  }

  // Play sound effect
  playSound(type: keyof typeof SOUND_URLS = 'orderUpdated') {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => console.log('Audio play failed:', err));
    }
  }

  // Show browser notification
  showNotification(title: string, options: NotificationOptions = {}) {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/images/logo.jpg',
      badge: '/images/logo.jpg',
      tag: 'vinyard-order',
      requireInteraction: false,
      ...options
    };

    const notification = new Notification(title, defaultOptions);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }

  // Order status change notification
  notifyOrderStatus(orderId: number, status: string, orderItems: string[]) {
    const statusMessages: Record<string, { title: string; body: string; sound: keyof typeof SOUND_URLS }> = {
      confirmed: {
        title: 'Order Confirmed! ✅',
        body: `Your order #${orderId} has been confirmed and is being prepared.`,
        sound: 'success'
      },
      preparing: {
        title: 'Now Cooking! 👨‍🍳',
        body: `Our chefs are preparing your ${orderItems.join(', ')}.`,
        sound: 'orderUpdated'
      },
      ready: {
        title: 'Order Ready! 🔔',
        body: 'Your food is ready for pickup/delivery!',
        sound: 'alert'
      },
      out_for_delivery: {
        title: 'Out for Delivery! 🛵',
        body: `Your ${orderItems.join(', ')} is on the way!`,
        sound: 'orderUpdated'
      },
      delivered: {
        title: 'Order Delivered! 🎉',
        body: 'Enjoy your meal! Please rate your experience.',
        sound: 'success'
      }
    };

    const message = statusMessages[status];
    if (message) {
      this.playSound(message.sound);
      this.showNotification(message.title, {
        body: message.body,
        tag: `order-${orderId}`,
        data: { orderId, status }
      });
    }
  }

  // Check if notifications are enabled
  isEnabled(): boolean {
    return this.permission === 'granted';
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Hook for React components
export const useNotifications = () => {
  return {
    requestPermission: () => notificationService.requestPermission(),
    notify: (title: string, options?: NotificationOptions) => notificationService.showNotification(title, options),
    playSound: (type?: keyof typeof SOUND_URLS) => notificationService.playSound(type),
    notifyOrderStatus: (orderId: number, status: string, items: string[]) => 
      notificationService.notifyOrderStatus(orderId, status, items),
    isEnabled: notificationService.isEnabled(),
    permission: notificationService.getPermission()
  };
};
