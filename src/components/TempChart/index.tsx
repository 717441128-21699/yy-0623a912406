import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { TemperaturePoint } from '@/types/order';
import { formatTemperature } from '@/utils/format';

interface TempChartProps {
  points: TemperaturePoint[];
  targetTemp: number;
  height?: number;
}

const TempChart: React.FC<TempChartProps> = ({ points, targetTemp, height = 200 }) => {
  if (points.length === 0) {
    return (
      <View className={styles.empty}>
        <Text className={styles.emptyText}>暂无温度数据</Text>
      </View>
    );
  }

  const temps = points.map(p => p.temperature);
  const minTemp = Math.min(...temps, targetTemp) - 2;
  const maxTemp = Math.max(...temps, targetTemp) + 2;
  const tempRange = maxTemp - minTemp;

  const chartHeight = height;
  const chartWidth = 100;
  const padding = { top: 20, right: 16, bottom: 24, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (points.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (points.length - 1)) * innerWidth;
  };

  const getY = (temp: number) => {
    return padding.top + ((maxTemp - temp) / tempRange) * innerHeight;
  };

  const targetY = getY(targetTemp);

  const pathPoints = points.map((p, i) => `${getX(i)},${getY(p.temperature)}`).join(' ');
  const areaPoints = `${padding.left},${padding.top + innerHeight} ${pathPoints} ${padding.left + innerWidth},${padding.top + innerHeight}`;

  return (
    <View className={styles.chart} style={{ height: `${height}rpx` }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.svg}>
        <line
          x1={padding.left}
          y1={targetY}
          x2={padding.left + innerWidth}
          y2={targetY}
          stroke="#165dff"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />

        <polygon
          points={areaPoints}
          fill="rgba(22, 93, 255, 0.1)"
        />

        <polyline
          points={pathPoints}
          fill="none"
          stroke="#165dff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(p.temperature)}
            r="2"
            fill="#fff"
            stroke="#165dff"
            strokeWidth="1"
          />
        ))}

        <text
          x={padding.left + innerWidth + 4}
          y={targetY + 2}
          fontSize="6"
          fill="#165dff"
        >
          目标 {formatTemperature(targetTemp)}
        </text>
      </svg>

      <View className={styles.xAxis}>
        {points.map((p, i) => (
          <Text key={i} className={styles.xLabel}>{p.time}</Text>
        ))}
      </View>
    </View>
  );
};

export default TempChart;
