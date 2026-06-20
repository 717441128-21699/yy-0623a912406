import React, { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import { mockOrders } from '@/data/mockOrders';
import type { OrderInfo, OrderStatus } from '@/types/order';

const filterOptions: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'transit', label: '运输中' },
  { key: 'arrived', label: '已到店' },
  { key: 'confirmed', label: '已确认' }
];

const OrderQueryPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    setTimeout(() => {
      let result = [...mockOrders];
      if (searchText.trim()) {
        const keyword = searchText.trim().toLowerCase();
        result = result.filter(
          o => o.orderNo.toLowerCase().includes(keyword) ||
            o.vehicleNo.toLowerCase().includes(keyword)
        );
      }
      if (activeFilter !== 'all') {
        result = result.filter(o => o.orderStatus === activeFilter);
      }
      setOrders(result);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadOrders();
  }, [searchText, activeFilter]);

  useDidShow(() => {
    loadOrders();
  });

  usePullDownRefresh(handlePullDownRefresh);

  function handlePullDownRefresh() {
    loadOrders();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 500);
  }

  const handleScan = () => {
    Taro.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        setSearchText(res.result);
      },
      fail: (err) => {
        console.error('[Scan fail:', err);
      }
    });
  };

  const handleFilterClick = (key: OrderStatus | 'all') => {
    setActiveFilter(key);
  };

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
            />
          </View>
          <View className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanIcon}>📷</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterTabs}>
        {filterOptions.map(opt => (
          <View
            key={opt.key}
            className={`${styles.filterTab} ${activeFilter === opt.key ? styles.active : ''}`}
            onClick={() => handleFilterClick(opt.key)}
          >
            <Text className={styles.tabText}>{opt.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        scrollY
        className={styles.list}
      >
        <View className={styles.listTitle}>
          <Text className={styles.listTitleText}>订单列表</Text>
          <Text className={styles.listCount}>共 {orders.length} 单</Text>
        </View>

        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : orders.length > 0 ? (
          orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📦</Text>
            <Text className={styles.emptyText}>暂无相关订单</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrderQueryPage;
