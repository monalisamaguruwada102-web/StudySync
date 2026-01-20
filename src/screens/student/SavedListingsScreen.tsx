import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Heart, Home } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { bookmarksService } from '../../services/bookmarks.service';
import { listingsService } from '../../services/listings.service';
import { PropertyCard } from '../../components/PropertyCard';
import { Listing } from '../../types';

export const SavedListingsScreen = () => {
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [savedListings, setSavedListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSavedListings = async () => {
        setLoading(true);
        try {
            const bookmarkIds = await bookmarksService.getBookmarks();
            const allListings = await listingsService.getListings();
            const filtered = allListings.filter(l => bookmarkIds.includes(l.id));
            setSavedListings(filtered);
        } catch (error) {
            console.error('Failed to load saved listings');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadSavedListings();
        }, [])
    );

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Saved Homes</Text>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{savedListings.length}</Text>
                </View>
            </View>

            <FlatList
                data={savedListings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PropertyCard listing={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                            <Heart size={48} color={colors.border} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your wishlist is empty</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
                            Tap the heart on any property to save it here for later.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.m,
    },
    title: {
        ...Typography.h1,
        fontSize: 28,
    },
    badge: {
        marginLeft: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontWeight: '800',
        fontSize: 14,
    },
    listContent: {
        padding: Spacing.l,
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 50,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});
