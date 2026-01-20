export type UserRole = 'student' | 'owner' | 'admin';

export interface User {
    id: string;
    email: string;
    password?: string;
    phone?: string;
    name: string;
    role: UserRole;
    avatar?: string;
    verificationStatus?: 'none' | 'pending' | 'verified';
    idDocumentUrl?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    verification_status: 'none' | 'pending' | 'verified';
    avatar?: string;
    id_document_url?: string;
    bio?: string;
    phone_number?: string;
}

export interface Amenity {
    id: string;
    name: string;
    icon: string;
}

export interface Review {
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    timestamp: number;
    date?: string; // For mock data display
    subRatings?: {
        cleanliness: number;
        location: number;
        value: number;
    };
    images?: string[];
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface Listing {
    id: string;
    ownerId: string;
    ownerName?: string;
    ownerPhone?: string;
    propertyName: string;
    title: string;
    description: string;
    price: number;
    location: string;
    distance?: string;
    gender?: 'male' | 'female' | 'mixed';
    occupancy?: number;
    maxOccupancy: number;
    amenities: string[];
    images: string[];
    isVerified?: boolean;
    isPremium?: boolean;
    boostExpiry?: string;
    coordinates?: Coordinates;
    reviews?: Review[];
    rating?: number;
    subRatingStats?: {
        cleanliness: number;
        location: number;
        value: number;
    };
    category?: string;
    type?: string;
    ecocashNumber?: string;
    distanceLabel?: string;
}



export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export interface Conversation {
    id: string;
    participantIds: string[];
    participantNames?: { [userId: string]: string };
    lastMessage?: string;
    lastMessageTime?: number;
    otherParticipantName: string;
    unreadCount?: number;
}

export interface Booking {
    id: string;
    listingId: string;
    studentId: string;
    ownerId: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
    totalPrice: number;
    paymentReference?: string;
    createdAt: string;
    listingTitle?: string;
    studentName?: string;
    studentPhone?: string;
    ownerPhone?: string;
}
