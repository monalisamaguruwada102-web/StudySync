import { supabase } from './supabase';
import { MaintenanceRequest } from '../types';

export const maintenanceService = {
    async fetchRequests(userId: string): Promise<MaintenanceRequest[]> {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .select('*')
            .or(`student_id.eq.${userId},owner_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToRequest);
    },

    async createRequest(requestData: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
        const dbData = {
            listing_id: requestData.listingId,
            student_id: requestData.studentId,
            owner_id: requestData.ownerId,
            title: requestData.title,
            description: requestData.description,
            priority: requestData.priority || 'medium',
            image_url: requestData.imageUrl,
        };

        const { data, error } = await supabase
            .from('maintenance_requests')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return this.mapToRequest(data);
    },

    async updateStatus(requestId: string, status: MaintenanceRequest['status']): Promise<void> {
        const { error } = await supabase
            .from('maintenance_requests')
            .update({ status })
            .eq('id', requestId);

        if (error) throw error;
    },

    mapToRequest(req: any): MaintenanceRequest {
        return {
            id: req.id,
            listingId: req.listing_id,
            studentId: req.student_id,
            ownerId: req.owner_id,
            title: req.title,
            description: req.description,
            status: req.status,
            priority: req.priority,
            imageUrl: req.image_url,
            createdAt: req.created_at,
        };
    }
};
