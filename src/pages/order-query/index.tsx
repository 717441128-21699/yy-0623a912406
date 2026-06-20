import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import { mockOrders } from '@/data/mockOrders';
import { useOrderStore } from '@/store/orderStore';
import type { OrderInfo, RecentQueryItem } from '@/types/order';

const EMPTY_SCAN_MARK = '__EMPTY_SCAN_RESULT__';

const OrderQueryPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isEmptyScan, setIsEmptyScan] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  const {
    hasSearched,
    searchedOrderNo,
    searchFailed,
    recentQueries,
    setSearchedOrderNo,
    clearSearch,
    addRecentQuery,
    removeRecentQuery,
    clearRecentQueries
  } = useOrderStore(state => ({
    hasSearched: state.hasSearched,
    searchedOrderNo: state.searchedOrderNo,
    searchFailed: state.searchFailed,
    recentQueries: state.recentQueries,
    setSearchedOrderNo: state.setSearchedOrderNo,
    clearSearch: state.clearSearch,
    addRecentQuery: state.addRecentQuery,
    removeRecentQuery: state.removeRecentQuery,
    clearRecentQueries: state.clearRecentQueries
  }));

  const formatQueryTime = (timeStr: string) => {
    const now = new Date();
    const t = new Date(timeStr);
    const diffMs = now.getTime() - t.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return t.toLocaleDateString('zh-CN').replace(/\//g, '-');
  };

  const doExactSearch = useCallback((keyword: string) => {
    const trimmedKeyword = keyword.trim();

    setLoading(true);
    setSearchError('');
    setIsEmptyScan(false);

    setTimeout(() => {
      const upperKeyword = trimmedKeyword.toUpperCase();
      const matched = mockOrders.filter(o =>
        o.orderNo.toUpperCase() === upperKeyword
      );

      if (matched.length === 0) {
        setOrders([]);
        setSearchError(`未找到运单号"${trimmedKeyword}"相关的车辆信息`);
        setSearchedOrderNo(trimmedKeyword, true);
      } else {
        setOrders(matched);
        setSearchError('');
        setSearchedOrderNo(trimmedKeyword, false);

        matched.forEach(order => {
          const item: RecentQueryItem = {
            orderNo: order.orderNo,
            orderId: order.id,
            vehicleNo: '',
            matched: true,
            queryTime: new Date().toISOString()
          };
          addRecentQuery(item);
        });
      }

      setLoading(false);
    }, 300);
  }, [setSearchedOrderNo, addRecentQuery]);

  useEffect(() => {
    if (hasSearched && searchedOrderNo) {
      if (searchedOrderNo === EMPTY_SCAN_MARK) {
        setSearchText('');
        setOrders([]);
        setSearchError('未获取到有效扫码内容，请重试');
        setIsEmptyScan(true);
      } else {
        setSearchText(searchedOrderNo);
        doExactSearch(searchedOrderNo);
      }
    }
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (isInitialMount.current) return;

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = searchText.trim();

    if (trimmed === '') {
      if (!isEmptyScan && !searchFailed) {
        setOrders([]);
        setSearchError('');
      }
      return;
    }

    setIsEmptyScan(false);
    searchTimerRef.current = setTimeout(() => {
      doExactSearch(searchText);
    }, 500);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchText, doExactSearch, isEmptyScan, searchFailed]);

  useDidShow(() => {
    if (hasSearched && searchedOrderNo && searchedOrderNo !== EMPTY_SCAN_MARK) {
      doExactSearch(searchedOrderNo);
    }
  });

  usePullDownRefresh(handlePullDownRefresh);

  function handlePullDownRefresh() {
    if (hasSearched && searchedOrderNo && searchedOrderNo !== EMPTY_SCAN_MARK) {
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
          setIsEmptyScan(true);
          setSearchedOrderNo(EMPTY_SCAN_MARK, true);
          return;
        }

        setSearchText(scanResult);
        setIsEmptyScan(false);

        const upperScan = scanResult.toUpperCase();
        const matched = mockOrders.find(o =>
          o.orderNo.toUpperCase() === upperScan
        );

        if (matched) {
          console.log('[OrderQuery] scan matched, navigate to detail:', matched.orderNo);
          setOrders([matched]);
          setSearchError('');
          setSearchedOrderNo(scanResult, false);
          addRecentQuery({
            orderNo: matched.orderNo,
            orderId: matched.id,
            vehicleNo: '',
            matched: true,
            queryTime: new Date().toISOString()
          });
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
    setIsEmptyScan(false);
    clearSearch();
  };

  const handleRecentClick = (orderNo: string) => {
    setSearchText(orderNo);
    doExactSearch(orderNo);
  };

  const handleRecentRemove = (e: React.MouseEvent, orderNo: string) => {
    e.stopPropagation();
    removeRecentQuery(orderNo);
  };

  const handleClearRecentAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showModal({
      title: '清空记录',
      content: '确定清空所有最近查询记录吗？',
      success: (res) => {
        if (res.confirm) {
          clearRecentQueries();
        }
      }
    });
  };

  const shouldShowEmpty = (hasSearched || searchFailed || isEmptyScan) && orders.length === 0 && !loading;
  const shouldShowInitial = !hasSearched && !searchFailed && !isEmptyScan && !loading;
  const shouldShowResults = hasSearched && !searchFailed && !isEmptyScan && orders.length > 0 && !loading;

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

            {recentQueries.length > 0 && (
              <View className={styles.recentSection}>
                <View className={styles.recentHeader}>
                  <Text className={styles.recentTitle}>最近查询</Text>
                  <View className={styles.recentClearAll} onClick={handleClearRecentAll}>
                    <Text className={styles.recentClearAllText}>清空</Text>
                  </View>
                </View>
                <View className={styles.recentList}>
                  {recentQueries.map(item => (
                    <View
                      key={item.orderNo}
                      className={styles.recentItem}
                      onClick={() => handleRecentClick(item.orderNo)}
                    >
                      <View className={styles.recentIcon}>📋</View>
                      <View className={styles.recentContent}>
                        <Text className={styles.recentOrderNo}>{item.orderNo}</Text>
                        <Text className={styles.recentTime}>{formatQueryTime(item.queryTime)}</Text>
                      </View>
                      <View
                        className={styles.recentRemove}
                        onClick={(e) => handleRecentRemove(e, item.orderNo)}
                      >
                        <Text className={styles.recentRemoveText}>×</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
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
            <View className={styles.emptyClearBtn} onClick={handleClearSearch}>
              <Text className={styles.emptyClearBtnText}>清空查询，重新开始</Text>
            </View>
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
