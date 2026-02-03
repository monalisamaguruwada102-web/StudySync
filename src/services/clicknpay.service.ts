import { supabase } from './supabase';

/**
 * ClicknPay API Service (V 2.0.8)
 * Handles online payments via ClicknPay gateway
 */

export interface ClicknPayProduct {
    description: string;
    id: number;
    price: number;
    productName: string;
    quantity: number;
}

export interface ClicknPayOrderRequest {
    clientReference: string;
    currency: string;
    customerCharged: boolean;
    customerPhoneNumber: string;
    description: string;
    multiplePayments: boolean;
    productsList: ClicknPayProduct[];
    publicUniqueId: string;
    returnUrl: string;
}

export interface ClicknPayOrderResponse {
    status: string;
    paymeURL: string;
    orderDate: string;
    clientReference: string;
    [key: string]: any;
}

const API_BASE_URL = 'https://backendservices.clicknpay.africa:2081/payme/orders';

export type PaymentChannel = 'ECOCASH' | 'ONEMONEY' | 'INNBUCKS' | 'VISA' | 'MASTERCARD' | 'OMARI';

class ClicknPayService {
    /**
     * Creates a payment order and returns the payment URL or USSD response
     */
    async createOrder(order: Partial<ClicknPayOrderRequest> & { channel: PaymentChannel }): Promise<ClicknPayOrderResponse> {
        try {
            console.log('[ClicknPayService] Creating order for channel:', order.channel);

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderYpe: 'DYNAMIC',
                    multiplePayments: false,
                    currency: 'USD',
                    customerCharged: true,
                    ...order
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[ClicknPayService] API Error:', response.status, errorData);
                throw new Error(errorData.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('[ClicknPayService] Connection Error:', error);
            throw error;
        }
    }

    /**
     * Checks the status of a payment order
     */
    async checkStatus(clientReference: string): Promise<ClicknPayOrderResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/top-paid/${clientReference}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API error: ${response.status} - ${errText}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('[ClicknPayService] Status Check Error:', error);
            throw error;
        }
    }

    /**
     * Polls the status of an order until it succeeds or fails
     */
    async pollStatus(clientReference: string, maxAttempts = 12, interval = 5000): Promise<ClicknPayOrderResponse> {
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const check = async () => {
                try {
                    const status = await this.checkStatus(clientReference);
                    console.log(`[ClicknPayService] Polling ${clientReference} (Attempt ${attempts}):`, status.status);

                    if (status.status === 'PAID' || status.status === 'SUCCESS') {
                        resolve(status);
                    } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
                        reject(new Error(`Payment ${status.status.toLowerCase()}`));
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Payment verification timed out. Please check your app later.'));
                    } else {
                        attempts++;
                        setTimeout(check, interval);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            check();
        });
    }

    /**
     * Utility: Generate a unique client reference
     */
    generateReference(): string {
        return 'BRD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    }
}

export const clicknpayService = new ClicknPayService();
