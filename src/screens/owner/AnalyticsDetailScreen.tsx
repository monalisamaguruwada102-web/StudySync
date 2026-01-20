import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Eye, Heart, Star, TrendingUp, BarChart2 } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { analyticsService } from '../../services/analytics.service';

const { width } = Dimensions.get('window');

export const AnalyticsDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { listing } = route.params;
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [stats, setStats] = useState({ views: 0, saves: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const data = await analyticsService.getListingStats(listing.id);
            setStats(data);
        };
        fetchStats();
    }, [listing.id]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.listingInfo, { backgroundColor: colors.surface }, shadows.soft]}>
                    <Text style={[styles.propertyName, { color: colors.text }]}>{listing.propertyName || listing.title}</Text>
                    <Text style={[styles.location, { color: colors.textLight }]}>{listing.location}</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statBox, { backgroundColor: colors.surface }, shadows.soft]}>
                        <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                            <Eye size={24} color="#3b82f6" />
                        </View>
                        <Text style={[styles.statVal, { color: colors.text }]}>{stats.views}</Text>
                        <Text style={[styles.statLabel, { color: colors.textLight }]}>Total Views</Text>
                    </View>

                    <View style={[styles.statBox, { backgroundColor: colors.surface }, shadows.soft]}>
                        <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                            <Heart size={24} color="#ef4444" />
                        </View>
                        <Text style={[styles.statVal, { color: colors.text }]}>{stats.saves}</Text>
                        <Text style={[styles.statLabel, { color: colors.textLight }]}>Wishlist Saves</Text>
                    </View>
                </View>

                <View style={[styles.chartCard, { backgroundColor: colors.surface }, shadows.soft]}>
                    <View style={styles.cardHeader}>
                        <BarChart2 size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Performance</Text>
                    </View>

                    {/* Mock Chart Visualization */}
                    <View style={styles.chartPlaceholder}>
                        {[40, 65, 30, 85, 45, 70, 55].map((h, i) => (
                            <View key={i} style={styles.barContainer}>
                                <View style={[styles.bar, { height: h, backgroundColor: colors.primary }]} />
                                <Text style={[styles.barLabel, { color: colors.textLight }]}>
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={[styles.insightsCard, { backgroundColor: colors.primaryLight }]}>
                    <View style={styles.insightHeader}>
                        <TrendingUp size={20} color={colors.primary} />
                        <Text style={[styles.insightTitle, { color: colors.primary }]}>Growth Insight</Text>
                    </View>
                    <Text style={[styles.insightText, { color: colors.text }]}>
                        Your property had **15% more views** this week compared to the last. Students are most active on **Thursdays**.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.m,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        ...Typography.h2,
        fontSize: 18,
    },
    scrollContent: {
        padding: Spacing.l,
    },
    listingInfo: {
        padding: 20,
        borderRadius: 24,
        marginBottom: Spacing.l,
    },
    propertyName: {
        fontSize: 18,
        fontWeight: '800',
    },
    location: {
        fontSize: 14,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.l,
    },
    statBox: {
        width: (width - Spacing.l * 2 - 16) / 2,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statVal: {
        fontSize: 24,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    chartCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: Spacing.l,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    chartPlaceholder: {
        height: 120,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    barContainer: {
        alignItems: 'center',
    },
    bar: {
        width: 12,
        borderRadius: 6,
    },
    barLabel: {
        fontSize: 10,
        marginTop: 8,
        fontWeight: '700',
    },
    insightsCard: {
        padding: 20,
        borderRadius: 24,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    insightTitle: {
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 8,
    },
    insightText: {
        fontSize: 14,
        lineHeight: 22,
    },
});
