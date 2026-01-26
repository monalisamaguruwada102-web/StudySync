import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';

const BOOKMARKS_KEY = '@user_bookmarks';

class BookmarksService {
    private cache: Set<string> | null = null;

    async getBookmarks(): Promise<string[]> {
        if (IS_SUPABASE_CONFIGURED) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return [];

                const { data, error } = await supabase
                    .from('bookmarks')
                    .select('listing_id')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Failed to get bookmarks from Supabase:', error);
                    return [];
                }
                const ids = (data || []).map(b => b.listing_id);
                this.cache = new Set(ids);
                return ids;
            } catch (err) {
                console.error('Unexpected error in getBookmarks:', err);
                return [];
            }
        }

        try {
            const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
            const ids = stored ? JSON.parse(stored) : [];
            this.cache = new Set(ids);
            return ids;
        } catch (error) {
            console.error('Failed to get bookmarks:', error);
            return [];
        }
    }

    async toggleBookmark(listingId: string): Promise<boolean> {
        if (IS_SUPABASE_CONFIGURED) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const bookmarks = await this.getBookmarks();
            const isCurrentlyBookmarked = bookmarks.includes(listingId);

            if (isCurrentlyBookmarked) {
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('listing_id', listingId);

                if (error) throw error;
                this.cache?.delete(listingId);
                return false;
            } else {
                const { error } = await supabase
                    .from('bookmarks')
                    .insert([{ user_id: user.id, listing_id: listingId }]);

                if (error) throw error;
                this.cache?.add(listingId);
                return true;
            }
        }

        try {
            const bookmarks = await this.getBookmarks();
            const isBookmarked = bookmarks.includes(listingId);

            let updatedBookmarks: string[];
            if (isBookmarked) {
                updatedBookmarks = bookmarks.filter(id => id !== listingId);
                this.cache?.delete(listingId);
            } else {
                updatedBookmarks = [...bookmarks, listingId];
                this.cache?.add(listingId);
            }

            await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
            return !isBookmarked;
        } catch (error) {
            console.error('Failed to toggle bookmark:', error);
            return false;
        }
    }

    async isBookmarked(listingId: string): Promise<boolean> {
        if (this.cache) {
            return this.cache.has(listingId);
        }

        // If no cache, fetch all once
        const bookmarks = await this.getBookmarks();
        return bookmarks.includes(listingId);
    }

    clearCache() {
        this.cache = null;
    }
}

export const bookmarksService = new BookmarksService();
