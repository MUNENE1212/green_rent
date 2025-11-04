import { apiClient } from './client';
import { RentWallet, APIResponse } from '@/types';

export interface DepositData {
  amount: number;
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer';
  phoneNumber?: string;
}

export interface MpesaDepositData {
  amount: number;
  phoneNumber: string;
}

export interface WithdrawData {
  amount: number;
  reason?: string;
}

export interface PaymentStatusResponse {
  status: string;
  amount: number;
  mpesaReceiptNumber?: string;
  completedAt?: string;
  resultCode?: string;
  resultDesc?: string;
}

export const walletAPI = {
  getWallet: async (): Promise<APIResponse<RentWallet>> => {
    return apiClient.get('/rent-wallets/me');
  },

  deposit: async (data: DepositData): Promise<APIResponse<any>> => {
    return apiClient.post('/rent-wallets/deposit', data);
  },

  // M-Pesa specific deposit - initiates STK Push
  depositViaMpesa: async (data: MpesaDepositData): Promise<APIResponse<{
    checkoutRequestId: string;
    merchantRequestId: string;
    customerMessage: string;
    paymentId: string;
  }>> => {
    return apiClient.post('/mpesa/deposit', data);
  },

  // Query M-Pesa payment status
  queryPaymentStatus: async (paymentId: string): Promise<APIResponse<PaymentStatusResponse>> => {
    return apiClient.get(`/mpesa/payments/${paymentId}/status`);
  },

  // Get payment details
  getPayment: async (paymentId: string): Promise<APIResponse<any>> => {
    return apiClient.get(`/mpesa/payments/${paymentId}`);
  },

  // Get user's payment history
  getPayments: async (params?: {
    status?: string;
    type?: string;
    limit?: number;
    page?: number;
  }): Promise<APIResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    return apiClient.get(`/mpesa/payments/my-payments${queryString ? `?${queryString}` : ''}`);
  },

  withdraw: async (data: WithdrawData): Promise<APIResponse<any>> => {
    return apiClient.post('/rent-wallets/withdraw', data);
  },

  getTransactions: async (page = 1, limit = 20): Promise<any> => {
    // Transactions are included in the wallet object, not a separate endpoint
    return { data: [] };
  },

  updateAutoSave: async (enabled: boolean, amount?: number, frequency?: string): Promise<APIResponse<RentWallet>> => {
    return apiClient.patch('/rent-wallets/auto-save', { enabled, amount, frequency });
  },
};
