import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Listing } from '../types';
import { MOCK_LISTINGS } from './mockData';
import { supabase, IS_SUPABASE_CONFIGURED, SUPABASE_URL } from './supabase';

const STORAGE_KEY = '@listings_data';

// Mapping Helpers
const mapToListing = (dbListing: any): Listing => {
    const supabaseUrl = SUPABASE_URL;

    // Map Images (Handle both full URLs and relative paths)
    const images = (dbListing.images || []).map((img: string) => {
        if (!img) return null;
        if (img.startsWith('http') || img.startsWith('file://') || img.startsWith('data:')) return img;
        return `${supabaseUrl}/storage/v1/object/public/listing-images/${img}`;
    }).filter(Boolean);

    // Map Owner Avatar
    let ownerAvatar = dbListing.owner_avatar;
    if (ownerAvatar && !ownerAvatar.startsWith('http')) {
        ownerAvatar = `${supabaseUrl}/storage/v1/object/public/user-assets/${ownerAvatar}`;
    }

    return {
        id: dbListing.id,
        ownerId: dbListing.owner_id,
        ownerName: dbListing.owner_name,
        ownerPhone: dbListing.owner_phone,
        ownerAvatar: ownerAvatar,
        propertyName: dbListing.property_name,
        title: dbListing.title,
        description: dbListing.description,
        price: dbListing.price,
        location: dbListing.location,
        gender: dbListing.gender,
        maxOccupancy: dbListing.max_occupancy,
        amenities: dbListing.amenities || [],
        images: images,
        isVerified: dbListing.is_verified,
        isPremium: dbListing.is_premium,
        boostExpiry: dbListing.boost_expiry,
        boostStatus: dbListing.boost_status || 'none',
        boostPeriod: dbListing.boost_period,
        coordinates: dbListing.latitude && dbListing.longitude ? {
            latitude: dbListing.latitude,
            longitude: dbListing.longitude
        } : undefined,
        ecocashNumber: dbListing.ecocash_number,
        fullUntil: dbListing.full_until,
        isPriorityVerification: dbListing.is_priority_verification,
    };
};

const mapToDb = (listing: Partial<Listing>) => ({
    owner_id: listing.ownerId,
    owner_name: listing.ownerName,
    owner_phone: listing.ownerPhone,
    owner_avatar: listing.ownerAvatar,
    property_name: listing.propertyName,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location: listing.location,
    gender: listing.gender,
    max_occupancy: listing.maxOccupancy,
    amenities: listing.amenities,
    images: listing.images,
    is_verified: listing.isVerified,
    is_premium: listing.isPremium,
    boost_expiry: listing.boostExpiry,
    boost_status: listing.boostStatus,
    boost_period: listing.boostPeriod,
    latitude: listing.coordinates?.latitude,
    longitude: listing.coordinates?.longitude,
    ecocash_number: listing.ecocashNumber,
    full_until: listing.fullUntil,
    is_priority_verification: listing.isPriorityVerification,
});

