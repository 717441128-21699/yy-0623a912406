import { create } from 'zustand';
import type { ConfirmRecord } from '@/types/order';

const STORAGE_KEY_CONFIRM = 'cold_chain_confirm_records_v1';
const STORAGE_KEY_SEARCH = 'cold_chain_search_state_v1';

const loadConfirmRecordsFromStorage = (): Record<string, ConfirmRecord> => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIRM);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.warn('[OrderStore] Failed to load confirm records from storage:', e);
  }
  return {};
};

const saveConfirmRecordsToStorage = (records: Record<string, ConfirmRecord>) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CONFIRM, JSON.stringify(records));
    }
  } catch (e) {
    console.warn('[OrderStore] Failed to save confirm records to storage:', e);
  }
};

const loadSearchStateFromStorage = (): { searchedOrderNo: string; hasSearched: boolean } => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_SEARCH);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.warn('[OrderStore] Failed to load search state from storage:', e);
  }
  return { searchedOrderNo: '', hasSearched: false };
};

const saveSearchStateToStorage = (state: { searchedOrderNo: string; hasSearched: boolean }) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SEARCH, JSON.stringify(state));
    }
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
  searchFailed: false,

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
    const newState = { searchedOrderNo: orderNo, hasSearched: true, searchFailed: failed };
    set(newState);
    saveSearchStateToStorage({ searchedOrderNo: orderNo, hasSearched: true });
  },

  setHasSearched: (value) => {
    set({ hasSearched: value });
    saveSearchStateToStorage({ searchedOrderNo: get().searchedOrderNo, hasSearched: value });
  },

  setSearchFailed: (value) => {
    set({ searchFailed: value });
  },

  clearSearch: () => {
    set({ searchedOrderNo: '', hasSearched: false, searchFailed: false });
    saveSearchStateToStorage({ searchedOrderNo: '', hasSearched: false });
  }
}));
