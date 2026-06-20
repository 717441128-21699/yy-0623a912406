import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  ConfirmRecord,
  RecentQueryItem,
  RiskAlertFilter
} from '@/types/order';

const STORAGE_KEY_CONFIRM = 'cold_chain_confirm_records_v2';
const STORAGE_KEY_SEARCH = 'cold_chain_search_state_v2';
const STORAGE_KEY_RECENT = 'cold_chain_recent_queries_v1';
const STORAGE_KEY_FILTER = 'cold_chain_risk_filter_v1';

interface SearchState {
  searchedOrderNo: string;
  hasSearched: boolean;
  searchFailed: boolean;
}

const loadConfirmRecordsFromStorage = (): Record<string, ConfirmRecord> => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_CONFIRM);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[OrderStore] Failed to load confirm records:', e);
  }
  return {};
};

const saveConfirmRecordsToStorage = (records: Record<string, ConfirmRecord>) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_CONFIRM, JSON.stringify(records));
  } catch (e) {
    console.warn('[OrderStore] Failed to save confirm records:', e);
  }
};

const loadSearchStateFromStorage = (): SearchState => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_SEARCH);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        searchedOrderNo: parsed.searchedOrderNo || '',
        hasSearched: !!parsed.hasSearched,
        searchFailed: !!parsed.searchFailed
      };
    }
  } catch (e) {
    console.warn('[OrderStore] Failed to load search state:', e);
  }
  return { searchedOrderNo: '', hasSearched: false, searchFailed: false };
};

const saveSearchStateToStorage = (state: SearchState) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_SEARCH, JSON.stringify(state));
  } catch (e) {
    console.warn('[OrderStore] Failed to save search state:', e);
  }
};

const loadRecentQueriesFromStorage = (): RecentQueryItem[] => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_RECENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item: RecentQueryItem) => item && item.matched && item.orderNo
        );
      }
    }
  } catch (e) {
    console.warn('[OrderStore] Failed to load recent queries:', e);
  }
  return [];
};

const saveRecentQueriesToStorage = (queries: RecentQueryItem[]) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_RECENT, JSON.stringify(queries));
  } catch (e) {
    console.warn('[OrderStore] Failed to save recent queries:', e);
  }
};

const loadRiskFilterFromStorage = (): RiskAlertFilter => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_FILTER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[OrderStore] Failed to load risk filter:', e);
  }
  return { carrier: 'all', backupPlan: 'all' };
};

const saveRiskFilterToStorage = (filter: RiskAlertFilter) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_FILTER, JSON.stringify(filter));
  } catch (e) {
    console.warn('[OrderStore] Failed to save risk filter:', e);
  }
};

interface OrderStore {
  confirmRecords: Record<string, ConfirmRecord>;
  searchedOrderNo: string;
  hasSearched: boolean;
  searchFailed: boolean;
  recentQueries: RecentQueryItem[];
  riskFilter: RiskAlertFilter;

  setConfirmRecord: (orderId: string, record: ConfirmRecord) => void;
  getConfirmRecord: (orderId: string) => ConfirmRecord | undefined;

  setSearchedOrderNo: (orderNo: string, failed?: boolean) => void;
  setHasSearched: (value: boolean) => void;
  setSearchFailed: (value: boolean) => void;
  clearSearch: () => void;

  addRecentQuery: (item: RecentQueryItem) => void;
  removeRecentQuery: (orderNo: string) => void;
  clearRecentQueries: () => void;

  setRiskFilter: (filter: Partial<RiskAlertFilter>) => void;
  resetRiskFilter: () => void;
}

const initialSearchState = loadSearchStateFromStorage();
const initialRecentQueries = loadRecentQueriesFromStorage();
const initialRiskFilter = loadRiskFilterFromStorage();

export const useOrderStore = create<OrderStore>((set, get) => ({
  confirmRecords: loadConfirmRecordsFromStorage(),
  searchedOrderNo: initialSearchState.searchedOrderNo,
  hasSearched: initialSearchState.hasSearched,
  searchFailed: initialSearchState.searchFailed,
  recentQueries: initialRecentQueries,
  riskFilter: initialRiskFilter,

  setConfirmRecord: (orderId, record) => {
    console.log('[OrderStore] setConfirmRecord:', { orderId, record });
    const newRecords = {
      ...get().confirmRecords,
      [orderId]: record
    };
    set({ confirmRecords: newRecords });
    saveConfirmRecordsToStorage(newRecords);
  },

  getConfirmRecord: (orderId) => {
    return get().confirmRecords[orderId];
  },

  setSearchedOrderNo: (orderNo, failed = false) => {
    console.log('[OrderStore] setSearchedOrderNo:', { orderNo, failed });
    const newState: SearchState = {
      searchedOrderNo: orderNo,
      hasSearched: true,
      searchFailed: failed
    };
    set(newState);
    saveSearchStateToStorage(newState);
  },

  setHasSearched: (value) => {
    const newState = {
      searchedOrderNo: get().searchedOrderNo,
      hasSearched: value,
      searchFailed: get().searchFailed
    };
    set({ hasSearched: value });
    saveSearchStateToStorage(newState);
  },

  setSearchFailed: (value) => {
    const newState = {
      searchedOrderNo: get().searchedOrderNo,
      hasSearched: get().hasSearched,
      searchFailed: value
    };
    set({ searchFailed: value });
    saveSearchStateToStorage(newState);
  },

  clearSearch: () => {
    const newState: SearchState = {
      searchedOrderNo: '',
      hasSearched: false,
      searchFailed: false
    };
    set(newState);
    saveSearchStateToStorage(newState);
  },

  addRecentQuery: (item) => {
    if (!item.matched || !item.orderNo) return;
    console.log('[OrderStore] addRecentQuery:', item);

    const current = get().recentQueries.filter(q => q.orderNo !== item.orderNo);
    const next = [item, ...current].slice(0, 10);

    set({ recentQueries: next });
    saveRecentQueriesToStorage(next);
  },

  removeRecentQuery: (orderNo) => {
    const next = get().recentQueries.filter(q => q.orderNo !== orderNo);
    set({ recentQueries: next });
    saveRecentQueriesToStorage(next);
  },

  clearRecentQueries: () => {
    set({ recentQueries: [] });
    saveRecentQueriesToStorage([]);
  },

  setRiskFilter: (filter) => {
    const next = { ...get().riskFilter, ...filter };
    console.log('[OrderStore] setRiskFilter:', next);
    set({ riskFilter: next });
    saveRiskFilterToStorage(next);
  },

  resetRiskFilter: () => {
    const defaultFilter: RiskAlertFilter = { carrier: 'all', backupPlan: 'all' };
    set({ riskFilter: defaultFilter });
    saveRiskFilterToStorage(defaultFilter);
  }
}));
