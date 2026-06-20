export type OrderStatus = 'transit' | 'arrived' | 'confirmed';

export type PowerStatus = 'normal' | 'warning' | 'off';

export type TempStatus = 'stable' | 'fluctuating' | 'overlimit';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export type ConfirmResult = 'normal' | 'pending' | 'rejected' | null;

export interface TemperaturePoint {
  time: string;
  temperature: number;
}

export interface PowerEvent {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  type: 'power_off' | 'recovery';
  description: string;
}

export interface OrderInfo {
  id: string;
  orderNo: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  carrier: string;
  origin: string;
  destination: string;
  cargoName: string;
  cargoWeight: string;
  targetTemp: number;
  currentTemp: number;
  powerStatus: PowerStatus;
  tempStatus: TempStatus;
  riskLevel: RiskLevel;
  orderStatus: OrderStatus;
  departureTime: string;
  estimatedArrivalTime: string;
  actualArrivalTime?: string;
  powerOffDuration: number;
  maxTemperature: number;
  events: PowerEvent[];
  temperaturePoints: TemperaturePoint[];
  handlingDescription?: string;
  confirmResult?: ConfirmResult;
  confirmRemark?: string;
  confirmTime?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  role: 'warehouse' | 'store';
  roleName: string;
  company: string;
}
