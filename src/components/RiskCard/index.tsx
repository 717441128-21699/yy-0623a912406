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
  const advice = order.riskAdvice;

  const getConclusionText = () => {
    if (order.powerStatus === 'off') {
      return `车辆已断电 ${formatDuration(order.powerOffDuration)}`;
    }
    if (order.powerStatus === 'warning') {
      return `电压波动，断电 ${formatDuration(order.powerOffDuration)} 后已恢复`;
    }
    return `曾断电 ${formatDuration(order.powerOffDuration)}，目前运行正常`;
  };

  const getBackupPlanIcon = () => {
    if (!advice) return 'ℹ️';
    switch (advice.backupPlan) {
      case 'prepare': return '⚠️';
      case 'standby': return '💡';
      default: return '✅';
    }
  };

  return (
    <View className={`${styles.card} ${levelStyle.bg}`} style={{ borderLeftColor: levelStyle.borderColor }} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.conclusionRow}>
          <View className={styles.alertIcon}>!</View>
          <Text className={styles.conclusion}>{getConclusionText()}</Text>
        </View>
        <Text className={styles.time}>
          {order.events.length > 0 ? order.events[0].startTime.slice(11) : '--'}
        </Text>
      </View>

      {advice && (
        <View className={styles.adviceSection}>
          <View className={styles.adviceItem}>
            <Text className={styles.adviceIcon}>👤</Text>
            <View className={styles.adviceContent}>
              <Text className={styles.adviceLabel}>承运方</Text>
              <Text className={styles.adviceText}>{advice.carrierAction}</Text>
            </View>
          </View>

          <View className={styles.adviceItem}>
            <Text className={styles.adviceIcon}>⏰</Text>
            <View className={styles.adviceContent}>
              <Text className={styles.adviceLabel}>预计恢复</Text>
              <Text className={styles.adviceText}>{advice.estimatedRecoveryTime}</Text>
            </View>
          </View>

          <View className={styles.adviceItem}>
            <Text className={styles.adviceIcon}>{getBackupPlanIcon()}</Text>
            <View className={styles.adviceContent}>
              <Text className={styles.adviceLabel}>收货建议</Text>
              <Text className={styles.adviceText}>{advice.backupPlanText}</Text>
            </View>
          </View>
        </View>
      )}

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
        <Text className={styles.hint}>点击查看完整温度曲线和处置记录</Text>
        <View className={styles.arrow}>›</View>
      </View>
    </View>
  );
};

export default RiskCard;
