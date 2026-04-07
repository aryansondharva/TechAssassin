/**
 * useOptimisticUpdates - React hook for managing optimistic updates in UI
 * 
 * Provides:
 * - Error notification handling
 * - Pending update indicators
 * - Toast/alert integration
 * 
 * Requirements: 7.3, 7.5
 */

import { useEffect, useState, useCallback } from 'react';
import { 
  getOptimisticUpdateManager, 
  type ErrorNotification,
  type PendingUpdate 
} from '../services/optimistic-update-manager';

export interface UseOptimisticUpdatesOptions {
  onError?: (error: ErrorNotification) => void;
  autoShowToast?: boolean;
}

export interface UseOptimisticUpdatesReturn {
  errors: ErrorNotification[];
  pendingUpdates: PendingUpdate[];
  dismissError: (errorId: string) => void;
  clearErrors: () => void;
  isPending: (id: string) => boolean;
  hasPendingUpdates: boolean;
}

/**
 * Hook for managing optimistic updates in React components
 */
export function useOptimisticUpdates(
  options: UseOptimisticUpdatesOptions = {}
): UseOptimisticUpdatesReturn {
  const { onError, autoShowToast = true } = options;
  const manager = getOptimisticUpdateManager();

  const [errors, setErrors] = useState<ErrorNotification[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);

  // Subscribe to error notifications
  useEffect(() => {
    const subscription = manager.onError((error) => {
      setErrors(prev => [error, ...prev]);

      // Call custom error handler
      if (onError) {
        onError(error);
      }

      // Auto-show toast if enabled
      if (autoShowToast && typeof window !== 'undefined') {
        showErrorToast(error);
      }
    });

    // Initial load of error history
    setErrors(manager.getErrorHistory().filter(e => !e.dismissed));

    return () => {
      subscription.unsubscribe();
    };
  }, [onError, autoShowToast]);

  // Poll for pending updates (could be optimized with event emitter)
  useEffect(() => {
    const updatePendingUpdates = () => {
      setPendingUpdates(manager.getPendingUpdates());
    };

    updatePendingUpdates();
    const interval = setInterval(updatePendingUpdates, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const dismissError = useCallback((errorId: string) => {
    manager.dismissError(errorId);
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const clearErrors = useCallback(() => {
    manager.clearErrorHistory();
    setErrors([]);
  }, []);

  const isPending = useCallback((id: string) => {
    return manager.isPending(id);
  }, []);

  const hasPendingUpdates = pendingUpdates.length > 0;

  return {
    errors,
    pendingUpdates,
    dismissError,
    clearErrors,
    isPending,
    hasPendingUpdates,
  };
}

/**
 * Show error toast notification
 * This is a simple implementation - can be replaced with your toast library
 */
function showErrorToast(error: ErrorNotification): void {
  const manager = getOptimisticUpdateManager();
  const message = manager.getUserFriendlyMessage(error.error);

  // Simple browser alert as fallback
  // In production, replace with your toast library (e.g., react-hot-toast, sonner)
  if (typeof window !== 'undefined') {
    console.error('Optimistic update failed:', message);
    
    // You can integrate with a toast library here:
    // toast.error(message, { id: error.id });
  }
}

/**
 * Hook for tracking pending state of a specific update
 */
export function useIsPending(id: string): boolean {
  const manager = getOptimisticUpdateManager();
  const [isPending, setIsPending] = useState(manager.isPending(id));

  useEffect(() => {
    const checkPending = () => {
      setIsPending(manager.isPending(id));
    };

    checkPending();
    const interval = setInterval(checkPending, 200);

    return () => {
      clearInterval(interval);
    };
  }, [id]);

  return isPending;
}
