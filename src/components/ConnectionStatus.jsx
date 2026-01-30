import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isRetrying, setIsRetrying] = useState(false);

    const checkConnection = async () => {
        try {
            setIsRetrying(true);
            await api.get('/health');
            setIsOnline(true);
        } catch (error) {
            setIsOnline(false);
        } finally {
            setIsRetrying(false);
        }
    };

    useEffect(() => {
        // Initial check
        checkConnection();

        // Check every 30 seconds
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-red-900/90 text-white rounded-lg shadow-lg border border-red-700 p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-semibold text-red-200">Backend Disconnected</h3>
                    <p className="text-sm text-red-100/80 mt-1">
                        Server is offline. Showing cached data - changes will sync when connection is restored.
                    </p>
                    <button
                        onClick={checkConnection}
                        disabled={isRetrying}
                        className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-950/50 hover:bg-red-950 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Retrying...' : 'Retry Connection'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionStatus;
