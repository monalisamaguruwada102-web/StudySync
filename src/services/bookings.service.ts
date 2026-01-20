import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import { Booking } from '../types';

const STORAGE_KEY = '@bookings_data';

// Mapping Helpers
const mapToBooking = (dbBooking: any): Booking => ({
    id: dbBooking.id,
    listingId: dbBooking.listing_id,
    studentId: dbBooking.student_id,
    ownerId: dbBooking.owner_id,
    status: dbBooking.status,
    totalPrice: dbBooking.total_price,
    paymentReference: dbBooking.payment_reference,
    createdAt: dbBooking.created_at,
    // Note: In a real app, you'd probably join with listings/profiles to get names/titles
    listingTitle: dbBooking.listing_title,
    studentName: dbBooking.student_name,
    studentPhone: dbBooking.student_phone,
    ownerPhone: dbBooking.owner_phone,
});

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
    getBookingsForStudent: async (studentId: string): Promise<Booking[]> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapToBooking);
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const all: Booking[] = stored ? JSON.parse(stored) : [];
        return all.filter(b => b.studentId === studentId);
    },

    getBookingsForOwner: async (ownerId: string): Promise<Booking[]> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('owner_id', ownerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapToBooking);
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const all: Booking[] = stored ? JSON.parse(stored) : [];
        return all.filter(b => b.ownerId === ownerId);
    },

    createBooking: async (bookingData: Partial<Booking>): Promise<Booking> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('bookings')
                .insert([mapToDb(bookingData)])
                .select()
                .single();

            if (error) throw error;
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

            const { error } = await supabase
                .from('bookings')
                .update(updates)
                .eq('id', bookingId);

            if (error) throw error;
            return;
        }

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const all: Booking[] = stored ? JSON.parse(stored) : [];
        const index = all.findIndex(b => b.id === bookingId);

        if (index !== -1) {
            all[index].status = status;
            if (reference) all[index].paymentReference = reference;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        }
    },

    subscribeToBookings: (userId: string, role: 'student' | 'owner', callback: (booking: Booking) => void) => {
        if (IS_SUPABASE_CONFIGURED) {
            const filterField = role === 'student' ? 'student_id' : 'owner_id';

            return supabase
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
                        const updatedBooking = mapToBooking(payload.new);
                        callback(updatedBooking);
                    }
                )
                .subscribe();
        }

        return {
            unsubscribe: () => { }
        };
    }
};
