import { apiClient } from './client';
import { RentWallet, APIResponse } from '@/types';

export interface DepositData {
  amount: number;
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer';
  phoneNumber?: string;
}

export interface WithdrawData {
  amount: number;
  reason?: string;
}

export const walletAPI = {
  getWallet: async (): Promise<APIResponse<RentWallet>> => {
    return apiClient.get('/rent-wallets/my-wallet');
  },

  deposit: async (data: DepositData): Promise<APIResponse<any>> => {
    return apiClient.post('/rent-wallets/deposit', data);
  },

  withdraw: async (data: WithdrawData): Promise<APIResponse<any>> => {
    return apiClient.post('/rent-wallets/withdraw', data);
  },

  getTransactions: async (page = 1, limit = 20): Promise<any> => {
    return apiClient.get(`/rent-wallets/transactions?page=${page}&limit=${limit}`);
  },

  updateAutoSave: async (enabled: boolean, amount?: number, frequency?: string): Promise<APIResponse<RentWallet>> => {
    return apiClient.patch('/rent-wallets/auto-save', { enabled, amount, frequency });
  },
};
