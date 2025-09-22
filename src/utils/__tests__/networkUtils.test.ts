import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkMonitor, networkMonitor } from '../networkUtils';

// Mock global navigator and window
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock global fetch
const mockFetch = vi.fn();

// Setup global mocks
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true,
});

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigator.onLine = true;
    monitor = new NetworkMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with current online status', () => {
      const status = monitor.getStatus();
      expect(status.isOnline).toBe(true);
      expect(status.lastOnlineTime).toBeInstanceOf(Date);
    });

    it('should set up event listeners', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockNavigator.connection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should initialize with offline status when navigator is offline', () => {
      mockNavigator.onLine = false;
      const offlineMonitor = new NetworkMonitor();
      
      const status = offlineMonitor.getStatus();
      expect(status.isOnline).toBe(false);
      expect(status.lastOnlineTime).toBe(null);
      
      offlineMonitor.destroy();
    });
  });

  describe('Event Handling', () => {
    it('should handle online events', () => {
      const listener = vi.fn();
      monitor.subscribe(listener);

      // Simulate online event
      const onlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      
      expect(onlineHandler).toBeDefined();
      onlineHandler?.();

      expect(listener).toHaveBeenCalledWith({
        isOnline: true,
        lastOnlineTime: expect.any(Date),
        connectionType: undefined,
      });
    });

    it('should handle offline events', () => {
      const listener = vi.fn();
      monitor.subscribe(listener);

      // Simulate offline event
      const offlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      
      expect(offlineHandler).toBeDefined();
      offlineHandler?.();

      expect(listener).toHaveBeenCalledWith({
        isOnline: false,
        lastOnlineTime: expect.any(Date), // Should keep the last online time
        connectionType: undefined,
      });
    });

    it('should handle connection change events', () => {
      const listener = vi.fn();
      monitor.subscribe(listener);

      // Simulate connection change event
      const connectionHandler = mockNavigator.connection.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      expect(connectionHandler).toBeDefined();
      connectionHandler?.();

      expect(listener).toHaveBeenCalledWith({
        isOnline: true,
        lastOnlineTime: expect.any(Date),
        connectionType: '4g',
      });
    });
  });

  describe('Subscription Management', () => {
    it('should allow subscribing to status changes', () => {
      const listener = vi.fn();
      const unsubscribe = monitor.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow unsubscribing from status changes', () => {
      const listener = vi.fn();
      const unsubscribe = monitor.subscribe(listener);

      unsubscribe();

      // Trigger an event
      const onlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();

      // Listener should not be called after unsubscribing
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      monitor.subscribe(listener1);
      monitor.subscribe(listener2);

      // Trigger an event
      const onlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Connectivity Testing', () => {
    it('should test connectivity with health endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await monitor.testConnectivity();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: expect.any(AbortSignal),
      });
    });

    it('should fallback to root endpoint if health endpoint fails', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Health endpoint not found'))
        .mockResolvedValueOnce({ ok: true });

      const result = await monitor.testConnectivity();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: expect.any(AbortSignal),
      });
    });

    it('should return false when both endpoints fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Health endpoint failed'))
        .mockRejectedValueOnce(new Error('Root endpoint failed'));

      const result = await monitor.testConnectivity();

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return false when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await monitor.testConnectivity();

      expect(result).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      monitor.destroy();

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockNavigator.connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should clear all listeners on destroy', () => {
      const listener = vi.fn();
      monitor.subscribe(listener);
      
      monitor.destroy();

      // Manually trigger the online handler to test if listeners are cleared
      const status = monitor.getStatus();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should return current online status', () => {
      expect(monitor.isOnline()).toBe(true);
      
      // Simulate going offline
      const offlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      offlineHandler?.();
      
      expect(monitor.isOnline()).toBe(false);
    });
  });
});

describe('Singleton NetworkMonitor', () => {
  it('should export a singleton instance', () => {
    expect(networkMonitor).toBeInstanceOf(NetworkMonitor);
  });

  it('should be the same instance across imports', async () => {
    const module = await import('../networkUtils');
    expect(module.networkMonitor).toBe(networkMonitor);
  });
});

describe('Environment without connection API', () => {
  it('should work without navigator.connection', () => {
    const originalConnection = mockNavigator.connection;
    delete (mockNavigator as any).connection;

    const monitor = new NetworkMonitor();
    const status = monitor.getStatus();

    expect(status.isOnline).toBe(true);
    expect(status.connectionType).toBeUndefined();

    monitor.destroy();
    
    // Restore connection for other tests
    mockNavigator.connection = originalConnection;
  });
});