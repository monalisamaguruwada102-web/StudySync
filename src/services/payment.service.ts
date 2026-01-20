import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

export type TransactionStatus = 'pending' | 'paid' | 'rejected' | 'failed' | 'cancelled';

export interface ManualTransaction {
    id: string;
    userId: string;
    userName?: string;
    amount: number;
    reference: string;
    serviceName: string; // e.g. "Listing Boost" or "Room Booking"
    date: number;
    status: TransactionStatus;
    paymentMethod: 'whatsapp_manual';
    propertyId?: string;
    phoneNumber?: string;
}

class PaymentService {
    // Admin WhatsApp number (provided by user or placeholder)
    private readonly ADMIN_WHATSAPP = '263789932832';
    private readonly ECOCASH_NUMBER = '0789 932 832';
    private readonly ECOCASH_NAME = 'Josh Boarding App Payments';

    getManualPaymentInstructions() {
        return {
            method: 'EcoCash',
            number: this.ECOCASH_NUMBER,
            name: this.ECOCASH_NAME,
            instructions: 'Send the exact amount to the number above and use the Reference provided.'
        };
    }

    /**
     * Generates a unique reference for a transaction
     */
    generateReference(prefix: string = 'REF'): string {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Opens WhatsApp with a pre-filled message for payment
     */
    async openWhatsAppPayment(reference: string, amount: number, serviceName: string) {
        const message = `Hi, I've made a payment for:\n\n` +
            `🔹 *Service:* ${serviceName}\n` +
            `🔹 *Amount:* $${amount}\n` +
            `🔹 *Ref:* ${reference}\n\n` +
            `Please verify my payment.`;

        const encodedMessage = encodeURIComponent(message);
        const url = `whatsapp://send?phone=${this.ADMIN_WHATSAPP}&text=${encodedMessage}`;
        const fallbackUrl = `https://wa.me/${this.ADMIN_WHATSAPP}?text=${encodedMessage}`;

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(fallbackUrl);
            }
        } catch (error) {
            console.error('[PaymentService] Error opening WhatsApp:', error);
            await Linking.openURL(fallbackUrl);
        }
    }

    /**
     * Saves a manual transaction as 'pending'
     */
    async submitManualPayment(userId: string, transaction: Omit<ManualTransaction, 'id' | 'userId' | 'date' | 'status' | 'paymentMethod'>) {
        try {
            const newTransaction: ManualTransaction = {
                ...transaction,
                id: `TX-${Date.now()}`,
                userId,
                date: Date.now(),
                status: 'pending',
                paymentMethod: 'whatsapp_manual'
            };

            const key = `transactions_${userId}`;
            const stored = await AsyncStorage.getItem(key);
            const transactions = stored ? JSON.parse(stored) : [];
            transactions.push(newTransaction);
            await AsyncStorage.setItem(key, JSON.stringify(transactions));

            // Also save to a global pending list for admin viewing (simulation)
            const globalKey = '@admin_pending_transactions';
            const globalStored = await AsyncStorage.getItem(globalKey);
            const globalTransactions = globalStored ? JSON.parse(globalStored) : [];
            globalTransactions.push(newTransaction);
            await AsyncStorage.setItem(globalKey, JSON.stringify(globalTransactions));

            return newTransaction;
        } catch (error) {
            console.error('[PaymentService] Submit manual payment error:', error);
            throw error;
        }
    }

    /**
     * Future-proofing: Placeholder for real gateway integration
     * This can be replaced by Paynow/ContiPay logic later
     */
    async initiateGatewayPayment(amount: number, reference: string) {
        console.log('Gateway integration point - currently defaulting to WhatsApp MVP');
        // Logic for real API calls would go here
    }

    async getTransactionHistory(userId: string): Promise<ManualTransaction[]> {
        try {
            const key = `transactions_${userId}`;
            const stored = await AsyncStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[PaymentService] Get history error:', error);
            return [];
        }
    }
}

export const paymentService = new PaymentService();
