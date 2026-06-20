import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { ConfirmRecord } from '@/types/order';

const STORAGE_KEY_CONFIRM = 'cold_chain_confirm_records_v1';
const STORAGE_KEY_SEARCH = 'cold_chain_search_state_v1';

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
    console.warn('[OrderStore] Failed to load confirm records from storage:', e);
  }
  return {};
};

const saveConfirmRecordsToStorage = (records: Record<string, ConfirmRecord>) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_CONFIRM, JSON.stringify(records));
  } catch (e) {
    console.warn('[OrderStore] Failed to save confirm records to storage:', e);
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
    console.warn('[OrderStore] Failed to load search state from storage:', e);
  }
  return { searchedOrderNo: '', hasSearched: false, searchFailed: false };
};

const saveSearchStateToStorage = (state: SearchState) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_SEARCH, JSON.stringify(state));
  } catch (e) {
    console.warn('[OrderStore] Failed to save search state to storage:', e);
  }
};

interface OrderStore {
  confirmRecords: Record<string, ConfirmRecord>;
  searchedOrderNo: string;
  hasSearched: boolean;
  searchFailed: boolean;
  setConfirmRecord: (orderId: string, record: ConfirmRecord) => void;
  getConfirmRecord: (orderId: string) => ConfirmRecord | undefined;
  setSearchedOrderNo: (orderNo: string, failed?: boolean) => void;
  setHasSearched: (value: boolean) => void;
  setSearchFailed: (value: boolean) => void;
  clearSearch: () => void;
}

const initialSearchState = loadSearchStateFromStorage();

export const useOrderStore = create<OrderStore>((set, get) => ({
  confirmRecords: loadConfirmRecordsFromStorage(),
  searchedOrderNo: initialSearchState.searchedOrderNo,
  hasSearched: initialSearchState.hasSearched,
  searchFailed: initialSearchState.searchFailed,

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
  }
}));
