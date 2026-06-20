import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { formatOrderStatus, formatTemperature, formatDuration, formatConfirmResult } from '@/utils/format';
import { useOrderStore } from '@/store/orderStore';
import type { OrderInfo } from '@/types/order';

interface OrderCardProps {
  order: OrderInfo;
  showConfirmBtn?: boolean;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, showConfirmBtn = false, onClick }) => {
  const { getConfirmRecord } = useOrderStore(state => ({
    getConfirmRecord: state.getConfirmRecord
  }));

  const confirmRecord = useMemo(() => {
    return getConfirmRecord(order.id);
  }, [order.id, getConfirmRecord]);

  const effectiveStatus = confirmRecord ? 'confirmed' as const : order.orderStatus;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/order-detail/index?id=${order.id}`
      });
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/confirm-arrival/index?id=${order.id}`
    });
  };

  const getRiskStatus = () => {
    if (order.riskLevel === 'high') return 'error';
    if (order.riskLevel === 'medium' || order.riskLevel === 'low') return 'warning';
    return 'normal';
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.orderNo}>
          <Text className={styles.label}>运单号</Text>
          <Text className={styles.no}>{order.orderNo}</Text>
        </View>
        {confirmRecord ? (
          <StatusBadge
            text={formatConfirmResult(confirmRecord.result)}
            status={confirmRecord.result === 'normal' ? 'success' : confirmRecord.result === 'pending' ? 'warning' : 'error'}
            size="small"
          />
        ) : (
          <StatusBadge
            text={formatOrderStatus(order.orderStatus)}
            status={order.orderStatus === 'transit' ? 'info' : 'normal'}
            size="small"
          />
        )}
      </View>

      <View className={styles.route}>
        <View className={styles.point}>
          <View className={styles.dotStart} />
          <Text className={styles.address}>{order.origin}</Text>
        </View>
        <View className={styles.line} />
        <View className={styles.point}>
          <View className={styles.dotEnd} />
          <Text className={styles.address}>{order.destination}</Text>
        </View>
      </View>

      <View className={styles.info}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>车牌号</Text>
          <Text className={styles.infoValue}>{order.vehicleNo}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>当前温度</Text>
          <Text className={`${styles.infoValue} ${styles.temp}`}>
            {formatTemperature(order.currentTemp)}
          </Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>目标温度</Text>
          <Text className={styles.infoValue}>{formatTemperature(order.targetTemp)}</Text>
        </View>
      </View>

      {order.powerOffDuration > 0 && (
        <View className={styles.riskBar}>
          <View className={styles.riskDot} />
          <Text className={styles.riskText}>
            昨夜断电 {formatDuration(order.powerOffDuration)}，最高温 {formatTemperature(order.maxTemperature)}
          </Text>
        </View>
      )}

      <View className={styles.footer}>
        <StatusBadge
          text={order.riskLevel === 'none' ? '运行正常' : `风险${order.riskLevel === 'low' ? '低' : order.riskLevel === 'medium' ? '中' : '高'}`}
          status={getRiskStatus()}
          size="small"
        />
        {showConfirmBtn && effectiveStatus === 'arrived' && !confirmRecord && (
          <View className={styles.confirmBtn} onClick={handleConfirm}>
            <Text className={styles.confirmBtnText}>去确认</Text>
          </View>
        )}
        {confirmRecord && (
          <View className={styles.confirmedLabel}>
            <Text className={styles.confirmedLabelText}>已确认</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrderCard;
