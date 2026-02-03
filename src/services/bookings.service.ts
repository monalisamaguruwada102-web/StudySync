import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import { Booking } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './sync.service';

const STORAGE_KEY = '@bookings_data';

// Performance Optimization: Intelligent Caching
interface CacheEntry {
    data: Booking[];
    timestamp: number;
    userId: string;
    role: 'student' | 'owner';
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const bookingsCache = new Map<string, CacheEntry>();

// Pagination defaults
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Mapping Helpers
const mapToBooking = (dbBooking: any): Booking => {
    // Return a safe object even if input is malformed or null
    const safeData = dbBooking || {};

    // Safe status mapping to prevent UI crashes
    const validStatuses: Booking['status'][] = ['pending', 'approved', 'rejected', 'paid', 'cancelled'];
    let status = safeData.status || 'pending';
    if (!validStatuses.includes(status as any)) {
        status = 'pending';
    }

    return {
        id: safeData.id || `local_${Math.random().toString(36).substr(2, 9)}`,
        listingId: safeData.listing_id || '',
        studentId: safeData.student_id || '',
        ownerId: safeData.owner_id || '',
        status: status as Booking['status'],
        totalPrice: Number(safeData.total_price) || 0,
        paymentReference: safeData.payment_reference || '',
        createdAt: safeData.created_at || new Date().toISOString(),
        listingTitle: safeData.listing_title || 'Property',
        studentName: safeData.student_name || 'User',
        studentPhone: safeData.student_phone || '',
        ownerPhone: safeData.owner_phone || '',
    };
};

const mapToDb = (booking: Partial<Booking>) => ({
    listing_id: booking.listingId,
    student_id: booking.studentId,
    owner_id: booking.ownerId,
    status: booking.status,
    total_price: booking.totalPrice,
    payment_reference: booking.paymentReference,
    listing_title: booking.listingTitle,
    student_name: booking.studentName,
    student_phone: booking.studentPhone,
    owner_phone: booking.ownerPhone,
});

export const bookingsService = {
    getBookingsForStudent: async (studentId: string, page: number = 0, pageSize: number = DEFAULT_PAGE_SIZE): Promise<Booking[]> => {
        // Cache Check (only for first page)
        if (page === 0) {
            const cached = bookingsCache.get(`${studentId}:student`);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                console.log('[BookingsService] Returning cached bookings for student');
                return cached.data;
            }
        }

        if (IS_SUPABASE_CONFIGURED) {
            try {
                console.log('[BookingsService] Fetching bookings for student:', studentId, 'Page:', page);

                const { data, error } = await supabase
                    .from('bookings')
                    .select('id, listing_id, student_id, owner_id, status, total_price, payment_reference, created_at, listing_title, student_name, student_phone, owner_phone')
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) {
                    console.error('[BookingsService] Supabase Error:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    throw error;
                }

                const mappedData = (data || []).map(mapToBooking);

                // Update Cache (only for first page)
                if (page === 0) {
                    bookingsCache.set(`${studentId}:student`, {
                        data: mappedData,
                        timestamp: Date.now(),
                        userId: studentId,
                        role: 'student'
                    });
                }

                console.log('[BookingsService] Fetched bookings count:', mappedData.length);
                return mappedData;
            } catch (err: any) {
                console.error('[BookingsService] Unexpected error:', err);
                throw err;
            }
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const all: Booking[] = stored ? JSON.parse(stored) : [];
        const filtered = all.filter(b => b.studentId === studentId);
        return filtered.slice(page * pageSize, (page + 1) * pageSize);
    },

    getBookingsForOwner: async (ownerId: string, page: number = 0, pageSize: number = DEFAULT_PAGE_SIZE): Promise<Booking[]> => {
        // Cache Check (only for first page)
        if (page === 0) {
            const cached = bookingsCache.get(`${ownerId}:owner`);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                console.log('[BookingsService] Returning cached bookings for owner');
                return cached.data;
            }
        }

        if (IS_SUPABASE_CONFIGURED) {
            try {
                console.log('[BookingsService] Fetching bookings for owner:', ownerId, 'Page:', page);

                const { data, error } = await supabase
                    .from('bookings')
                    .select('id, listing_id, student_id, owner_id, status, total_price, payment_reference, created_at, listing_title, student_name, student_phone, owner_phone')
                    .eq('owner_id', ownerId)
                    .order('created_at', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) {
                    console.error('[BookingsService] Supabase Error (Owner):', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    throw error;
                }

                const mappedData = (data || []).map(mapToBooking);

                // Update Cache (only for first page)
                if (page === 0) {
                    bookingsCache.set(`${ownerId}:owner`, {
                        data: mappedData,
                        timestamp: Date.now(),
                        userId: ownerId,
                        role: 'owner'
                    });
                }

                console.log('[BookingsService] Fetched owner bookings count:', mappedData.length);
                return mappedData;
            } catch (err: any) {
                console.error('[BookingsService] Unexpected error (Owner):', err);
                throw err;
            }
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const all: Booking[] = stored ? JSON.parse(stored) : [];
        const filtered = all.filter(b => b.ownerId === ownerId);
        return filtered.slice(page * pageSize, (page + 1) * pageSize);
    },

    invalidateCache: (userId: string, role: 'student' | 'owner') => {
        bookingsCache.delete(`${userId}:${role}`);
        console.log(`[BookingsService] Cache invalidated for ${role}: ${userId}`);
    },

    createBooking: async (bookingData: Partial<Booking>): Promise<Booking> => {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            console.log('[BookingsService] Offline: Enqueueing booking request');
            const action = await syncService.enqueue('CREATE_BOOKING', bookingData);

            // Return a temporary booking object
            return {
                ...bookingData,
                id: `queued_${action.id}`,
                status: 'pending',
                createdAt: new Date().toISOString(),
            } as Booking;
        }

        if (IS_SUPABASE_CONFIGURED) {
            console.log('[BookingsService] Creating booking:', bookingData);
            const { data, error } = await supabase
                .from('bookings')
                .insert([mapToDb(bookingData)])
                .select('id, listing_id, student_id, owner_id, status, total_price, payment_reference, created_at, listing_title, student_name, student_phone, owner_phone')
                .single();

            if (error) {
                console.error('[BookingsService] Create failed:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    payload: mapToDb(bookingData)
                });
                throw error;
            }
            console.log('[BookingsService] Booking created successfully:', data.id);
            return mapToBooking(data);
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const all: Booking[] = stored ? JSON.parse(stored) : [];

        const newBooking: Booking = {
            ...bookingData,
            id: 'b_' + Math.random().toString(36).substr(2, 9),
            status: 'pending',
            createdAt: new Date().toISOString(),
        } as Booking;

        all.push(newBooking);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return newBooking;
    },

    updateBookingStatus: async (bookingId: string, status: Booking['status'], reference?: string): Promise<void> => {
        if (IS_SUPABASE_CONFIGURED) {
            const updates: any = { status };
            if (reference) updates.payment_reference = reference;

            // Get ownerId to invalidate cache
            const { data: booking } = await supabase
                .from('bookings')
                .select('owner_id, student_id')
                .eq('id', bookingId)
                .single();

            try {
                const { error } = await supabase
                    .from('bookings')
                    .update(updates)
                    .eq('id', bookingId);

                if (error) {
                    throw new Error(`[Database Error] ${error.message}`);
                }

                // Invalidate caches
                if (booking) {
                    bookingsService.invalidateCache(booking.owner_id, 'owner');
                    bookingsService.invalidateCache(booking.student_id, 'student');
                }
            } catch (err: any) {
                console.error('[BookingsService] Update error:', err);
                throw new Error(err.message || 'The update failed. Please check your connection.');
            }
            return;
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const all: Booking[] = stored ? JSON.parse(stored) : [];
        const index = all.findIndex(b => b.id === bookingId);

        if (index !== -1) {
            all[index].status = status;
            if (reference) all[index].paymentReference = reference;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));

            // Invalidate local caches if any
            bookingsService.invalidateCache(all[index].ownerId, 'owner');
            bookingsService.invalidateCache(all[index].studentId, 'student');
        }
    },

