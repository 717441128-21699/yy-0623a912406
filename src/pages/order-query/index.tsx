import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import { mockOrders } from '@/data/mockOrders';
import { useOrderStore } from '@/store/orderStore';
import type { OrderInfo } from '@/types/order';

const OrderQueryPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const {
    hasSearched,
    searchedOrderNo,
    setSearchedOrderNo,
    setHasSearched
  } = useOrderStore(state => ({
    hasSearched: state.hasSearched,
    searchedOrderNo: state.searchedOrderNo,
    setSearchedOrderNo: state.setSearchedOrderNo,
    setHasSearched: state.setHasSearched
  }));

  useEffect(() => {
    if (hasSearched && searchedOrderNo) {
      setSearchText(searchedOrderNo);
      doSearch(searchedOrderNo);
    }
  }, []);

  const doSearch = useCallback((keyword: string) => {
    if (!keyword.trim()) {
      setOrders([]);
      setSearchError('');
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setSearchError('');

    setTimeout(() => {
      const searchKeyword = keyword.trim().toUpperCase();
      const matched = mockOrders.filter(o =>
        o.orderNo.toUpperCase() === searchKeyword ||
        o.orderNo.toUpperCase().includes(searchKeyword) ||
        o.vehicleNo.toUpperCase().includes(searchKeyword)
      );

      if (matched.length === 0) {
        setOrders([]);
        setSearchError(`未找到运单号"${keyword.trim()}"相关的车辆信息`);
      } else {
        setOrders(matched);
        setSearchError('');
      }
      setLoading(false);
      setHasSearched(true);
      setSearchedOrderNo(keyword.trim());
    }, 300);
  }, [setHasSearched, setSearchedOrderNo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim()) {
        doSearch(searchText);
      } else {
        setOrders([]);
        setSearchError('');
        setHasSearched(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, doSearch, setHasSearched]);

  useDidShow(() => {
    if (hasSearched && searchedOrderNo) {
      doSearch(searchedOrderNo);
    }
  });

  usePullDownRefresh(handlePullDownRefresh);

  function handlePullDownRefresh() {
    if (searchText.trim()) {
      doSearch(searchText);
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
          setHasSearched(true);
          setSearchedOrderNo('');
          return;
        }

        setSearchText(scanResult);

        const matched = mockOrders.find(o =>
          o.orderNo.toUpperCase() === scanResult.toUpperCase() ||
          scanResult.toUpperCase().includes(o.orderNo.toUpperCase())
        );

        if (matched) {
          console.log('[OrderQuery] scan matched, navigate to detail:', matched.orderNo);
          Taro.navigateTo({
            url: `/pages/order-detail/index?id=${matched.id}`
          });
          setHasSearched(true);
          setSearchedOrderNo(scanResult);
        } else {
          setOrders([]);
          setSearchError(`扫码内容"${scanResult}"未匹配到任何订单`);
          setHasSearched(true);
          setSearchedOrderNo(scanResult);
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
    setHasSearched(false);
  };

  const shouldShowInitial = !hasSearched;
  const shouldShowEmpty = hasSearched && orders.length === 0 && !loading;
  const shouldShowResults = hasSearched && orders.length > 0 && !loading;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>冷链安全监控</Text>
        <View className={styles.searchBar}>
          <View className={styles.searchBox}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="请输入运单号"
              placeholderStyle="color: rgba(255,255,255,0.6)"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              confirmType="search"
              onConfirm={(e) => doSearch(e.detail.value)}
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
            <Text className={styles.initialTitle}>输入运单号或扫码查询</Text>
            <Text className={styles.initialDesc}>支持手动输入运单号或扫描装车单二维码</Text>
            <View className={styles.initialTips}>
              <Text className={styles.tipItem}>• 输入完整运单号可快速定位</Text>
              <Text className={styles.tipItem}>• 扫描装车单二维码直达详情</Text>
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
