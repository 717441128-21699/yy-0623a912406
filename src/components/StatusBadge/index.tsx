import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { getStatusColor, getStatusBgColor } from '@/utils/format';

interface StatusBadgeProps {
  text: string;
  status: 'normal' | 'warning' | 'error' | 'info' | string;
  size?: 'small' | 'medium';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ text, status, size = 'medium' }) => {
  const color = getStatusColor(status as any) || '#86909c';
  const bgColor = getStatusBgColor(status as any) || 'rgba(134, 144, 156, 0.1)';

  return (
    <View
      className={`${styles.badge} ${size === 'small' ? styles.small : ''}`}
      style={{ backgroundColor: bgColor, color }}
    >
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default StatusBadge;
