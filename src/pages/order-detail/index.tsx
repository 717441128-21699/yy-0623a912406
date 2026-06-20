import React, { useState, useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import TempChart from '@/components/TempChart';
import { mockOrders } from '@/data/mockOrders';
import { useOrderStore } from '@/store/orderStore';
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

  const { getConfirmRecord, confirmRecords } = useOrderStore(state => ({
    getConfirmRecord: state.getConfirmRecord,
    confirmRecords: state.confirmRecords
  }));

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

  const confirmRecord = useMemo(() => {
    if (!order) return undefined;
    return getConfirmRecord(order.id);
  }, [order, getConfirmRecord, confirmRecords]);

  const effectiveConfirmResult = confirmRecord?.result || order?.confirmResult;
  const effectiveConfirmRemark = confirmRecord?.remark || order?.confirmRemark;
  const effectiveConfirmTime = confirmRecord?.time || order?.confirmTime;
  const effectiveExceptionInfo = confirmRecord?.exceptionInfo;
  const effectiveOrderStatus = confirmRecord ? 'confirmed' as const : order?.orderStatus;

  const hasExceptionInfo = effectiveExceptionInfo
    && (effectiveExceptionInfo.reason
      || effectiveExceptionInfo.damageQuantity
      || effectiveExceptionInfo.contactPerson
      || effectiveExceptionInfo.contactPhone);

  const getStatusClass = (status: string) => {
    if (status === 'normal' || status === 'stable' || status === 'none') return 'normal';
    if (status === 'warning' || status === 'fluctuating' || status === 'low' || status === 'medium') return 'warning';
    return 'error';
  };

  const getBackupPlanIcon = () => {
    if (!order?.riskAdvice) return 'ℹ️';
    switch (order.riskAdvice.backupPlan) {
      case 'prepare': return '⚠️';
      case 'standby': return '💡';
      default: return '✅';
    }
  };

  const handleCallDriver = () => {
    if (!order) return;
    Taro.makePhoneCall({
      phoneNumber: order.driverPhone.replace(/\*/g, '0')
    }).catch(err => {
      console.error('[OrderDetail] Call fail:', err);
      Taro.showToast({ title: '拨号失败', icon: 'none' });
    });
  };

  const handleConfirm = () => {
    if (!order) return;
    Taro.navigateTo({
      url: `/pages/confirm-arrival/index?id=${order.id}`
    });
  };

  const handleCallContact = () => {
    if (!effectiveExceptionInfo?.contactPhone) return;
    Taro.makePhoneCall({
      phoneNumber: effectiveExceptionInfo.contactPhone
    }).catch(err => {
      console.error('[OrderDetail] Call fail:', err);
      Taro.showToast({ title: '拨号失败', icon: 'none' });
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
            text={formatOrderStatus(effectiveOrderStatus || order.orderStatus)}
            status={(effectiveOrderStatus || order.orderStatus) === 'transit' ? 'info' : 'normal'}
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

      {order.riskAdvice && order.powerOffDuration > 0 && (
        <View className={styles.statusSection}>
          <Text className={styles.sectionTitle}>风险处置与建议</Text>
          <View className={styles.adviceSection}>
            <View className={styles.adviceItem}>
              <Text className={styles.adviceIcon}>⏱️</Text>
              <View className={styles.adviceContent}>
                <Text className={styles.adviceLabel}>断电时长</Text>
                <Text className={styles.adviceText}>累计 {formatDuration(order.riskAdvice.powerOffDuration)}</Text>
              </View>
            </View>
            <View className={styles.adviceItem}>
              <Text className={styles.adviceIcon}>👤</Text>
              <View className={styles.adviceContent}>
                <Text className={styles.adviceLabel}>承运方处置</Text>
                <Text className={styles.adviceText}>{order.riskAdvice.carrierAction}</Text>
              </View>
            </View>
            <View className={styles.adviceItem}>
              <Text className={styles.adviceIcon}>⏰</Text>
              <View className={styles.adviceContent}>
                <Text className={styles.adviceLabel}>预计恢复</Text>
                <Text className={styles.adviceText}>{order.riskAdvice.estimatedRecoveryTime}</Text>
              </View>
            </View>
            <View className={styles.adviceItem}>
              <Text className={styles.adviceIcon}>{getBackupPlanIcon()}</Text>
              <View className={styles.adviceContent}>
                <Text className={styles.adviceLabel}>收货建议</Text>
                <Text className={styles.adviceText}>{order.riskAdvice.backupPlanText}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {order.powerOffDuration > 0 && order.handlingDescription && !order.riskAdvice && (
        <View className={styles.statusSection}>
          <Text className={styles.sectionTitle}>处置说明</Text>
          <Text style={{ fontSize: 28, color: '#4e5969', lineHeight: 1.6 }}>
            {order.handlingDescription}
          </Text>
        </View>
      )}

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

      {effectiveConfirmResult && (
        <View className={styles.statusSection}>
          <Text className={styles.sectionTitle}>收货确认</Text>
          <View className={styles.confirmResult}>
            <View className={`${styles.confirmResultBadge} ${styles[effectiveConfirmResult]}`}>
              <Text>{formatConfirmResult(effectiveConfirmResult)}</Text>
            </View>
            {effectiveConfirmTime && (
              <Text className={styles.confirmTime}>确认时间：{effectiveConfirmTime}</Text>
            )}
            {effectiveConfirmRemark && (
              <View className={styles.confirmRemark}>
                <Text className={styles.confirmRemarkLabel}>备注：</Text>
                <Text className={styles.confirmRemarkText}>{effectiveConfirmRemark}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {hasExceptionInfo && effectiveExceptionInfo && (
        <View className={styles.statusSection}>
          <Text className={styles.sectionTitle}>异常处理跟进</Text>
          <View className={styles.exceptionFollowCard}>
            <View className={styles.exceptionFollowHeader}>
              <Text className={styles.exceptionFollowIcon}>⚠️</Text>
              <Text className={styles.exceptionFollowTitle}>待跟进</Text>
              <View className={styles.exceptionFollowBadge}>
                <Text>{formatConfirmResult(effectiveConfirmResult)}</Text>
              </View>
            </View>

            <View className={styles.exceptionFollowList}>
              <View className={styles.exceptionFollowItem}>
                <Text className={styles.exceptionFollowLabel}>异常原因</Text>
                <Text className={styles.exceptionFollowValue}>
                  {effectiveExceptionInfo.reason || '-'}
                </Text>
              </View>
              {effectiveExceptionInfo.damageQuantity && (
                <View className={styles.exceptionFollowItem}>
                  <Text className={styles.exceptionFollowLabel}>货损数量</Text>
                  <Text className={styles.exceptionFollowValue}>
                    {effectiveExceptionInfo.damageQuantity}
                  </Text>
                </View>
              )}
              {effectiveExceptionInfo.contactPerson && (
                <View className={styles.exceptionFollowItem}>
                  <Text className={styles.exceptionFollowLabel}>负责人</Text>
                  <View className={styles.exceptionFollowContact}>
                    <Text className={styles.exceptionFollowValue}>
                      {effectiveExceptionInfo.contactPerson}
                    </Text>
                    {effectiveExceptionInfo.contactPhone && (
                      <View
                        className={styles.exceptionFollowCallBtn}
                        onClick={handleCallContact}
                      >
                        <Text>📞 联系</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            <View className={styles.exceptionFollowActions}>
              <View className={styles.exceptionFollowHint}>
                <Text className={styles.exceptionFollowHintText}>
                  请门店尽快跟进处理，如有疑问请联系承运方
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.btnSecondary} onClick={handleCallDriver}>
          <Text className={styles.btnText}>联系司机</Text>
        </View>
        {(effectiveOrderStatus || order.orderStatus) === 'arrived' && !effectiveConfirmResult ? (
          <View className={styles.btnPrimary} onClick={handleConfirm}>
            <Text className={styles.btnText}>到货确认</Text>
          </View>
        ) : effectiveConfirmResult ? (
          <View className={styles.btnPrimary} style={{ background: '#f2f3f5' }}>
            <Text className={styles.btnText} style={{ color: '#86909c' }}>
              已{formatConfirmResult(effectiveConfirmResult)}
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
