import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import RiskCard from '@/components/RiskCard';
import { mockOrders } from '@/data/mockOrders';
import { useOrderStore } from '@/store/orderStore';
import type { OrderInfo, RiskLevel, BackupPlan, CarrierFilter, BackupPlanFilter } from '@/types/order';

const levelOptions: { key: RiskLevel | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'high', label: '高风险' },
  { key: 'medium', label: '中风险' },
  { key: 'low', label: '低风险' }
];

const backupPlanOptions: { key: BackupPlanFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'prepare', label: '需准备备用' },
  { key: 'standby', label: '建议待命' },
  { key: 'none', label: '无需处理' }
];

const RiskAlertPage: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<RiskLevel | 'all'>('all');
  const [riskOrders, setRiskOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const { riskFilter, setRiskFilter } = useOrderStore(state => ({
    riskFilter: state.riskFilter,
    setRiskFilter: state.setRiskFilter
  }));

  const carriers = useMemo(() => {
    const set = new Set(mockOrders.filter(o => o.riskLevel !== 'none').map(o => o.carrier));
    return Array.from(set);
  }, []);

  const allRiskOrders = useMemo(() => {
    return mockOrders.filter(o => o.riskLevel !== 'none');
  }, []);

  const filteredStats = useMemo(() => {
    let list = [...allRiskOrders];

    if (riskFilter.carrier !== 'all') {
      list = list.filter(o => o.carrier === riskFilter.carrier);
    }
    if (riskFilter.backupPlan !== 'all') {
      list = list.filter(o => o.riskAdvice?.backupPlan === riskFilter.backupPlan);
    }

    return {
      high: list.filter(o => o.riskLevel === 'high').length,
      medium: list.filter(o => o.riskLevel === 'medium').length,
      low: list.filter(o => o.riskLevel === 'low').length,
      total: list.length
    };
  }, [allRiskOrders, riskFilter]);

  const loadRiskOrders = () => {
    setLoading(true);
    setTimeout(() => {
      let list = [...allRiskOrders];

      if (riskFilter.carrier !== 'all') {
        list = list.filter(o => o.carrier === riskFilter.carrier);
      }
      if (riskFilter.backupPlan !== 'all') {
        list = list.filter(o => o.riskAdvice?.backupPlan === riskFilter.backupPlan);
      }
      if (activeLevel !== 'all') {
        list = list.filter(o => o.riskLevel === activeLevel);
      }

      const sortOrder = { high: 0, medium: 1, low: 2 };
      list.sort((a, b) => sortOrder[a.riskLevel] - sortOrder[b.riskLevel]);
      setRiskOrders(list);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadRiskOrders();
  }, [activeLevel, riskFilter.carrier, riskFilter.backupPlan]);

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

  const handleLevelClick = (key: RiskLevel | 'all') => {
    setActiveLevel(key);
  };

  const handleCarrierChange = (value: CarrierFilter) => {
    setRiskFilter({ carrier: value });
  };

  const handleBackupPlanChange = (value: BackupPlanFilter) => {
    setRiskFilter({ backupPlan: value });
  };

  const isFilterActive = riskFilter.carrier !== 'all' || riskFilter.backupPlan !== 'all';

  const resetFilter = () => {
    setRiskFilter({ carrier: 'all', backupPlan: 'all' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>风险提醒</Text>
        <Text className={styles.headerSubtitle}>实时监控冷链车辆供电安全</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={`${styles.statCard} ${styles.high}`}>
          <Text className={styles.statNum}>{filteredStats.high}</Text>
          <Text className={styles.statLabel}>高风险</Text>
        </View>
        <View className={`${styles.statCard} ${styles.medium}`}>
          <Text className={styles.statNum}>{filteredStats.medium}</Text>
          <Text className={styles.statLabel}>中风险</Text>
        </View>
        <View className={`${styles.statCard} ${styles.low}`}>
          <Text className={styles.statNum}>{filteredStats.low}</Text>
          <Text className={styles.statLabel}>低风险</Text>
        </View>
      </View>

      <View className={styles.filterPanel}>
        <View className={styles.filterPanelHeader}>
          <Text className={styles.filterPanelTitle}>筛选条件</Text>
          {isFilterActive && (
            <View className={styles.filterReset} onClick={resetFilter}>
              <Text className={styles.filterResetText}>重置</Text>
            </View>
          )}
        </View>

        <View className={styles.filterRow}>
          <Text className={styles.filterLabel}>承运方</Text>
          <View className={styles.filterChips}>
            <View
              key="carrier-all"
              className={`${styles.filterChip} ${riskFilter.carrier === 'all' ? styles.chipActive : ''}`}
              onClick={() => handleCarrierChange('all')}
            >
              <Text className={styles.chipText}>全部</Text>
            </View>
            {carriers.map(carrier => (
              <View
                key={carrier}
                className={`${styles.filterChip} ${riskFilter.carrier === carrier ? styles.chipActive : ''}`}
                onClick={() => handleCarrierChange(carrier)}
              >
                <Text className={styles.chipText}>{carrier}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.filterRow}>
          <Text className={styles.filterLabel}>收货建议</Text>
          <View className={styles.filterChips}>
            {backupPlanOptions.map(opt => (
              <View
                key={opt.key}
                className={`${styles.filterChip} ${riskFilter.backupPlan === opt.key ? styles.chipActive : ''}`}
                onClick={() => handleBackupPlanChange(opt.key)}
              >
                <Text className={styles.chipText}>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {isFilterActive && (
          <View className={styles.filterSummary}>
            <Text className={styles.filterSummaryText}>
              已筛选：
              {riskFilter.carrier !== 'all' && `承运方 ${riskFilter.carrier}`}
              {riskFilter.carrier !== 'all' && riskFilter.backupPlan !== 'all' && '，'}
              {riskFilter.backupPlan !== 'all' &&
                `收货建议 ${backupPlanOptions.find(o => o.key === riskFilter.backupPlan)?.label}`}
              （共 {filteredStats.total} 单）
            </Text>
          </View>
        )}
      </View>

      <View className={styles.filterTabs}>
        {levelOptions.map(opt => (
          <View
            key={opt.key}
            className={`${styles.filterTab} ${activeLevel === opt.key ? styles.active : ''}`}
            onClick={() => handleLevelClick(opt.key)}
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
            <Text className={styles.emptyTitle}>暂无符合条件的风险订单</Text>
            <Text className={styles.emptyDesc}>
              {isFilterActive ? '请尝试调整筛选条件' : '所有车辆运行正常'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RiskAlertPage;
