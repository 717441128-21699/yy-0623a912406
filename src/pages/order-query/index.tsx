import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import { mockOrders } from '@/data/mockOrders';
import { useOrderStore } from '@/store/orderStore';
import type { OrderInfo } from '@/types/order';

const EMPTY_MARK = '__EMPTY_SCAN_RESULT__';

const OrderQueryPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    hasSearched,
    searchedOrderNo,
    searchFailed,
    setSearchedOrderNo,
    setSearchFailed,
    clearSearch
  } = useOrderStore(state => ({
    hasSearched: state.hasSearched,
    searchedOrderNo: state.searchedOrderNo,
    searchFailed: state.searchFailed,
    setSearchedOrderNo: state.setSearchedOrderNo,
    setSearchFailed: state.setSearchFailed,
    clearSearch: state.clearSearch
  }));

  const doExactSearch = useCallback((keyword: string, fromScan = false) => {
    const trimmedKeyword = keyword.trim();
    const isEmptyScan = fromScan && trimmedKeyword === '';

    if (!isEmptyScan && trimmedKeyword === '') {
      setOrders([]);
      setSearchError('');
      clearSearch();
      return;
    }

    setLoading(true);
    setSearchError('');

    setTimeout(() => {
      let matched: OrderInfo[] = [];

      if (!isEmptyScan) {
        const upperKeyword = trimmedKeyword.toUpperCase();
        matched = mockOrders.filter(o =>
          o.orderNo.toUpperCase() === upperKeyword
        );
      }

      if (matched.length === 0) {
        setOrders([]);
        if (isEmptyScan) {
          setSearchError('未获取到有效扫码内容，请重试');
        } else {
          setSearchError(`未找到运单号"${trimmedKeyword}"相关的车辆信息`);
        }
        setSearchedOrderNo(isEmptyScan ? EMPTY_MARK : trimmedKeyword, true);
      } else {
        setOrders(matched);
        setSearchError('');
        setSearchedOrderNo(trimmedKeyword, false);
      }

      setLoading(false);
    }, 300);
  }, [clearSearch, setSearchedOrderNo]);

  useEffect(() => {
    if (hasSearched && searchedOrderNo && searchedOrderNo !== EMPTY_MARK) {
      setSearchText(searchedOrderNo);
      doExactSearch(searchedOrderNo);
    }
    if (searchedOrderNo === EMPTY_MARK) {
      setSearchText('');
      setOrders([]);
      setSearchError('未获取到有效扫码内容，请重试');
      setSearchFailed(true);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = searchText.trim();
    if (trimmed === '') {
      setOrders([]);
      setSearchError('');
      clearSearch();
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      doExactSearch(searchText);
    }, 500);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchText, doExactSearch, clearSearch]);

  useDidShow(() => {
    if (hasSearched && searchedOrderNo && searchedOrderNo !== EMPTY_MARK) {
      doExactSearch(searchedOrderNo);
    }
  });

  usePullDownRefresh(handlePullDownRefresh);

  function handlePullDownRefresh() {
    if (hasSearched && searchedOrderNo && searchedOrderNo !== EMPTY_MARK) {
      doExactSearch(searchedOrderNo);
    }
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 500);
  }

  const handleScan = () => {
    Taro.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        const scanResult = res.result?.trim() || '';
        console.log('[OrderQuery] scan result:', scanResult);

        if (!scanResult) {
          setSearchText('');
          setOrders([]);
          setSearchError('未获取到有效扫码内容，请重试');
          setSearchedOrderNo(EMPTY_MARK, true);
          return;
        }

        setSearchText(scanResult);

        const upperScan = scanResult.toUpperCase();
        const exactMatched = mockOrders.find(o =>
          o.orderNo.toUpperCase() === upperScan
        );

        const containedMatched = mockOrders.find(o =>
          upperScan.includes(o.orderNo.toUpperCase())
        );

        const matched = exactMatched || containedMatched;

        if (matched) {
          console.log('[OrderQuery] scan matched, navigate to detail:', matched.orderNo);
          setOrders([matched]);
          setSearchError('');
          setSearchedOrderNo(scanResult, false);
          Taro.navigateTo({
            url: `/pages/order-detail/index?id=${matched.id}`
          });
        } else {
          setOrders([]);
          setSearchError(`扫码内容"${scanResult}"未匹配到任何订单`);
          setSearchedOrderNo(scanResult, true);
        }
      },
      fail: (err) => {
        console.error('[OrderQuery] Scan fail:', err);
        Taro.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  };

  const handleClearSearch = () => {
    setSearchText('');
    setOrders([]);
    setSearchError('');
    clearSearch();
  };

  const shouldShowEmpty = (hasSearched || searchFailed) && orders.length === 0 && !loading;
  const shouldShowInitial = !hasSearched && !searchFailed && !loading;
  const shouldShowResults = hasSearched && !searchFailed && orders.length > 0 && !loading;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>冷链安全监控</Text>
        <View className={styles.searchBar}>
          <View className={styles.searchBox}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="请输入完整运单号"
              placeholderStyle="color: rgba(255,255,255,0.6)"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              confirmType="search"
              onConfirm={(e) => doExactSearch(e.detail.value)}
            />
            {searchText && (
              <View className={styles.clearBtn} onClick={handleClearSearch}>
                <Text className={styles.clearIcon}>×</Text>
              </View>
            )}
          </View>
          <View className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanIcon}>📷</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.list}>
        {loading && (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>查询中...</Text>
          </View>
        )}

        {shouldShowInitial && !loading && (
          <View className={styles.initial}>
            <View className={styles.initialIcon}>🔍</View>
            <Text className={styles.initialTitle}>输入完整运单号或扫码查询</Text>
            <Text className={styles.initialDesc}>请输入完整运单号精确匹配，或扫描装车单二维码</Text>
            <View className={styles.initialTips}>
              <Text className={styles.tipItem}>• 请输入完整运单号进行精确查询</Text>
              <Text className={styles.tipItem}>• 扫描装车单二维码可直接打开订单详情</Text>
              <Text className={styles.tipItem}>• 仅展示与你相关的订单信息</Text>
            </View>
          </View>
        )}

        {shouldShowEmpty && !loading && (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>❓</Text>
            <Text className={styles.emptyTitle}>未找到相关订单</Text>
            {searchError && (
              <Text className={styles.emptyDesc}>{searchError}</Text>
            )}
            <Text className={styles.emptyHint}>请检查运单号是否正确，或联系承运方核实</Text>
          </View>
        )}

        {shouldShowResults && !loading && (
          <>
            <View className={styles.listTitle}>
              <Text className={styles.listTitleText}>查询结果</Text>
              <Text className={styles.listCount}>找到 {orders.length} 条相关订单</Text>
            </View>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default OrderQueryPage;
