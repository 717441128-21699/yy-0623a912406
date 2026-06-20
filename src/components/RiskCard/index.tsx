import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { formatDuration, formatTemperature } from '@/utils/format';
import type { OrderInfo } from '@/types/order';

interface RiskCardProps {
  order: OrderInfo;
  onClick?: () => void;
}

const RiskCard: React.FC<RiskCardProps> = ({ order, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/order-detail/index?id=${order.id}`
      });
    }
  };

  const getRiskLevelStyle = () => {
    switch (order.riskLevel) {
      case 'high':
        return { bg: styles.highRisk, borderColor: '#f53f3f' };
      case 'medium':
        return { bg: styles.mediumRisk, borderColor: '#ff7d00' };
      case 'low':
        return { bg: styles.lowRisk, borderColor: '#ff7d00' };
      default:
        return { bg: styles.normalRisk, borderColor: '#00b42a' };
    }
  };

  const levelStyle = getRiskLevelStyle();

  return (
    <View className={`${styles.card} ${levelStyle.bg}`} style={{ borderLeftColor: levelStyle.borderColor }} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <View className={styles.alertIcon}>!</View>
          <Text className={styles.title}>
            {order.powerStatus === 'off' ? '车辆已断电' : '温度异常波动'}
          </Text>
        </View>
        <Text className={styles.time}>
          {order.events.length > 0 ? order.events[0].startTime.slice(11) : '--'}
        </Text>
      </View>

      <View className={styles.content}>
        <Text className={styles.desc}>
          {order.handlingDescription || '正在核实情况，请稍候...'}
        </Text>
      </View>

      <View className={styles.stats}>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>断电时长</Text>
          <Text className={styles.statValue}>{formatDuration(order.powerOffDuration)}</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>最高温度</Text>
          <Text className={styles.statValue}>{formatTemperature(order.maxTemperature)}</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>运单号</Text>
          <Text className={styles.statValue}>{order.orderNo}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.hint}>点击查看详情</Text>
        <View className={styles.arrow}>›</View>
      </View>
    </View>
  );
};

export default RiskCard;
