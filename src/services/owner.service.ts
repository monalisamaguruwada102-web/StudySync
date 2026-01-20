import { Listing } from '../types';

const MOCK_STATS = {
    totalViews: 1240,
    newMessages: 8,
    activeListings: 2,
    totalInquiries: 45,
};

const MOCK_OWNER_LISTINGS: Listing[] = [
    {
        id: 'l1',
        ownerId: 'u2',
        ownerName: 'Mrs. Chipo',
        propertyName: 'Chipo Cottage',
        title: 'Modern Student Cottage',
        description: 'Beautiful 2-bedroom cottage within walking distance to UZ.',
        price: 150,
        location: 'Mount Pleasant, Harare',
        distance: '0.5km',
        gender: 'mixed',
        occupancy: 2,
        maxOccupancy: 4,
        amenities: ['wifi', 'solar'],
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'],
        isVerified: true,
    }
];

export const ownerService = {
    getStats: async () => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_STATS), 400);
        });
    },
    getOwnerListings: async (ownerId: string): Promise<Listing[]> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_OWNER_LISTINGS), 600);
        });
    }
};
