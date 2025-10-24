export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'tenant' | 'landlord' | 'admin';
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  _id: string;
  name: string;
  description: string;
  type: 'apartment' | 'house' | 'studio' | 'commercial' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  landlord: string | User;
  images: string[];
  amenities: string[];
  totalUnits: number;
  availableUnits: number;
  averageRent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  _id: string;
  property: string | Property;
  unitNumber: string;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rent: number;
  deposit: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  images: string[];
  features: string[];
  virtualTour?: {
    type: 'video' | '360' | 'images';
    url: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RentWallet {
  _id: string;
  tenant: string | User;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  savingsGoal?: number;
  autoSaveEnabled: boolean;
  autoSaveAmount?: number;
  autoSaveFrequency?: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  tenant: string | User;
  landlord?: string | User;
  property?: string | Property;
  unit?: string | Unit;
  type: 'rent' | 'deposit' | 'wallet_deposit' | 'wallet_withdrawal' | 'maintenance';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'mpesa' | 'card' | 'bank_transfer' | 'wallet';
  paymentDetails?: any;
  transactionId?: string;
  description?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  tenant: string | User;
  property: string | Property;
  unit: string | Unit;
  type: 'physical' | 'virtual';
  scheduledDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPlan {
  _id: string;
  tenant: string | User;
  unit: string | Unit;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  amount: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  nextPaymentDate: string;
  missedPayments: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
