import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Receipt, Calendar, DollarSign, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface Transaction {
    id: string;
    propertyName: string;
    amount: number;
    date: number;
    paymentMethod: string;
    status: 'success' | 'failed';
}

export const PaymentHistoryScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            const stored = await AsyncStorage.getItem(`transactions_${user?.id}`);
            if (stored) {
                setTransactions(JSON.parse(stored).sort((a: any, b: any) => b.date - a.date));
            }
        } catch (error) {
            console.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const renderTransactionItem = ({ item }: { item: Transaction }) => (
        <View style={[styles.transactionCard, { backgroundColor: colors.surface }, shadows.soft]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Receipt size={24} color={colors.primary} />
            </View>
            <View style={styles.detailsContainer}>
                <Text style={[styles.propertyName, { color: colors.text }]}>{item.propertyName}</Text>
                <View style={styles.metaRow}>
                    <Calendar size={12} color={colors.textLight} />
                    <Text style={[styles.metaText, { color: colors.textLight }]}>
                        {new Date(item.date).toLocaleDateString()}
                    </Text>
                    <View style={styles.dot} />
                    <CreditCard size={12} color={colors.textLight} />
                    <Text style={[styles.metaText, { color: colors.textLight, textTransform: 'capitalize' }]}>
                        {item.paymentMethod}
                    </Text>
                </View>
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.amountText, { color: colors.primary }]}>${item.amount}</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
                    <Text style={[styles.statusText, { color: '#10b981' }]}>Success</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Payment History</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransactionItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Receipt size={64} color={colors.border} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
                                You haven't made any payments yet.
                            </Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: Spacing.m,
        paddingVertical: 12,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        ...Typography.h2,
        fontSize: 18,
    },
    listContent: {
        padding: Spacing.l,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailsContainer: {
        flex: 1,
    },
    propertyName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#cbd5e1',
        marginHorizontal: 8,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    }
});
