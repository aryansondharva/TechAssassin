import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { getRealtimeManager } from '@/lib/services/realtime-manager';
import type { ConnectionState } from '@/lib/services/realtime-manager';

interface ConnectionStatusIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

const stateConfig = {
  connected: {
    icon: Wifi,
    label: 'Connected',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    show: false, // Don't show when connected
  },
  disconnected: {
    icon: WifiOff,
    label: 'Disconnected',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    show: true,
  },
  reconnecting: {
    icon: RefreshCw,
    label: 'Reconnecting',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    show: true,
  },
};

export const ConnectionStatusIndicator = ({
  position = 'top-right',
  className = '',
}: ConnectionStatusIndicatorProps) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isManualReconnecting, setIsManualReconnecting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const realtimeManager = getRealtimeManager();

  useEffect(() => {
    // Get initial state
    const initialState = realtimeManager.getConnectionState();
    setConnectionState(initialState);

    // Subscribe to state changes
    const subscription = realtimeManager.onConnectionStateChange((state) => {
      setConnectionState(state);
      setIsDismissed(false); // Show indicator again on state change
      
      if (state === 'reconnecting') {
        setReconnectAttempts((prev) => prev + 1);
      } else if (state === 'connected') {
        setReconnectAttempts(0);
        setIsManualReconnecting(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [realtimeManager]);

  const handleManualReconnect = async () => {
    setIsManualReconnecting(true);
    try {
      await realtimeManager.manualReconnect();
    } catch (error) {
      console.error('Manual reconnect failed:', error);
    } finally {
      setIsManualReconnecting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const config = stateConfig[connectionState];
  const Icon = config.icon;
  const shouldShow = config.show && !isDismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed ${positionClasses[position]} z-50 ${className}`}
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${config.bgColor} border ${config.borderColor} backdrop-blur-md shadow-2xl`}>
            {/* Icon */}
            <div className="relative">
              <motion.div
                animate={
                  connectionState === 'reconnecting'
                    ? { rotate: 360 }
                    : {}
                }
                transition={
                  connectionState === 'reconnecting'
                    ? { duration: 2, repeat: Infinity, ease: 'linear' }
                    : {}
                }
              >
                <Icon className={`w-5 h-5 ${config.color}`} />
              </motion.div>
              
              {connectionState === 'reconnecting' && (
                <motion.div
                  className={`absolute inset-0 rounded-full ${config.color} opacity-50`}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Status Text */}
            <div className="flex flex-col">
              <span className={`text-sm font-bold ${config.color}`}>
                {config.label}
              </span>
              {connectionState === 'reconnecting' && reconnectAttempts > 0 && (
                <span className="text-xs text-white/40 font-mono">
                  Attempt {reconnectAttempts}
                </span>
              )}
              {connectionState === 'disconnected' && (
                <span className="text-xs text-white/40">
                  Connection lost
                </span>
              )}
            </div>

            {/* Manual Reconnect Button */}
            {connectionState === 'disconnected' && (
              <button
                onClick={handleManualReconnect}
                disabled={isManualReconnecting}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isManualReconnecting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                ) : (
                  'Reconnect'
                )}
              </button>
            )}

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4 text-white/40 hover:text-white" />
            </button>
          </div>

          {/* Progress Bar for Reconnecting */}
          {connectionState === 'reconnecting' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden"
            >
              <motion.div
                className={`h-full ${config.bgColor.replace('/10', '/50')}`}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
