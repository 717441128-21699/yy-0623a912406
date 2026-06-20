import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import RiskCard from '@/components/RiskCard';
import { mockOrders } from '@/data/mockOrders';
import type { OrderInfo, RiskLevel } from '@/types/order';

const filterOptions: { key: RiskLevel | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'high', label: '高风险' },
  { key: 'medium', label: '中风险' },
  { key: 'low', label: '低风险' }
];

const RiskAlertPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<RiskLevel | 'all'>('all');
  const [riskOrders, setRiskOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRiskOrders = () => {
    setLoading(true);
    setTimeout(() => {
      const riskList = mockOrders.filter(o => o.riskLevel !== 'none');
      let result = [...riskList];
      if (activeFilter !== 'all') {
        result = result.filter(o => o.riskLevel === activeFilter);
      }
      const sortOrder = { high: 0, medium: 1, low: 2 };
      result.sort((a, b) => sortOrder[a.riskLevel] - sortOrder[b.riskLevel]);
      setRiskOrders(result);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadRiskOrders();
  }, [activeFilter]);

  useDidShow(() => {
    loadRiskOrders();
  });

  usePullDownRefresh(handlePullDownRefresh);

  function handlePullDownRefresh() {
    loadRiskOrders();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 500);
  }

  const getRiskCount = (level: RiskLevel) => {
    return mockOrders.filter(o => o.riskLevel === level).length;
  };

  const handleFilterClick = (key: RiskLevel | 'all') => {
    setActiveFilter(key);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>风险提醒</Text>
        <Text className={styles.headerSubtitle}>实时监控冷链车辆供电安全</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={`${styles.statCard} ${styles.high}`}>
          <Text className={styles.statNum}>{getRiskCount('high')}</Text>
          <Text className={styles.statLabel}>高风险</Text>
        </View>
        <View className={`${styles.statCard} ${styles.medium}`}>
          <Text className={styles.statNum}>{getRiskCount('medium')}</Text>
          <Text className={styles.statLabel}>中风险</Text>
        </View>
        <View className={`${styles.statCard} ${styles.low}`}>
          <Text className={styles.statNum}>{getRiskCount('low')}</Text>
          <Text className={styles.statLabel}>低风险</Text>
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

      <ScrollView scrollY className={styles.list}>
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>风险订单</Text>
          <Text className={styles.listCount}>共 {riskOrders.length} 单</Text>
        </View>

        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        ) : riskOrders.length > 0 ? (
          riskOrders.map(order => (
            <RiskCard key={order.id} order={order} />
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>✅</Text>
            <Text className={styles.emptyTitle}>暂无风险订单</Text>
            <Text className={styles.emptyDesc}>所有车辆运行正常</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RiskAlertPage;
