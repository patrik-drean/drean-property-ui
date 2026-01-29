import { renderHook } from '@testing-library/react';
import { useLeadEvents } from '../useLeadEvents';

// Mock the WebSocketContext
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: () => ({
    connectionStatus: 'connected',
    subscribe: mockSubscribe.mockReturnValue(mockUnsubscribe),
  }),
}));

describe('useLeadEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
  });

  describe('initialization', () => {
    it('should return connection status', () => {
      const { result } = renderHook(() => useLeadEvents({}));

      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should not subscribe when no handlers provided', () => {
      renderHook(() => useLeadEvents({}));

      expect(mockSubscribe).not.toHaveBeenCalled();
    });
  });

  describe('onLeadCreated subscription', () => {
    it('should subscribe to lead:created event when handler provided', () => {
      const onLeadCreated = jest.fn();

      renderHook(() => useLeadEvents({ onLeadCreated }));

      expect(mockSubscribe).toHaveBeenCalledWith('lead:created', onLeadCreated);
    });

    it('should unsubscribe on unmount', () => {
      const onLeadCreated = jest.fn();

      const { unmount } = renderHook(() => useLeadEvents({ onLeadCreated }));

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('onLeadUpdated subscription', () => {
    it('should subscribe to lead:updated event when handler provided', () => {
      const onLeadUpdated = jest.fn();

      renderHook(() => useLeadEvents({ onLeadUpdated }));

      expect(mockSubscribe).toHaveBeenCalledWith('lead:updated', onLeadUpdated);
    });
  });

  describe('onLeadConsolidated subscription', () => {
    it('should subscribe to lead:consolidated event when handler provided', () => {
      const onLeadConsolidated = jest.fn();

      renderHook(() => useLeadEvents({ onLeadConsolidated }));

      expect(mockSubscribe).toHaveBeenCalledWith('lead:consolidated', onLeadConsolidated);
    });
  });

  describe('onLeadDeleted subscription', () => {
    it('should subscribe to lead:deleted event when handler provided', () => {
      const onLeadDeleted = jest.fn();

      renderHook(() => useLeadEvents({ onLeadDeleted }));

      // The hook wraps the handler to extract leadId
      expect(mockSubscribe).toHaveBeenCalledWith('lead:deleted', expect.any(Function));
    });

    it('should wrap handler to extract leadId from payload', () => {
      const onLeadDeleted = jest.fn();

      renderHook(() => useLeadEvents({ onLeadDeleted }));

      // Verify subscribe was called with a wrapper function
      const deleteCall = mockSubscribe.mock.calls.find(
        (call) => call[0] === 'lead:deleted'
      );
      expect(deleteCall).toBeDefined();

      // The wrapper function should extract leadId and call the original handler
      const wrapperHandler = deleteCall![1];
      wrapperHandler({ leadId: 'lead-to-delete-123' });

      expect(onLeadDeleted).toHaveBeenCalledWith('lead-to-delete-123');
    });
  });

  describe('multiple subscriptions', () => {
    it('should subscribe to all provided handlers', () => {
      const onLeadCreated = jest.fn();
      const onLeadUpdated = jest.fn();
      const onLeadConsolidated = jest.fn();
      const onLeadDeleted = jest.fn();

      renderHook(() => useLeadEvents({
        onLeadCreated,
        onLeadUpdated,
        onLeadConsolidated,
        onLeadDeleted,
      }));

      expect(mockSubscribe).toHaveBeenCalledTimes(4);
      expect(mockSubscribe).toHaveBeenCalledWith('lead:created', onLeadCreated);
      expect(mockSubscribe).toHaveBeenCalledWith('lead:updated', onLeadUpdated);
      expect(mockSubscribe).toHaveBeenCalledWith('lead:consolidated', onLeadConsolidated);
      expect(mockSubscribe).toHaveBeenCalledWith('lead:deleted', expect.any(Function));
    });

    it('should unsubscribe all on unmount', () => {
      const onLeadCreated = jest.fn();
      const onLeadUpdated = jest.fn();

      const { unmount } = renderHook(() => useLeadEvents({
        onLeadCreated,
        onLeadUpdated,
      }));

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('handler changes', () => {
    it('should resubscribe when handlers change', () => {
      const onLeadCreated1 = jest.fn();
      const onLeadCreated2 = jest.fn();

      const { rerender } = renderHook(
        ({ onLeadCreated }) => useLeadEvents({ onLeadCreated }),
        { initialProps: { onLeadCreated: onLeadCreated1 } }
      );

      expect(mockSubscribe).toHaveBeenLastCalledWith('lead:created', onLeadCreated1);

      rerender({ onLeadCreated: onLeadCreated2 });

      // Should unsubscribe from old and subscribe to new
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenLastCalledWith('lead:created', onLeadCreated2);
    });
  });
});
