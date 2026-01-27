import { renderHook } from '@testing-library/react';
import { useMessageEvents } from '../useMessageEvents';

// Mock the WebSocketContext
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: () => ({
    connectionStatus: 'connected',
    subscribe: mockSubscribe.mockReturnValue(mockUnsubscribe),
  }),
}));

describe('useMessageEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
  });

  describe('initialization', () => {
    it('should return connection status', () => {
      const { result } = renderHook(() => useMessageEvents({}));

      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should not subscribe when no handlers provided', () => {
      renderHook(() => useMessageEvents({}));

      expect(mockSubscribe).not.toHaveBeenCalled();
    });
  });

  describe('onMessageReceived subscription', () => {
    it('should subscribe to message:received event when handler provided', () => {
      const onMessageReceived = jest.fn();

      renderHook(() => useMessageEvents({ onMessageReceived }));

      expect(mockSubscribe).toHaveBeenCalledWith('message:received', onMessageReceived);
    });

    it('should unsubscribe on unmount', () => {
      const onMessageReceived = jest.fn();

      const { unmount } = renderHook(() => useMessageEvents({ onMessageReceived }));

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('onMessageSent subscription', () => {
    it('should subscribe to message:sent event when handler provided', () => {
      const onMessageSent = jest.fn();

      renderHook(() => useMessageEvents({ onMessageSent }));

      expect(mockSubscribe).toHaveBeenCalledWith('message:sent', onMessageSent);
    });
  });

  describe('onMessageStatusChanged subscription', () => {
    it('should subscribe to message:status_changed event when handler provided', () => {
      const onMessageStatusChanged = jest.fn();

      renderHook(() => useMessageEvents({ onMessageStatusChanged }));

      expect(mockSubscribe).toHaveBeenCalledWith('message:status_changed', onMessageStatusChanged);
    });
  });

  describe('multiple subscriptions', () => {
    it('should subscribe to all provided handlers', () => {
      const onMessageReceived = jest.fn();
      const onMessageSent = jest.fn();
      const onMessageStatusChanged = jest.fn();

      renderHook(() => useMessageEvents({
        onMessageReceived,
        onMessageSent,
        onMessageStatusChanged,
      }));

      expect(mockSubscribe).toHaveBeenCalledTimes(3);
      expect(mockSubscribe).toHaveBeenCalledWith('message:received', onMessageReceived);
      expect(mockSubscribe).toHaveBeenCalledWith('message:sent', onMessageSent);
      expect(mockSubscribe).toHaveBeenCalledWith('message:status_changed', onMessageStatusChanged);
    });

    it('should unsubscribe all on unmount', () => {
      const onMessageReceived = jest.fn();
      const onMessageSent = jest.fn();
      const onMessageStatusChanged = jest.fn();

      const { unmount } = renderHook(() => useMessageEvents({
        onMessageReceived,
        onMessageSent,
        onMessageStatusChanged,
      }));

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    });
  });

  describe('handler changes', () => {
    it('should resubscribe when handlers change', () => {
      const onMessageReceived1 = jest.fn();
      const onMessageReceived2 = jest.fn();

      const { rerender } = renderHook(
        ({ onMessageReceived }) => useMessageEvents({ onMessageReceived }),
        { initialProps: { onMessageReceived: onMessageReceived1 } }
      );

      expect(mockSubscribe).toHaveBeenLastCalledWith('message:received', onMessageReceived1);

      rerender({ onMessageReceived: onMessageReceived2 });

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenLastCalledWith('message:received', onMessageReceived2);
    });
  });
});
