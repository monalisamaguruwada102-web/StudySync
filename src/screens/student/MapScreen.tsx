import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    Image,
} from 'react-native';
import MapView from 'react-native-map-clustering';
import { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Navigation, MapPin, Star, GraduationCap, School, Navigation2, Eye } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme, Spacing, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { listingsService } from '../../services/listings.service';
import { Listing } from '../../types';

const { width, height } = Dimensions.get('window');

const UNIVERSITIES = [
    { id: 'uz', name: 'University of Zimbabwe (UZ)', coordinate: { latitude: -17.7836, longitude: 31.0530 } },
    { id: 'nust', name: 'NUST', coordinate: { latitude: -20.1706, longitude: 28.6219 } },
    { id: 'msu', name: 'Midlands State University (MSU)', coordinate: { latitude: -19.4975, longitude: 29.8519 } },
];

const INITIAL_REGION = {
    latitude: -17.8248,
    longitude: 31.0530,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
};

export const MapScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        const data = await listingsService.getListings();
        setListings(data.filter(l => l.coordinates));
        setLoading(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={INITIAL_REGION}
                clusterColor={colors.primary}
                clusterTextColor="#ffffff"
                renderCluster={(cluster) => {
                    const { id, pointCount, coordinate, onPress } = cluster;
                    return (
                        <Marker key={id} coordinate={coordinate} onPress={onPress}>
                            <View style={[styles.cluster, { backgroundColor: colors.primary }]}>
                                <Text style={styles.clusterText}>{pointCount}</Text>
                            </View>
                        </Marker>
                    );
                }}
            >
                {/* University Markers */}
                {UNIVERSITIES.map(uni => (
                    <Marker
                        key={uni.id}
                        coordinate={uni.coordinate}
                        title={uni.name}
                        pinColor="#3b82f6"
                    >
                        <View style={[styles.uniMarker]}>
                            <GraduationCap size={24} color="#3b82f6" />
                        </View>
                    </Marker>
                ))}

                {/* Property Markers */}
                {listings.map((listing) => (
                    <Marker
                        key={listing.id}
                        coordinate={listing.coordinates!}
                    >
                        <View style={[styles.marker, { backgroundColor: colors.primary }, shadows.strong]}>
                            <Text style={styles.markerText}>${listing.price}</Text>
                        </View>

                        <Callout tooltip onPress={() => navigation.navigate('ListingDetails', { listing })}>
                            <View style={[styles.callout, { backgroundColor: colors.surface }, shadows.strong]}>
                                <View style={styles.calloutContent}>
                                    <Text style={[styles.calloutTitle, { color: colors.text }]} numberOfLines={1}>
                                        {listing.propertyName || listing.title}
                                    </Text>
                                    <View style={styles.row}>
                                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                                        <Text style={[styles.ratingText, { color: colors.text }]}>
                                            {listing.rating?.toFixed(1) || '4.5'}
                                        </Text>
                                        <Text style={[styles.priceText, { color: colors.primary }]}>
                                            • ${listing.price}/mo
                                        </Text>
                                    </View>
                                    <View style={[styles.viewDetailsBtn, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.viewDetailsText}>View Details</Text>
                                    </View>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            <SafeAreaView style={styles.headerContainer}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.surface }, shadows.soft]}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const DARK_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    // ... basic dark style for demo
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: width,
        height: height,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: Spacing.m,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cluster: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    clusterText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    uniMarker: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    marker: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'white',
    },
    markerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '800',
    },
    premiumMarker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    callout: {
        width: 180,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 8,
    },
    calloutContent: {
        padding: 4,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    priceText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    viewDetailsBtn: {
        marginTop: 8,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewDetailsText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
    }
});
