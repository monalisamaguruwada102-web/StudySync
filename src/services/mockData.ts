import { Listing, UserProfile, Conversation, Message } from '../types';

export const MOCK_USERS: UserProfile[] = [
    {
        id: 'student_1',
        email: 'student@example.com',
        name: 'Tatenda Muzenda',
        role: 'student',
        verification_status: 'none',
    },
    {
        id: 'owner_1',
        email: 'owner@example.com',
        name: 'Mr. Moyo',
        role: 'owner',
        verification_status: 'verified',
    },
    {
        id: 'admin_1',
        email: 'admin@offrez.connect',
        name: 'Admin Control',
        role: 'admin',
        verification_status: 'verified',
    }
];

export const MOCK_LISTINGS: Listing[] = [];

export const MOCK_CONVERSATIONS: Conversation[] = [];

export const MOCK_MESSAGES: Message[] = [];

