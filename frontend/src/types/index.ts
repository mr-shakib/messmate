// User Types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Mess Types
export type MemberRole = 'Owner' | 'Admin' | 'Member';

export interface MemberInfo {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: Date;
}

export interface Mess {
  id: string;
  name: string;
  memberLimit: number;
  description?: string;
  inviteCode: string;
  members: MemberInfo[];
  createdAt: Date;
  updatedAt: Date;
}

// Money Collection Types
export interface MoneyCollection {
  id: string;
  messId: string;
  member: UserBasicInfo;
  amount: number;
  date: Date;
  description: string;
  collectedBy: UserBasicInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionDTO {
  messId: string;
  memberId: string;
  amount: number;
  date: Date;
  description?: string;
}

export interface CollectionFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  memberId?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

// Expense Types
export type ExpenseCategory = 'Groceries' | 'Utilities' | 'Rent' | 'Food' | 'Entertainment' | 'Other';
export type SplitMethod = 'equal' | 'unequal' | 'percentage';

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

export interface ExpenseSplit {
  userId: string;
  amount?: number;
  percentage?: number;
}

export interface SplitInfo {
  user: UserBasicInfo;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  messId: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  paidBy: UserBasicInfo;
  splitMethod: SplitMethod;
  splits: SplitInfo[];
  createdBy: UserBasicInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  category?: ExpenseCategory;
  memberId?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Balance Types
export type BalanceStatus = 'owed' | 'owes' | 'settled';

export interface BalanceResponse {
  userId: string;
  userName: string;
  balance: number;
  status: BalanceStatus;
}

export interface TransactionInfo {
  type: 'expense' | 'settlement';
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface BalanceBreakdown {
  userId: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
  transactions: TransactionInfo[];
}

// Settlement Types
export interface Settlement {
  id: string;
  messId: string;
  fromUser: UserBasicInfo;
  toUser: UserBasicInfo;
  amount: number;
  description?: string;
  createdAt: Date;
}

export interface SettlementSuggestion {
  fromUser: UserBasicInfo;
  toUser: UserBasicInfo;
  amount: number;
}

export interface SettlementFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

export interface CreateSettlementDTO {
  messId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
}

// UI Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

// Dashboard Types
export interface CategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
}

export interface MemberAnalytics {
  userId: string;
  userName: string;
  totalPaid: number;
  totalShare: number;
  balance: number;
}

export interface DashboardResponse {
  currentMonthTotal: number;
  userBalance: number;
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: TransactionInfo[];
  memberAnalytics?: MemberAnalytics[];
}
