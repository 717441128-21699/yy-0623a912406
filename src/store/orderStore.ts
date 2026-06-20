import { create } from 'zustand';
import type { ConfirmRecord } from '@/types/order';

interface OrderStore {
  confirmRecords: Record<string, ConfirmRecord>;
  searchedOrderNo: string;
  hasSearched: boolean;
  setConfirmRecord: (orderId: string, record: ConfirmRecord) => void;
  getConfirmRecord: (orderId: string) => ConfirmRecord | undefined;
  setSearchedOrderNo: (orderNo: string) => void;
  setHasSearched: (value: boolean) => void;
  clearSearch: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  confirmRecords: {},
  searchedOrderNo: '',
  hasSearched: false,

  setConfirmRecord: (orderId, record) => {
    console.log('[OrderStore] setConfirmRecord:', { orderId, record });
    set((state) => ({
      confirmRecords: {
        ...state.confirmRecords,
        [orderId]: record
      }
    }));
  },

  getConfirmRecord: (orderId) => {
    return get().confirmRecords[orderId];
  },

  setSearchedOrderNo: (orderNo) => {
    console.log('[OrderStore] setSearchedOrderNo:', orderNo);
    set({ searchedOrderNo: orderNo, hasSearched: true });
  },

  setHasSearched: (value) => {
    set({ hasSearched: value });
  },

  clearSearch: () => {
    set({ searchedOrderNo: '', hasSearched: false });
  }
}));
