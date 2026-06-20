import React, { useState, useEffect } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { mockOrders } from '@/data/mockOrders';
import {
  formatDuration,
  formatTemperature,
  formatConfirmResult
} from '@/utils/format';
import type { OrderInfo, ConfirmResult } from '@/types/order';

interface ConfirmOption {
  key: NonNullable<ConfirmResult>;
  title: string;
  desc: string;
  tag: string;
  tagClass: 'normal' | 'pending' | 'rejected';
}

const options: ConfirmOption[] = [
  {
    key: 'normal',
    title: '正常收货',
    desc: '货物状态良好，温度符合要求',
    tag: '推荐',
    tagClass: 'normal'
  },
  {
    key: 'pending',
    title: '待质检',
    desc: '需进一步抽检确认货物品质',
    tag: '谨慎',
    tagClass: 'pending'
  },
  {
    key: 'rejected',
    title: '拒收',
    desc: '货物品质异常，拒绝签收',
    tag: '严重',
    tagClass: 'rejected'
  }
];

const ConfirmArrivalPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [selectedResult, setSelectedResult] = useState<ConfirmResult>(null);
  const [remark, setRemark] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const loadOrder = () => {
    const id = router.params.id;
    const found = mockOrders.find(o => o.id === id);
    if (found) {
      setOrder(found);
      if (found.confirmResult) {
        setSubmitted(true);
        setSelectedResult(found.confirmResult);
        setRemark(found.confirmRemark || '');
      }
    }
  };

  useEffect(() => {
    loadOrder();
  }, [router.params.id]);

  useDidShow(() => {
    loadOrder();
  });

  const handleSelect = (key: NonNullable<ConfirmResult>) => {
    if (submitted) return;
    setSelectedResult(key);
  };

  const handleRemarkChange = (e: any) => {
    if (submitted) return;
    const value = e.detail.value;
    if (value.length <= 200) {
      setRemark(value);
    }
  };

  const handleSubmit = () => {
    if (!selectedResult) {
      Taro.showToast({
        title: '请选择收货结果',
        icon: 'none'
      });
      return;
    }

    Taro.showModal({
      title: '确认提交',
      content: `确认选择"${formatConfirmResult(selectedResult)}"吗？`,
      success: (res) => {
        if (res.confirm) {
          console.log('[ConfirmArrival] submit:', { result: selectedResult, remark });
          Taro.showToast({
            title: '提交成功',
            icon: 'success'
          });
          setSubmitted(true);
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
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

  const getResultTagClass = () => {
    if (selectedResult === 'normal') return 'normal';
    if (selectedResult === 'pending') return 'pending';
    return 'rejected';
  };

  if (submitted && order.confirmResult) {
    return (
      <View className={styles.page}>
        <View className={styles.orderHeader}>
          <View className={styles.orderRow}>
            <Text className={styles.orderLabel}>运单号</Text>
            <Text className={`${styles.orderValue} ${styles.orderNo}`}>{order.orderNo}</Text>
          </View>
        </View>

        <View className={styles.confirmedCard}>
          <Text className={styles.confirmedIcon}>✅</Text>
          <Text className={styles.confirmedTitle}>已完成确认</Text>
          <Text className={styles.confirmedSubtitle}>确认时间：{order.confirmTime || '--'}</Text>
          <View className={`${styles.confirmedResult} ${styles[getResultTagClass()]}`}>
            <Text>{formatConfirmResult(order.confirmResult)}</Text>
          </View>
          {order.confirmRemark && (
            <View className={styles.confirmedRemark}>
              <Text>备注：{order.confirmRemark}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.orderHeader}>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>运单号</Text>
          <Text className={`${styles.orderValue} ${styles.orderNo}`}>{order.orderNo}</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>车牌号</Text>
          <Text className={styles.orderValue}>{order.vehicleNo}</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>货物</Text>
          <Text className={styles.orderValue}>{order.cargoName}</Text>
        </View>
      </View>

      <View className={styles.dataCard}>
        <Text className={styles.cardTitle}>昨夜运输数据</Text>
        <View className={styles.dataGrid}>
          <View className={`${styles.dataItem} ${order.powerOffDuration > 0 ? styles.highlight : ''}`}>
            <Text className={`${styles.dataValue} ${order.powerOffDuration > 10 ? styles.warning : styles.normal}`}>
              {order.powerOffDuration > 0 ? formatDuration(order.powerOffDuration) : '0分钟'}
            </Text>
            <Text className={styles.dataLabel}>断电时长</Text>
            <Text className={styles.dataSub}>累计</Text>
          </View>
          <View className={`${styles.dataItem} ${order.maxTemperature > order.targetTemp + 3 ? styles.highlight : ''}`}>
            <Text className={`${styles.dataValue} ${order.maxTemperature > order.targetTemp + 3 ? styles.warning : styles.normal}`}>
              {formatTemperature(order.maxTemperature)}
            </Text>
            <Text className={styles.dataLabel}>最高温度</Text>
            <Text className={styles.dataSub}>夜间峰值</Text>
          </View>
          <View className={styles.dataItem}>
            <Text className={styles.dataValue}>{formatTemperature(order.targetTemp)}</Text>
            <Text className={styles.dataLabel}>目标温度</Text>
            <Text className={styles.dataSub}>要求值</Text>
          </View>
        </View>
      </View>

      {order.handlingDescription && (
        <View className={styles.noticeCard}>
          <Text className={styles.cardTitle}>处置说明</Text>
          <View className={styles.noticeContent}>
            <Text className={styles.noticeIcon}>ℹ️</Text>
            <Text className={styles.noticeText}>{order.handlingDescription}</Text>
          </View>
        </View>
      )}

      <View className={styles.optionsCard}>
        <Text className={styles.cardTitle}>请选择收货结果</Text>
        <View className={styles.optionList}>
          {options.map(opt => (
            <View
              key={opt.key}
              className={`${styles.optionItem} ${selectedResult === opt.key ? styles.selected : ''}`}
              onClick={() => handleSelect(opt.key)}
            >
              <View className={`${styles.optionRadio} ${selectedResult === opt.key ? styles.selected : ''}`}>
                <View className={styles.optionRadioInner} />
              </View>
              <View className={styles.optionContent}>
                <View style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Text className={styles.optionTitle}>{opt.title}</Text>
                  <View className={`${styles.optionTag} ${styles[opt.tagClass]}`}>
                    <Text>{opt.tag}</Text>
                  </View>
                </View>
                <Text className={styles.optionDesc}>{opt.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.remarkCard}>
        <Text className={styles.cardTitle}>备注说明（选填）</Text>
        <Textarea
          className={styles.remarkInput}
          placeholder="请输入备注信息，如货物外观、数量异常等..."
          placeholderStyle="color: #c9cdd4"
          value={remark}
          onInput={handleRemarkChange}
          maxlength={200}
          autoHeight
        />
        <Text className={styles.remarkCount}>{remark.length}/200</Text>
      </View>

      <View className={styles.bottomBar}>
        <View
          className={styles.submitBtn}
          onClick={handleSubmit}
        >
          <Text>确认提交</Text>
        </View>
      </View>
    </View>
  );
};

export default ConfirmArrivalPage;
