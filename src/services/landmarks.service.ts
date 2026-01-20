import { Coordinates } from '../types';

export interface Landmark {
    id: string;
    name: string;
    coordinates: Coordinates;
    type: 'university' | 'mall' | 'transport';
}

export const LANDMARKS: Landmark[] = [
    {
        id: 'uz',
        name: 'University of Zimbabwe',
        coordinates: { latitude: -17.7844, longitude: 31.0531 },
        type: 'university'
    },
    {
        id: 'hit',
        name: 'Harare Institute of Technology',
        coordinates: { latitude: -17.8647, longitude: 31.0189 },
        type: 'university'
    },
    {
        id: 'nust',
        name: 'NUST',
        coordinates: { latitude: -20.1700, longitude: 28.6186 },
        type: 'university'
    },
    {
        id: 'msu',
        name: 'Midlands State University',
        coordinates: { latitude: -19.4542, longitude: 29.8164 },
        type: 'university'
    },
    {
        id: 'sam_levy',
        name: 'Sam Levy’s Village',
        coordinates: { latitude: -17.7533, longitude: 31.0858 },
        type: 'mall'
    },
    {
        id: 'joina',
        name: 'Joina City',
        coordinates: { latitude: -17.8315, longitude: 31.0478 },
        type: 'mall'
    }
];

export const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1.latitude * Math.PI / 180) * Math.cos(coords2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const findLandmarkByName = (name: string): Landmark | undefined => {
    const lowerName = name.toLowerCase();
    return LANDMARKS.find(l =>
        l.name.toLowerCase().includes(lowerName) ||
        (l.id === 'uz' && lowerName === 'uz')
    );
};
