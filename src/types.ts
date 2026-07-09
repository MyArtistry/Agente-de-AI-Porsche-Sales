export interface PorscheRecord {
  sale_id: string;
  sale_date: string;
  customer_name: string;
  porsche_model: string;
  model_year: string;
  sale_price: string;
  vehicle_mileage: string;
  payment_method: string;
  city: string;
  state: string;
  salesperson: string;
  delivery_status: string;

  // Sanitized fields
  SaleDateSanitized?: string;
  PorscheModelSanitized?: string;
  ModelYearSanitized?: string;
  SalesPriceSanitized?: string;
  VehicleMileageSanitized?: string;
  PayMethodSanitized?: string;
  CitySanitized?: string;
  StateSanitized?: string;
  DeliveryStatusSanitized?: string;
}

export interface SanitizationLog {
  id: string;
  rowId: string;
  customerName: string;
  field: string;
  originalValue: string;
  sanitizedValue: string;
  description: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
