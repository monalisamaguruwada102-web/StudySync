import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@user_bookmarks';

class BookmarksService {
    async getBookmarks(): Promise<string[]> {
        try {
            const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to get bookmarks:', error);
            return [];
        }
    }

    async toggleBookmark(listingId: string): Promise<boolean> {
        try {
            const bookmarks = await this.getBookmarks();
            const isBookmarked = bookmarks.includes(listingId);

            let updatedBookmarks: string[];
            if (isBookmarked) {
                updatedBookmarks = bookmarks.filter(id => id !== listingId);
            } else {
                updatedBookmarks = [...bookmarks, listingId];
            }

            await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
            return !isBookmarked;
        } catch (error) {
            console.error('Failed to toggle bookmark:', error);
            return false;
        }
    }

    async isBookmarked(listingId: string): Promise<boolean> {
        try {
            const bookmarks = await this.getBookmarks();
            return bookmarks.includes(listingId);
        } catch (error) {
            return false;
        }
    }
}

export const bookmarksService = new BookmarksService();
