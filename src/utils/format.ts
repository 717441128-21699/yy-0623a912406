import type { PowerStatus, TempStatus, RiskLevel, OrderStatus, ConfirmResult } from '@/types/order';

export const formatPowerStatus = (status: PowerStatus): string => {
  const map: Record<PowerStatus, string> = {
    normal: '供电正常',
    warning: '电压波动',
    off: '已断电'
  };
  return map[status];
};

export const formatTempStatus = (status: TempStatus): string => {
  const map: Record<TempStatus, string> = {
    stable: '温区稳定',
    fluctuating: '温度波动',
    overlimit: '温度超限'
  };
  return map[status];
};

export const formatRiskLevel = (level: RiskLevel): string => {
  const map: Record<RiskLevel, string> = {
    none: '正常',
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  };
  return map[level];
};

export const formatOrderStatus = (status: OrderStatus): string => {
  const map: Record<OrderStatus, string> = {
    transit: '运输中',
    arrived: '已到店',
    confirmed: '已确认'
  };
  return map[status];
};

export const formatConfirmResult = (result: ConfirmResult): string => {
  if (!result) return '';
  const map: Record<NonNullable<ConfirmResult>, string> = {
    normal: '正常收货',
    pending: '待质检',
    rejected: '拒收'
  };
  return map[result];
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatTemperature = (temp: number): string => {
  return `${temp > 0 ? '+' : ''}${temp.toFixed(1)}℃`;
};

export const maskPhone = (phone: string): string => {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export const getStatusColor = (status: PowerStatus | TempStatus | RiskLevel): string => {
  const colorMap: Record<string, string> = {
    normal: '#00b42a',
    stable: '#00b42a',
    none: '#00b42a',
    warning: '#ff7d00',
    fluctuating: '#ff7d00',
    low: '#ff7d00',
    medium: '#ff7d00',
    off: '#f53f3f',
    overlimit: '#f53f3f',
    high: '#f53f3f'
  };
  return colorMap[status] || '#86909c';
};

export const getStatusBgColor = (status: PowerStatus | TempStatus | RiskLevel): string => {
  const colorMap: Record<string, string> = {
    normal: 'rgba(0, 180, 42, 0.1)',
    stable: 'rgba(0, 180, 42, 0.1)',
    none: 'rgba(0, 180, 42, 0.1)',
    warning: 'rgba(255, 125, 0, 0.1)',
    fluctuating: 'rgba(255, 125, 0, 0.1)',
    low: 'rgba(255, 125, 0, 0.1)',
    medium: 'rgba(255, 125, 0, 0.1)',
    off: 'rgba(245, 63, 63, 0.1)',
    overlimit: 'rgba(245, 63, 63, 0.1)',
    high: 'rgba(245, 63, 63, 0.1)'
  };
  return colorMap[status] || 'rgba(134, 144, 156, 0.1)';
};
