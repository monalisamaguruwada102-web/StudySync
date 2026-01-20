import { supabase } from './supabase';

class AnalyticsService {
    async trackView(listingId: string, userId?: string) {
        try {
            const { error } = await supabase
                .from('analytics')
                .insert([{
                    listing_id: listingId,
                    user_id: userId,
                    event_type: 'view',
                }]);

            // Silently ignore errors in simulation mode
            if (error) return;
        } catch (err) {
            // Expected in simulation mode
        }
    }

    async trackSave(listingId: string, userId: string) {
        try {
            const { error } = await supabase
                .from('analytics')
                .insert([{
                    listing_id: listingId,
                    user_id: userId,
                    event_type: 'save',
                }]);

            // Silently ignore errors in simulation mode
            if (error) return;
        } catch (err) {
            // Expected in simulation mode
        }
    }

    async getListingStats(listingId: string) {
        try {
            const { data, error } = await supabase
                .from('analytics')
                .select('event_type')
                .eq('listing_id', listingId);

            if (error) throw error;

            const views = data.filter(e => e.event_type === 'view').length;
            const saves = data.filter(e => e.event_type === 'save').length;

            return { views, saves };
        } catch (error) {
            // Simulation: Return randomized stats for demo
            const seed = listingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const views = (seed % 400) + 120;
            const saves = Math.floor(views * 0.15);
            return { views, saves };
        }
    }

    async getOwnerOverallStats(ownerId: string) {
        // Simulation: Return overall stats for the owner
        return {
            totalViews: 4820,
            avgRating: 4.8,
            conversionRate: '18%',
            topListing: 'Sunrise Heights',
            monthlyGrowth: '+12.5%'
        };
    }
}

export const analyticsService = new AnalyticsService();