export const listingsService = {
    getListings: async (): Promise<Listing[]> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('listings')
                .select('id, owner_id, owner_name, owner_phone, owner_avatar, property_name, title, description, price, location, gender, max_occupancy, amenities, images, is_verified, is_premium, boost_expiry, boost_status, boost_period, latitude, longitude, ecocash_number, full_until, is_priority_verification')
                .order('is_premium', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                return (data || []).slice(0, 3).map(mapToListing);
            }

            return (data || []).map(mapToListing);
        }

        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const listings: Listing[] = stored ? JSON.parse(stored) : MOCK_LISTINGS;

            if (!stored) {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_LISTINGS));
            }

            return listings.sort((a, b) => {
                if (a.isPremium && !b.isPremium) return -1;
                if (!a.isPremium && b.isPremium) return 1;
                return 0;
            });
        } catch (error) {
            console.error('Error fetching mock listings:', error);
            return MOCK_LISTINGS;
        }
    },

    getListingsByOwner: async (ownerId: string): Promise<Listing[]> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('listings')
                .select('id, owner_id, owner_name, owner_phone, owner_avatar, property_name, title, description, price, location, gender, max_occupancy, amenities, images, is_verified, is_premium, boost_expiry, boost_status, boost_period, latitude, longitude, ecocash_number, full_until, is_priority_verification')
                .eq('owner_id', ownerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapToListing);
        }
        const listings = await listingsService.getListings();
        return listings.filter(l => l.ownerId === ownerId);
    },

    getListingById: async (id: string): Promise<Listing | undefined> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('listings')
                .select('id, owner_id, owner_name, owner_phone, owner_avatar, property_name, title, description, price, location, gender, max_occupancy, amenities, images, is_verified, is_premium, boost_expiry, boost_status, boost_period, latitude, longitude, ecocash_number, full_until, is_priority_verification')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data ? mapToListing(data) : undefined;
        }
        const listings = await listingsService.getListings();
        return listings.find(l => l.id === id);
    },

    saveListing: async (listingData: Partial<Listing>): Promise<Listing> => {
        if (IS_SUPABASE_CONFIGURED) {
            const dbData = mapToDb(listingData);

            if (listingData.id) {
                const { data, error } = await supabase
                    .from('listings')
                    .update(dbData)
                    .eq('id', listingData.id)
                    .select()
                    .single();

                if (error) throw error;
                return mapToListing(data);
            } else {
                const { data, error } = await supabase
                    .from('listings')
                    .insert([dbData])
                    .select()
                    .single();

                if (error) throw error;
                return mapToListing(data);
            }
        }

        // Simulation Mode
        const listings = await listingsService.getListings();

        if (listingData.id) {
            const index = listings.findIndex(l => l.id === listingData.id);
            const updated = { ...listings[index], ...listingData } as Listing;
            listings[index] = updated;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
            return updated;
        } else {
            const newListing: Listing = {
                ...listingData,
                id: Math.random().toString(36).substr(2, 9),
                isVerified: false,
                isPremium: false,
                occupancy: 0,
                images: listingData.images || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
                coordinates: listingData.coordinates || { latitude: -17.8248, longitude: 31.0530 },
            } as Listing;

            const updatedListings = [...listings, newListing];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedListings));
            return newListing;
        }
    },

    deleteListing: async (id: string): Promise<void> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return;
        }
        const listings = await listingsService.getListings();
        const updated = listings.filter(l => l.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    searchListings: async (query: string): Promise<Listing[]> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('listings')
                .select('id, owner_id, owner_name, owner_phone, owner_avatar, property_name, title, description, price, location, gender, max_occupancy, amenities, images, is_verified, is_premium, boost_expiry, boost_status, boost_period, latitude, longitude')
                .or(`title.ilike.%${query}%,location.ilike.%${query}%,property_name.ilike.%${query}%`)
                .order('is_premium', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return (data || []).map(mapToListing);
        }
        const listings = await listingsService.getListings();
        const lowerQuery = query.toLowerCase();
        return listings.filter(l =>
            l.title.toLowerCase().includes(lowerQuery) ||
            l.location.toLowerCase().includes(lowerQuery) ||
            (l.propertyName && l.propertyName.toLowerCase().includes(lowerQuery))
        ).sort((a, b) => {
            if (a.isPremium && !b.isPremium) return -1;
            if (!a.isPremium && b.isPremium) return 1;
            return 0;
        });
    },

    updateBoostStatus: async (id: string, isPremium: boolean): Promise<void> => {
        if (IS_SUPABASE_CONFIGURED) {
            const expiry = isPremium ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
            const { error } = await supabase
                .from('listings')
                .update({ is_premium: isPremium, boost_expiry: expiry })
                .eq('id', id);

            if (error) throw error;
            return;
        }
        const listings = await listingsService.getListings();
        const index = listings.findIndex(l => l.id === id);
        if (index !== -1) {
            listings[index].isPremium = isPremium;
            if (isPremium) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 7);
                listings[index].boostExpiry = expiry.toISOString();
            } else {
                listings[index].boostExpiry = undefined;
            }
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
        }
    },

    requestBoost: async (id: string, period: 'weekly' | 'monthly'): Promise<void> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { error } = await supabase
                .from('listings')
                .update({
                    boost_status: 'pending',
                    boost_period: period,
                    is_premium: false
                })
                .eq('id', id);

            if (error) throw error;
            return;
        }

        const listings = await listingsService.getListings();
        const index = listings.findIndex(l => l.id === id);
        if (index !== -1) {
            listings[index].boostStatus = 'pending';
            listings[index].boostPeriod = period;
            listings[index].isPremium = false;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
        }
    },

    approveBoost: async (id: string): Promise<void> => {
        const period = 'monthly'; // or fetch from listing if needed, but assuming approval is effectively acting on the request
        const durationDays = 30; // Monthly constant

        if (IS_SUPABASE_CONFIGURED) {
            const expiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
            const { error } = await supabase
                .from('listings')
                .update({
                    is_premium: true,
                    boost_status: 'active',
                    boost_expiry: expiry
                })
                .eq('id', id);

            if (error) throw error;
            return;
        }

        const listings = await listingsService.getListings();
        const index = listings.findIndex(l => l.id === id);
        if (index !== -1) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + durationDays);

            listings[index].isPremium = true;
            listings[index].boostStatus = 'active';
            listings[index].boostExpiry = expiry.toISOString();

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
        }
    },

    rejectBoost: async (id: string): Promise<void> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { error } = await supabase
                .from('listings')
                .update({
                    boost_status: 'rejected',
                    is_premium: false
                })
                .eq('id', id);

            if (error) throw error;
            return;
        }

        const listings = await listingsService.getListings();
        const index = listings.findIndex(l => l.id === id);
        if (index !== -1) {
            listings[index].boostStatus = 'rejected';
            listings[index].isPremium = false;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
        }
    },

    submitReview: async (listingId: string, review: any): Promise<void> => {
        if (IS_SUPABASE_CONFIGURED) {
            console.log('[ListingsService] Submitting review for listing:', listingId);
            const { error } = await supabase
                .from('reviews')
                .insert([{
                    listing_id: listingId,
                    user_id: review.userId,
                    user_name: review.userName,
                    rating: review.rating,
                    comment: review.comment,
                    cleanliness_rating: review.subRatings?.cleanliness,
                    location_rating: review.subRatings?.location,
                    value_rating: review.subRatings?.value,
                    images: review.images
                }]);

            if (error) {
                console.error('[ListingsService] Review submission failed:', error.message, error.details, error.hint);
                throw error;
            }
            console.log('[ListingsService] Review submitted successfully');
            return;
        }
        // Simulation mode
        console.log('[ListingsService] Simulation: Review submitted locally');
    },

    getReviews: async (listingId: string): Promise<any[]> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('reviews')
                .select('id, listing_id, user_id, user_name, rating, comment, cleanliness_rating, location_rating, value_rating, images, created_at')
                .eq('listing_id', listingId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('[ListingsService] Failed to fetch reviews:', error.message);
                return [];
            }
            return data || [];
        }
        return [];
    },

    submitForVerification: async (listingId: string): Promise<void> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { error } = await supabase
                .from('listings')
                .update({
                    is_priority_verification: true,
                    is_verified: false
                })
                .eq('id', listingId);

            if (error) throw error;
            return;
        }

        const listings = await listingsService.getListings();
        const index = listings.findIndex(l => l.id === listingId);
        if (index !== -1) {
            listings[index].isPriorityVerification = true;
            listings[index].isVerified = false;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
        }
    }
};

