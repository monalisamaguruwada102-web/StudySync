import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, authorized, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: window.location.pathname + window.location.search }} replace />;
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h1>
                <p className="text-slate-500 max-w-md">
                    This system is restricted to a single user. You are not authorized to access this dashboard.
                </p>
                <button
                    onClick={() => window.location.href = '/login'}
                    className="mt-6 text-primary-600 font-semibold hover:underline"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
