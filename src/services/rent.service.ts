import { supabase } from './supabase';
import { RentPayment } from '../types';

export const rentService = {
    async fetchPaymentHistory(userId: string): Promise<RentPayment[]> {
        const { data, error } = await supabase
            .from('rent_payments')
            .select('*')
            .or(`student_id.eq.${userId},owner_id.eq.${userId}`)
            .order('payment_date', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToRentPayment);
    },

    async recordPayment(paymentData: Partial<RentPayment>): Promise<RentPayment> {
        const dbData = {
            booking_id: paymentData.bookingId,
            student_id: paymentData.studentId,
            owner_id: paymentData.ownerId,
            amount: paymentData.amount,
            month_year: paymentData.monthYear,
            status: paymentData.status || 'paid',
            payment_date: paymentData.paymentDate || new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('rent_payments')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return this.mapToRentPayment(data);
    },

    mapToRentPayment(payment: any): RentPayment {
        return {
            id: payment.id,
            bookingId: payment.booking_id,
            studentId: payment.student_id,
            ownerId: payment.owner_id,
            amount: payment.amount,
            monthYear: payment.month_year,
            status: payment.status,
            paymentDate: payment.payment_date,
            createdAt: payment.created_at,
        };
    }
};
