import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Users, Heart, Star, ShieldCheck, Sparkle, Eye } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { Spacing } from '../theme/Theme';
import { useTheme } from '../context/ThemeContext';
import { Listing } from '../types';
import { bookmarksService } from '../services/bookmarks.service';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800';

interface Props {
    listing: Listing;
    onPress?: () => void;
}

export const PropertyCard: React.FC<Props> = React.memo(({ listing, onPress }) => {
    const navigation = useNavigation<any>();
    const { colors, shadows } = useTheme();

    const [isSaved, setIsSaved] = React.useState(false);

    useEffect(() => {
        const checkBookmark = async () => {
            const bookmarked = await bookmarksService.isBookmarked(listing.id);
            setIsSaved(bookmarked);
        };
        checkBookmark();
    }, [listing.id]);

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('ListingDetails', { listing });
        }
    };

    const handleSave = async (e: any) => {
        e.stopPropagation();
        const newState = await bookmarksService.toggleBookmark(listing.id);
        setIsSaved(newState);
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: colors.surface },
                shadows.soft,
                listing.isPremium && { borderColor: '#f59e0b', borderWidth: 2 }
            ]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                {listing.images && listing.images.length > 0 && listing.images[0] ? (
                    <Image
                        source={{ uri: listing.images[0] || PLACEHOLDER_IMAGE }}
                        style={styles.image}
                        contentFit="cover"
                        cachePolicy="disk"
                        transition={300}
                        placeholder={require('../../assets/icon_fixed.png')}
                        onError={(e) => console.log(`PropertyCard image load error (${listing.id}):`, e)}
                    />
                ) : (
                    <View style={[styles.image, styles.placeholderImage, { backgroundColor: colors.border }]}>
                        <MapPin size={40} color={colors.textLight} />
                        <Text style={[styles.placeholderText, { color: colors.textLight }]}>No Image</Text>
                    </View>
                )}
                <View style={styles.topBadges}>
                    {listing.isPremium && (
                        <View style={[styles.badge, { backgroundColor: '#f59e0b', marginBottom: 4 }]}>
                            <Sparkle size={12} color={colors.white} />
                            <Text style={styles.badgeText}>Featured</Text>
                        </View>
                    )}
                    {listing.isVerified && (
                        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                            <ShieldCheck size={12} color={colors.white} />
                            <Text style={styles.badgeText}>Verified</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.heartBtn, { backgroundColor: colors.white + 'CC' }]}
                    onPress={handleSave}
                >
                    <Heart
                        size={18}
                        color={isSaved ? colors.error : colors.text}
                        fill={isSaved ? colors.error : 'transparent'}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.propertyName, { color: colors.text }]} numberOfLines={1}>
                            {listing.propertyName || 'Boarding Home'}
                        </Text>
                        {listing.isPremium && (
                            <Sparkle size={16} color="#f59e0b" style={{ marginLeft: 4 }} />
                        )}
                        {listing.isVerified && (
                            <ShieldCheck size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                        )}
                    </View>
                    <View style={styles.ratingRow}>
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <Text style={[styles.ratingText, { color: colors.text }]}>
                            {listing.rating?.toFixed(1) || '0.0'}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.textLight }]} numberOfLines={1}>
                    {listing.title}
                </Text>

                <View style={styles.locationContainer}>
                    <MapPin size={14} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.textLight }]} numberOfLines={1}>
                        {listing.location}
                    </Text>
                    {listing.distanceLabel ? (
                        <View style={[styles.distanceTag, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30', borderWidth: 1 }]}>
                            <MapPin size={10} color={colors.primary} />
                            <Text style={[styles.distanceTagText, { color: colors.primary }]}>{listing.distanceLabel}</Text>
                        </View>
                    ) : (
                        <View style={styles.viewBadge}>
                            <Eye size={12} color={colors.textLight} />
                            <Text style={[styles.viewText, { color: colors.textLight }]}>
                                {Math.floor(Math.random() * 200) + 50}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <View style={styles.amenities}>
                        <View style={styles.amenityItem}>
                            <Users size={14} color={colors.textLight} />
                            <Text style={[styles.amenityText, { color: colors.textLight }]}>
                                {listing.maxOccupancy} max
                            </Text>
                        </View>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={[styles.price, { color: colors.primary }]}>${listing.price}</Text>
                        <Text style={[styles.priceUnit, { color: colors.textLight }]}>/mo</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        marginBottom: Spacing.m,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 180,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
    },
    topBadges: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    heartBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    propertyName: {
        fontSize: 18,
        fontWeight: '800',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 13,
        marginLeft: 4,
        flex: 1,
    },
    viewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    viewText: {
        fontSize: 11,
        marginLeft: 4,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 12,
    },
    amenities: {
        flexDirection: 'row',
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    amenityText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
    },
    priceUnit: {
        fontSize: 12,
        marginLeft: 2,
    },
    distanceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 8,
    },
    distanceTagText: {
        fontSize: 11,
        fontWeight: '800',
        marginLeft: 4,
    },
});
