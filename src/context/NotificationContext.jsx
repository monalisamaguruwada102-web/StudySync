import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/ui/Toast';
import NotificationDialog from '../components/ui/NotificationDialog';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = useCallback((notification) => {
        setNotifications(prev => [{ ...notification, id: Date.now(), read: false, timestamp: new Date() }, ...prev]);
        setUnreadCount(prev => prev + 1);
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        // Auto-add to history for important events
        if (type !== 'info') {
            addNotification({ title: type.charAt(0).toUpperCase() + type.slice(1), message, type });
        }
        return id;
    }, [addNotification]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const confirm = useCallback(({ title, message, type = 'warning', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) => {
        return new Promise((resolve) => {
            setDialog({
                title,
                message,
                type,
                confirmLabel,
                cancelLabel,
                onConfirm: () => {
                    setDialog(null);
                    if (onConfirm) onConfirm();
                    resolve(true);
                },
                onCancel: () => {
                    setDialog(null);
                    if (onCancel) onCancel();
                    resolve(false);
                }
            });
        });
    }, []);

    const prompt = useCallback(({ title, message, placeholder, confirmLabel = 'Submit', cancelLabel = 'Cancel' }) => {
        return new Promise((resolve) => {
            setDialog({
                title,
                message,
                type: 'info',
                isPrompt: true,
                placeholder,
                confirmLabel,
                cancelLabel,
                onConfirm: (value) => {
                    setDialog(null);
                    resolve(value);
                },
                onCancel: () => {
                    setDialog(null);
                    resolve(null);
                }
            });
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, confirm, prompt, notifications, unreadCount, markAllAsRead, addNotification }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Dialog Container */}
            <AnimatePresence>
                {dialog && (
                    <NotificationDialog
                        {...dialog}
                        onClose={() => setDialog(null)}
                    />
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
