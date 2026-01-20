import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    RefreshControl,
    Alert,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Bell, Map as MapIcon, Sparkles, X, Check, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { PropertyCard } from '../../components/PropertyCard';
import { listingsService } from '../../services/listings.service';
import { Listing } from '../../types';
import { LANDMARKS, findLandmarkByName, calculateDistance, Landmark } from '../../services/landmarks.service';

const { height } = Dimensions.get('window');

export const HomeListingScreen = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { mode, isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    // Filter State
    const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female' | 'mixed'>('all');
    const [filterVerified, setFilterVerified] = useState(false);
    const [maxPrice, setMaxPrice] = useState(100);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating' | 'distance'>('default');

    const categories = ['All', 'Hostels', 'Ensuite', 'Girls Only', 'Boys Only', 'Verified'];
    const availableAmenities = [
        { name: 'Wifi', icon: 'Wifi' },
        { name: 'Solar', icon: 'Sun' },
        { name: 'Water', icon: 'Droplets' },
        { name: 'Security', icon: 'Shield' },
        { name: 'Parking', icon: 'Car' },
        { name: 'Kitchen', icon: 'Utensils' }
    ];

    const {
        data: listings = [],
        isLoading: loading,
        refetch,
        isRefetching
    } = useQuery({
        queryKey: ['listings'],
        queryFn: listingsService.getListings,
    });

    useEffect(() => {
        applyFilters(listings, activeCategory, searchQuery, selectedLandmark);
    }, [listings, activeCategory, searchQuery, filterGender, filterVerified, maxPrice, selectedLandmark]);

    const applyFilters = (data: Listing[], category: string, query: string, landmark: Landmark | null = null) => {
        let result = [...data];

        // Category
        if (category === 'Girls Only') {
            result = result.filter(l => l.gender === 'female');
        } else if (category === 'Verified') {
            result = result.filter(l => l.isVerified);
        } else if (category !== 'All') {
            result = result.filter(l => l.location.toLowerCase().includes(category.toLowerCase()));
        }

        // Search Query
        if (query) {
            result = result.filter(item =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.location.toLowerCase().includes(query.toLowerCase()) ||
                (item.propertyName && item.propertyName.toLowerCase().includes(query.toLowerCase()))
            );
        }

        // Advanced Filters
        if (filterGender !== 'all') {
            result = result.filter(l => l.gender === filterGender);
        }
        if (filterVerified) {
            result = result.filter(l => l.isVerified);
        }
        result = result.filter(l => l.price <= maxPrice);

        // Amenities Filter
        if (selectedAmenities.length > 0) {
            result = result.filter(l =>
                selectedAmenities.every(amenity =>
                    l.amenities?.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
                )
            );
        }

        // Proximity Logic
        let targetLandmark = landmark;
        const nearMatch = query.toLowerCase().match(/near\s+(.+)/);
        if (nearMatch) {
            const found = findLandmarkByName(nearMatch[1]);
            if (found) targetLandmark = found;
        }

        if (targetLandmark) {
            result = result.map(l => {
                if (l.coordinates) {
                    const dist = calculateDistance(l.coordinates, targetLandmark!.coordinates);
                    return {
                        ...l,
                        distanceSort: dist,
                        distanceLabel: `${dist.toFixed(1)} km from ${targetLandmark!.id === 'uz' ? 'UZ' : targetLandmark!.name}`
                    };
                }
                return l;
            });

            // Auto-sort by distance if landmark is explicitly selected but no other sort is set
            if (sortBy === 'default' || sortBy === 'distance') {
                result.sort((a, b) => ((a as any).distanceSort || 999) - ((b as any).distanceSort || 999));
            }
        }

        // Apply Sorting (Override if needed)
        if (sortBy === 'price_asc') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_desc') {
            result.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating') {
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        setFilteredListings(result);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        applyFilters(listings, activeCategory, query, selectedLandmark);
    };

    const handleCategoryPress = (category: string) => {
        setActiveCategory(category);
        applyFilters(listings, category, searchQuery);
    };

    const resetFilters = () => {
        setFilterGender('all');
        setFilterVerified('false' as any === 'true'); // Reset but keeps type safety
        setFilterVerified(false);
        setMaxPrice(100);
        setSelectedAmenities([]);
    };

    const FilterModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isFilterVisible}
            onRequestClose={() => setIsFilterVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
                        <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterLabel, { color: colors.text }]}>Gender Preference</Text>
                            <View style={styles.filterRow}>
                                {['all', 'male', 'female', 'mixed'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.filterTab,
                                            filterGender === g && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setFilterGender(g as any)}
                                    >
                                        <Text style={[
                                            styles.filterTabText,
                                            { color: filterGender === g ? colors.white : colors.textLight }
                                        ]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={[styles.filterLabel, { color: colors.text }]}>Amenities</Text>
                            <View style={styles.filterRow}>
                                {availableAmenities.map((amenity) => {
                                    const isSelected = selectedAmenities.includes(amenity.name);
                                    return (
                                        <TouchableOpacity
                                            key={amenity.name}
                                            style={[
                                                styles.filterTab,
                                                isSelected && { backgroundColor: colors.primary }
                                            ]}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedAmenities(selectedAmenities.filter(a => a !== amenity.name));
                                                } else {
                                                    setSelectedAmenities([...selectedAmenities, amenity.name]);
                                                }
                                            }}
                                        >
                                            <Text style={[
                                                styles.filterTabText,
                                                { color: isSelected ? colors.white : colors.textLight }
                                            ]}>
                                                {amenity.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={[styles.filterLabel, { color: colors.text }]}>Price Range (Max)</Text>
                            <View style={styles.priceFilterRow}>
                                {[60, 80, 100].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priceTab,
                                            maxPrice === p && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                                        ]}
                                        onPress={() => setMaxPrice(p)}
                                    >
                                        <Text style={[
                                            styles.priceTabText,
                                            { color: maxPrice === p ? colors.primary : colors.textLight }
                                        ]}>
                                            Up to ${p}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setFilterVerified(!filterVerified)}
                            >
                                <View style={[
                                    styles.checkbox,
                                    { borderColor: colors.border },
                                    filterVerified && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}>
                                    {filterVerified && <Check size={14} color={colors.white} />}
                                </View>
                                <Text style={[styles.checkboxLabel, { color: colors.text }]}>Verified Listings Only</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                            <Text style={[styles.resetText, { color: colors.textLight }]}>Reset All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                applyFilters(listings, activeCategory, searchQuery);
                                setIsFilterVisible(false);
                            }}
                        >
                            <Text style={styles.applyText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.textLight }]}>{t('home.greeting')}👋</Text>
                    <Text style={[styles.brandTitle, { color: colors.text }]}>{t('home.findHome')}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.mapToggleBtn, { backgroundColor: colors.surface }, shadows.soft]}
                    onPress={() => navigation.navigate('Map')}
                >
                    <MapIcon size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading || isRefetching}
                        onRefresh={refetch}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                <View style={styles.searchSection}>
                    <View style={[styles.searchBar, { backgroundColor: colors.surface }, shadows.soft]}>
                        <Search size={20} color={colors.textLight} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder={t('common.search')}
                            placeholderTextColor={colors.textLight}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterBtn, { backgroundColor: colors.primary }, shadows.strong]}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <Filter size={20} color={colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.categoryContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.miniTitle, { color: colors.text }]}>Nearby Landmarks</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                        {LANDMARKS.map((landmark) => (
                            <TouchableOpacity
                                key={landmark.id}
                                onPress={() => {
                                    if (selectedLandmark?.id === landmark.id) {
                                        setSelectedLandmark(null);
                                    } else {
                                        setSelectedLandmark(landmark);
                                        setSearchQuery(`near ${landmark.name}`);
                                    }
                                }}
                                style={[
                                    styles.landmarkTab,
                                    { backgroundColor: colors.surface },
                                    selectedLandmark?.id === landmark.id && { backgroundColor: colors.secondary },
                                    shadows.soft
                                ]}
                            >
                                <MapIcon size={14} color={selectedLandmark?.id === landmark.id ? colors.white : colors.secondary} />
                                <Text style={[
                                    styles.categoryText,
                                    { marginLeft: 6, color: selectedLandmark?.id === landmark.id ? colors.white : colors.text }
                                ]}>
                                    {landmark.id === 'uz' ? 'UZ' : landmark.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.categoryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => handleCategoryPress(cat)}
                                style={[
                                    styles.categoryTab,
                                    { backgroundColor: colors.surface },
                                    activeCategory === cat && { backgroundColor: colors.primary },
                                    shadows.soft
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    { color: activeCategory === cat ? colors.white : colors.textLight }
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Active Filters / Sorting Row */}
                <View style={styles.filterBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarScroll}>
                        <TouchableOpacity
                            style={[styles.sortBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => {
                                const next: any = {
                                    default: 'price_asc',
                                    price_asc: 'price_desc',
                                    price_desc: 'rating',
                                    rating: selectedLandmark ? 'distance' : 'default',
                                    distance: 'default'
                                };
                                setSortBy(next[sortBy] || 'default');
                            }}
                        >
                            <TrendingUp size={14} color={colors.primary} />
                            <Text style={[styles.filterBadgeText, { color: colors.text }]}>
                                Sort: {sortBy.replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>

                        {filterGender !== 'all' && (
                            <View style={[styles.activeFilterBadge, { backgroundColor: colors.primaryLight }]}>
                                <Text style={[styles.filterBadgeText, { color: colors.primary }]}>{filterGender}</Text>
                                <TouchableOpacity onPress={() => setFilterGender('all')}>
                                    <X size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {maxPrice < 100 && (
                            <View style={[styles.activeFilterBadge, { backgroundColor: colors.primaryLight }]}>
                                <Text style={[styles.filterBadgeText, { color: colors.primary }]}>Under ${maxPrice}</Text>
                                <TouchableOpacity onPress={() => setMaxPrice(100)}>
                                    <X size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedAmenities.map(a => (
                            <View key={a} style={[styles.activeFilterBadge, { backgroundColor: colors.primaryLight }]}>
                                <Text style={[styles.filterBadgeText, { color: colors.primary }]}>{a}</Text>
                                <TouchableOpacity onPress={() => setSelectedAmenities(selectedAmenities.filter(item => item !== a))}>
                                    <X size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.listingsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Listed Properties</Text>
                        <TouchableOpacity>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredListings.length > 0 ? (
                        filteredListings.map((item) => (
                            <PropertyCard key={item.id} listing={item} />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Sparkles size={48} color={isDark ? colors.border : '#e2e8f0'} />
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>No listings found matching your criteria.</Text>
                            <TouchableOpacity
                                style={[styles.clearSearch, { backgroundColor: colors.primaryLight }]}
                                onPress={() => {
                                    handleCategoryPress('All');
                                    resetFilters();
                                }}
                            >
                                <Text style={[styles.clearSearchText, { color: colors.primary }]}>Clear all filters</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView >
            <FilterModal />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.l,
        paddingTop: Spacing.m,
        paddingBottom: Spacing.s,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
    },
    brandTitle: {
        ...Typography.h1,
        fontSize: 28,
        marginTop: -4,
    },
    notificationBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: 'white',
    },
    mapToggleBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: Spacing.m,
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.l,
        marginBottom: Spacing.l,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        borderRadius: 20,
        height: 56,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    filterBtn: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryContainer: {
        marginBottom: Spacing.l,
    },
    categoryScroll: {
        paddingLeft: Spacing.l,
        paddingBottom: 4,
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginRight: 12,
    },
    landmarkTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '700',
    },
    miniTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
        paddingHorizontal: Spacing.l,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.6,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listingsSection: {
        paddingHorizontal: Spacing.l,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    sectionTitle: {
        ...Typography.h2,
    },
    seeAll: {
        fontWeight: '700',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 16,
        textAlign: 'center',
    },
    clearSearch: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    clearSearchText: {
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 24,
        maxHeight: height * 0.8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    filterSection: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        marginBottom: 8,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    priceFilterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceTab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    priceTabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        marginTop: 10,
    },
    resetBtn: {
        padding: 12,
    },
    resetText: {
        fontWeight: '700',
    },
    applyBtn: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
    },
    applyText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    filterBar: {
        marginBottom: Spacing.m,
    },
    filterBarScroll: {
        paddingLeft: Spacing.l,
    },
    sortBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 8,
    },
    activeFilterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 8,
    },
    filterBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
        textTransform: 'capitalize',
    }
});
