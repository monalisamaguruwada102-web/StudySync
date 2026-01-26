import React, { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
            gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache
            retry: 2,
            refetchOnWindowFocus: false, // Don't refetch when app regains focus
            refetchOnMount: false, // Use cached data on mount if available
            refetchOnReconnect: true, // Do refetch when internet reconnects
        },
    },
});

const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'OFFLINE_CACHE',
});

export const QueryProvider = ({ children }: { children: ReactNode }) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
};
