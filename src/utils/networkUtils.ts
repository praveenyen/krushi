/**
 * Network utility functions for detecting online/offline status
 * and managing automatic sync triggers
 */

export interface NetworkStatus {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
}

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

export class NetworkMonitor {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : null,
  };

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Also listen for network connection changes if available
    if ('connection' in navigator) {
      const nav = navigator as Navigator & { connection?: NetworkInformation };
      const connection = nav.connection;
      if (connection) {
        connection.addEventListener('change', this.handleConnectionChange);
      }
    }
  }

  private handleOnline = () => {
    this.currentStatus = {
      ...this.currentStatus,
      isOnline: true,
      lastOnlineTime: new Date(),
    };
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.currentStatus = {
      ...this.currentStatus,
      isOnline: false,
    };
    this.notifyListeners();
  };

  private handleConnectionChange = () => {
    const nav = navigator as Navigator & { connection?: NetworkInformation };
    const connection = nav.connection;
    if (connection) {
      this.currentStatus = {
        ...this.currentStatus,
        connectionType: connection.effectiveType,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
      };
      this.notifyListeners();
    }
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Check if we're currently online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Test actual connectivity by making a lightweight request
   */
  async testConnectivity(): Promise<boolean> {
    try {
      // Use a lightweight request to test actual connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      // If health endpoint doesn't exist, try a simple GET to root
      try {
        const response = await fetch('/', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if ('connection' in navigator) {
      const nav = navigator as Navigator & { connection?: NetworkInformation };
      const connection = nav.connection;
      if (connection) {
        connection.removeEventListener('change', this.handleConnectionChange);
      }
    }
    
    this.listeners.clear();
  }
}

// Export singleton instance
export const networkMonitor = new NetworkMonitor();

// For non-React usage, we need to import React conditionally
let React: typeof import('react') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  React = require('react');
} catch {
  // React not available, hook won't work but other functions will
}

/**
 * Hook for using network status in React components
 */
export function useNetworkStatus() {
  if (!React) {
    throw new Error('React is not available. Cannot use useNetworkStatus hook.');
  }
  
  const [status, setStatus] = React.useState<NetworkStatus>(networkMonitor.getStatus());

  React.useEffect(() => {
    const unsubscribe = networkMonitor.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
}