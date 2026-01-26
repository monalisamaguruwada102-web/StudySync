import { supabase } from './supabase';
import { VisitorPass } from '../types';

export const visitorService = {
    async fetchPasses(userId: string): Promise<VisitorPass[]> {
        const { data, error } = await supabase
            .from('visitor_passes')
            .select('*')
            .or(`student_id.eq.${userId}`)
            .order('visit_date', { ascending: false });

        if (error) throw error;
        return data.map(this.mapToPass);
    },

    async createPass(passData: Partial<VisitorPass>): Promise<VisitorPass> {
        // Logic for qr_code_content generation would go here or be passed from UI
        const dbData = {
            student_id: passData.studentId,
            listing_id: passData.listingId,
            visitor_name: passData.visitorName,
            visitor_phone: passData.visitorPhone,
            visit_date: passData.visitDate,
            qr_code_content: passData.qrCodeContent || `PASS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        const { data, error } = await supabase
            .from('visitor_passes')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return this.mapToPass(data);
    },

    async markAsScanned(passId: string): Promise<void> {
        const { error } = await supabase
            .from('visitor_passes')
            .update({ status: 'scanned', scanned_at: new Date().toISOString() })
            .eq('id', passId);

        if (error) throw error;
    },

    mapToPass(pass: any): VisitorPass {
        return {
            id: pass.id,
            studentId: pass.student_id,
            listingId: pass.listing_id,
            visitorName: pass.visitor_name,
            visitorPhone: pass.visitor_phone,
            visitDate: pass.visit_date,
            qrCodeContent: pass.qr_code_content,
            status: pass.status,
            scannedAt: pass.scanned_at,
            createdAt: pass.created_at,
        };
    }
};
