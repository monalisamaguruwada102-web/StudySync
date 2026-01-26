import { supabase } from './supabase';
import { UserProfile, Listing } from '../types';

export const matchingService = {
    /**
     * Suggests listings based on similarity between the current user's life tags 
     * and the life tags of existing tenants in those listings.
     */
    async suggestListings(userId: string, userTags: string[]): Promise<any[]> {
        // In a real scenario, this would be a more complex join/aggregation
        // For now, we fetch listings and their bookings/tenants to compare
        const { data: listings, error } = await supabase
            .from('listings')
            .select(`
        *,
        bookings (
          status,
          profiles (id, life_tags)
        )
      `)
            .eq('bookings.status', 'paid'); // Only count actual tenants

        if (error) throw error;

        return listings.map(listing => {
            const tenants = (listing.bookings as any[] || [])
                .map(b => b.profiles)
                .filter(p => p && p.life_tags);

            const compatibilityScore = this.calculateCompatibility(userTags, tenants);
            return { ...listing, compatibilityScore };
        }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    },

    calculateCompatibility(userTags: string[], tenants: any[]): number {
        if (tenants.length === 0) return 50; // Neutral for empty houses

        let totalMatch = 0;
        tenants.forEach(tenant => {
            const matchCount = userTags.filter(tag => tenant.life_tags.includes(tag)).length;
            totalMatch += (matchCount / Math.max(userTags.length, 1)) * 100;
        });

        return totalMatch / tenants.length;
    },

    async updateLifeTags(userId: string, tags: string[]): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ life_tags: tags })
            .eq('id', userId);

        if (error) throw error;
    }
};