    subscribeToBookings: (userId: string, role: 'student' | 'owner', callback: (booking: Booking) => void) => {
        if (IS_SUPABASE_CONFIGURED) {
            const filterField = role === 'student' ? 'student_id' : 'owner_id';

            const channel = supabase
                .channel(`bookings:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to any change (INSERT, UPDATE)
                        schema: 'public',
                        table: 'bookings',
                        filter: `${filterField}=eq.${userId}`,
                    },
                    (payload) => {
                        try {
                            console.log('[BookingsService] Subscription payload received:', payload);

                            // Check if payload.new exists
                            if (!payload.new) {
                                console.warn('[BookingsService] Received null payload.new, skipping');
                                return;
                            }

                            // Map and call the callback
                            const updatedBooking = mapToBooking(payload.new);

                            // Basic validation before callback
                            if (!updatedBooking.id || (!updatedBooking.studentId && !updatedBooking.ownerId)) {
                                console.warn('[BookingsService] Invalid booking data in subscription, skipping');
                                return;
                            }

                            console.log('[BookingsService] Mapped booking:', updatedBooking.id);
                            callback(updatedBooking);
                        } catch (error) {
                            console.error('[BookingsService] Error in subscription callback:', error);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('[BookingsService] Subscription status:', status);
                });

            return channel;
        }

        return {
            unsubscribe: () => { }
        };
    }
};
