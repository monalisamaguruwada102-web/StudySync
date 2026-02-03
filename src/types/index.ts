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
    studentIdVerified?: boolean;
    boostCredits?: number;
    lifeTags?: string[];
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
    student_id_verified?: boolean;
    boost_credits?: number;
    life_tags?: string[];
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
    ownerAvatar?: string;
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
    boostStatus?: 'none' | 'pending' | 'active' | 'rejected';
    boostPeriod?: 'weekly' | 'monthly';
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
    fullUntil?: string;
    isPriorityVerification?: boolean;
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

export interface RentPayment {
    id: string;
    bookingId: string;
    studentId: string;
    ownerId: string;
    amount: number;
    monthYear: string;
    status: 'pending' | 'paid' | 'late';
    paymentDate: string;
    createdAt: string;
}

export interface MaintenanceRequest {
    id: string;
    listingId: string;
    studentId: string;
    ownerId: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'resolved' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    imageUrl?: string;
    createdAt: string;
}

export interface Lease {
    id: string;
    bookingId: string;
    studentId: string;
    ownerId: string;
    houseRules: string;
    depositTerms: string;
    rentSchedule: string;
    status: 'pending' | 'signed' | 'expired' | 'cancelled';
    pdfUrl?: string;
    signedAt?: string;
    createdAt: string;
}

export interface VisitorPass {
    id: string;
    studentId: string;
    listingId: string;
    visitorName: string;
    visitorPhone: string;
    visitDate: string;
    qrCodeContent: string;
    status: 'pending' | 'scanned' | 'expired';
    scannedAt?: string;
    createdAt: string;
}

export interface RevenueStat {
    ownerId: string;
    listingId: string;
    monthYear: string;
    totalRevenue: number;
    paymentCount: number;
    lastPaymentAt: string;
}

export interface UtilityBill {
    id: string;
    listingId: string;
    ownerId: string;
    monthYear: string;
    billType: 'electricity' | 'water' | 'internet' | 'other';
    totalAmount: number;
    splitAmount: number;
    dueDate?: string;
    status: 'pending' | 'collected' | 'paid';
    imageUrl?: string;
    createdAt: string;
}
