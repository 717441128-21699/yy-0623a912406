import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import TempChart from '@/components/TempChart';
import { mockOrders } from '@/data/mockOrders';
import {
  formatPowerStatus,
  formatTempStatus,
  formatOrderStatus,
  formatTemperature,
  formatDuration,
  formatConfirmResult
} from '@/utils/format';
import type { OrderInfo } from '@/types/order';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderInfo | null>(null);

  const loadOrder = () => {
    const id = router.params.id;
    const found = mockOrders.find(o => o.id === id);
    if (found) {
      setOrder(found);
      Taro.setNavigationBarTitle({ title: found.orderNo });
    }
  };

  useEffect(() => {
    loadOrder();
  }, [router.params.id]);

  useDidShow(() => {
    loadOrder();
  });

  const getStatusClass = (status: string) => {
    if (status === 'normal' || status === 'stable' || status === 'none') return 'normal';
    if (status === 'warning' || status === 'fluctuating' || status === 'low' || status === 'medium') return 'warning';
    return 'error';
  };

  const handleCallDriver = () => {
    if (!order) return;
    Taro.makePhoneCall({
      phoneNumber: order.driverPhone.replace(/\*/g, '0')
    }).catch(err => {
      console.error('[Call fail:', err);
      Taro.showToast({ title: '拨号失败', icon: 'none' });
    });
  };

  const handleConfirm = () => {
    if (!order) return;
    Taro.navigateTo({
      url: `/pages/confirm-arrival/index?id=${order.id}`
    });
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.orderNo}>
          <Text className={styles.orderNoText}>{order.orderNo}</Text>
          <StatusBadge
            text={formatOrderStatus(order.orderStatus)}
            status={order.orderStatus === 'transit' ? 'info' : 'normal'}
            size="small"
          />
        </View>

        <View className={styles.route}>
          <View className={styles.point}>
            <Text className={styles.pointLabel}>发货地</Text>
            <Text className={styles.pointAddress}>{order.origin}</Text>
          </View>
          <View className={styles.arrowBox}>
            <Text className={styles.arrow}>→</Text>
          </View>
          <View className={styles.point}>
            <Text className={styles.pointLabel}>收货地</Text>
            <Text className={styles.pointAddress}>{order.destination}</Text>
          </View>
        </View>

        <View className={styles.vehicleInfo}>
          <View className={styles.vehicleItem}>
            <Text className={styles.vehicleLabel}>车牌号</Text>
            <Text className={styles.vehicleValue}>{order.vehicleNo}</Text>
          </View>
          <View className={styles.vehicleItem}>
            <Text className={styles.vehicleLabel}>司机</Text>
            <Text className={styles.vehicleValue}>{order.driverName}</Text>
          </View>
          <View className={styles.vehicleItem}>
            <Text className={styles.vehicleLabel}>承运方</Text>
            <Text className={styles.vehicleValue}>{order.carrier}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statusSection}>
        <Text className={styles.sectionTitle}>运行状态</Text>
        <View className={styles.statusGrid}>
          <View className={styles.statusItem}>
            <View className={`${styles.statusIcon} ${getStatusClass(order.powerStatus)}`}>
              <Text>⚡</Text>
            </View>
            <Text className={styles.statusName}>供电</Text>
            <Text className={`${styles.statusValue} ${getStatusClass(order.powerStatus)}`}>
              {formatPowerStatus(order.powerStatus)}
            </Text>
          </View>
          <View className={styles.statusItem}>
            <View className={`${styles.statusIcon} ${order.powerStatus === 'normal' ? 'normal' : 'error'}`}>
              <Text>❄️</Text>
            </View>
            <Text className={styles.statusName}>冷机</Text>
            <Text className={`${styles.statusValue} ${order.powerStatus === 'normal' ? 'normal' : 'error'}`}>
              {order.powerStatus === 'normal' ? '运行中' : '已停机'}
            </Text>
          </View>
          <View className={styles.statusItem}>
            <View className={`${styles.statusIcon} ${getStatusClass(order.tempStatus)}`}>
              <Text>🌡️</Text>
            </View>
            <Text className={styles.statusName}>温区</Text>
            <Text className={`${styles.statusValue} ${getStatusClass(order.tempStatus)}`}>
              {formatTempStatus(order.tempStatus)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.tempSection}>
        <View className={styles.tempHeader}>
          <View>
            <Text className={styles.tempLabel}>当前温度</Text>
            <View className={styles.tempCurrent}>
              <Text className={styles.tempValue}>{formatTemperature(order.currentTemp).replace('℃', '')}</Text>
              <Text className={styles.tempUnit}>℃</Text>
            </View>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text className={styles.tempLabel}>目标温度</Text>
            <Text className={styles.tempTarget}>{formatTemperature(order.targetTemp)}</Text>
          </View>
        </View>
        <TempChart points={order.temperaturePoints} targetTemp={order.targetTemp} />
      </View>

      <View className={styles.eventsSection}>
        <Text className={styles.sectionTitle}>事件记录</Text>
        {order.events.length > 0 ? (
          <View className={styles.eventList}>
            {order.events.map(event => (
              <View key={event.id} className={styles.eventItem}>
                <View className={`${styles.eventDot} ${event.type === 'power_off' ? 'powerOff' : 'recovery'}`} />
                <View className={styles.eventLine} />
                <View className={styles.eventContent}>
                  <Text className={styles.eventTitle}>
                    {event.type === 'power_off' ? '断电事件' : '恢复供电'}
                  </Text>
                  <Text className={styles.eventTime}>
                    {event.startTime} · 持续 {formatDuration(event.duration)}
                  </Text>
                  <Text className={styles.eventDesc}>{event.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyEvents}>
            <Text className={styles.emptyText}>暂无异常事件</Text>
          </View>
        )}
      </View>

      {order.powerOffDuration > 0 && order.handlingDescription && (
        <View className={styles.statusSection}>
          <Text className={styles.sectionTitle}>处置说明</Text>
          <Text style={{ fontSize: 28, color: '#4e5969', lineHeight: 1.6 }}>
            {order.handlingDescription}
          </Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.btnSecondary} onClick={handleCallDriver}>
          <Text className={styles.btnText}>联系司机</Text>
        </View>
        {order.orderStatus === 'arrived' ? (
          <View className={styles.btnPrimary} onClick={handleConfirm}>
            <Text className={styles.btnText}>到货确认</Text>
          </View>
        ) : order.orderStatus === 'confirmed' ? (
          <View className={styles.btnPrimary} style={{ background: '#f2f3f5' }}>
            <Text className={styles.btnText} style={{ color: '#86909c' }}>
              已{formatConfirmResult(order.confirmResult)}
            </Text>
          </View>
        ) : (
          <View className={styles.btnPrimary} style={{ opacity: 0.6 }}>
            <Text className={styles.btnText}>预计 {order.estimatedArrivalTime.slice(11)} 到达</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrderDetailPage;
