import { supabase } from './supabase';
import { Lease } from '../types';

export const leaseService = {
    async fetchLeases(userId: string): Promise<Lease[]> {
        const { data, error } = await supabase
            .from('leases')
            .select('*')
            .or(`student_id.eq.${userId},owner_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToLease);
    },

    async createLease(leaseData: Partial<Lease>): Promise<Lease> {
        const dbData = {
            booking_id: leaseData.bookingId,
            student_id: leaseData.studentId,
            owner_id: leaseData.ownerId,
            house_rules: leaseData.houseRules,
            deposit_terms: leaseData.depositTerms,
            rent_schedule: leaseData.rentSchedule,
        };

        const { data, error } = await supabase
            .from('leases')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return this.mapToLease(data);
    },

    async updateLeaseStatus(leaseId: string, status: Lease['status'], pdfUrl?: string): Promise<void> {
        const updateData: any = { status };
        if (status === 'signed') {
            updateData.signed_at = new Date().toISOString();
        }
        if (pdfUrl) {
            updateData.pdf_url = pdfUrl;
        }

        const { error } = await supabase
            .from('leases')
            .update(updateData)
            .eq('id', leaseId);

        if (error) throw error;
    },

    mapToLease(lease: any): Lease {
        return {
            id: lease.id,
            bookingId: lease.booking_id,
            studentId: lease.student_id,
            ownerId: lease.owner_id,
            houseRules: lease.house_rules,
            depositTerms: lease.deposit_terms,
            rentSchedule: lease.rent_schedule,
            status: lease.status,
            pdfUrl: lease.pdf_url,
            signedAt: lease.signed_at,
            createdAt: lease.created_at,
        };
    }
};
