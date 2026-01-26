import { supabase } from './supabase';
import { UtilityBill } from '../types';

export const utilityService = {
    async fetchBills(listingId: string): Promise<UtilityBill[]> {
        const { data, error } = await supabase
            .from('utility_bills')
            .select('*')
            .eq('listing_id', listingId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToBill);
    },

    async createBill(billData: Partial<UtilityBill>): Promise<UtilityBill> {
        const dbData = {
            listing_id: billData.listingId,
            owner_id: billData.ownerId,
            month_year: billData.monthYear,
            bill_type: billData.billType,
            total_amount: billData.totalAmount,
            split_amount: billData.splitAmount,
            due_date: billData.dueDate,
            image_url: billData.imageUrl,
        };

        const { data, error } = await supabase
            .from('utility_bills')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return this.mapToBill(data);
    },

    mapToBill(bill: any): UtilityBill {
        return {
            id: bill.id,
            listingId: bill.listing_id,
            ownerId: bill.owner_id,
            monthYear: bill.month_year,
            billType: bill.bill_type,
            totalAmount: bill.total_amount,
            splitAmount: bill.split_amount,
            dueDate: bill.due_date,
            status: bill.status,
            imageUrl: bill.image_url,
            createdAt: bill.created_at,
        };
    }
};
