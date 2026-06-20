import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { mockUser } from '@/data/mockOrders';
import { mockOrders } from '@/data/mockOrders';
import type { UserInfo } from '@/types/order';

const MinePage: React.FC = () => {
  const [user, setUser] = useState<UserInfo>(mockUser);

  const totalOrders = mockOrders.length;
  const riskOrders = mockOrders.filter(o => o.riskLevel !== 'none').length;
  const confirmedOrders = mockOrders.filter(o => o.orderStatus === 'confirmed').length;

  const handleRoleChange = (role: 'warehouse' | 'store') => {
    setUser({
      ...user,
      role,
      roleName: role === 'warehouse' ? '仓库管理员' : '门店收货人'
    });
    Taro.showToast({
      title: `已切换为${role === 'warehouse' ? '仓库管理员' : '门店收货人'}`,
      icon: 'success'
    });
  };

  const handleMenuClick = (key: string) => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  };

  const menuItems = [
    { key: 'notification', icon: '🔔', text: '消息通知', badge: 3 },
    { key: 'help', icon: '❓', text: '帮助中心' },
    { key: 'feedback', icon: '💬', text: '意见反馈' }
  ];

  const moreItems = [
    { key: 'about', icon: 'ℹ️', text: '关于我们' },
    { key: 'settings', icon: '⚙️', text: '设置' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.userCard}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text className={styles.avatarIcon}>👤</Text>
          </View>
          <View className={styles.userMeta}>
            <Text className={styles.userName}>{user.name}</Text>
            <View className={styles.userRole}>
              <Text className={styles.roleText}>{user.roleName}</Text>
            </View>
            <Text className={styles.userCompany}>{user.company}</Text>
          </View>
        </View>

        <View className={styles.roleSelector}>
          <View
            className={`${styles.roleOption} ${user.role === 'warehouse' ? styles.active : ''}`}
            onClick={() => handleRoleChange('warehouse')}
          >
            <Text className={styles.roleOptionName}>仓库管理员</Text>
            <Text className={styles.roleOptionDesc}>查询订单 监控状态</Text>
          </View>
          <View
            className={`${styles.roleOption} ${user.role === 'store' ? styles.active : ''}`}
            onClick={() => handleRoleChange('store')}
          >
            <Text className={styles.roleOptionName}>门店收货人</Text>
            <Text className={styles.roleOptionDesc}>确认收货 查看记录</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{totalOrders}</Text>
            <Text className={styles.statLabel}>订单总数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{riskOrders}</Text>
            <Text className={styles.statLabel}>风险订单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{confirmedOrders}</Text>
            <Text className={styles.statLabel}>已确认</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>常用功能</Text>
      <View className={styles.section}>
        {menuItems.map(item => (
          <View
            key={item.key}
            className={styles.menuItem}
            onClick={() => handleMenuClick(item.key)}
          >
            <View className={styles.menuIcon}>
              <Text>{item.icon}</Text>
            </View>
            <View className={styles.menuContent}>
              <View style={{ display: 'flex', alignItems: 'center' }}>
                {item.badge && (
                  <Text className={styles.menuBadge}>{item.badge}</Text>
                )}
                <Text className={styles.menuText}>{item.text}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>
        ))}
      </View>

      <Text className={styles.sectionTitle}>更多</Text>
      <View className={styles.section}>
        {moreItems.map(item => (
          <View
            key={item.key}
            className={styles.menuItem}
            onClick={() => handleMenuClick(item.key)}
          >
            <View className={styles.menuIcon}>
              <Text>{item.icon}</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuText}>{item.text}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default MinePage;
