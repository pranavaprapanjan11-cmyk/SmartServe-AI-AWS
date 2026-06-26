export type PrinterConnectionType = 'USB' | 'Bluetooth' | 'Network';

export interface RestaurantSettingsModel {
  restaurantName: string;
  logoUrl: string;
  address: string;
  contactNumber: string;
  gstNumber: string;
  theme?: string;
  compactMode?: boolean;
  highContrast?: boolean;
  animationsEnabled?: boolean;
}

export interface PrinterConfigModel {
  id?: string;
  printerName: string;
  connectionType: PrinterConnectionType;
  paperWidth: string;
  isDefault: boolean;
  status: 'Ready' | 'Offline' | 'Error';
  lastTestedAt?: string;
}

export interface BillingTemplateModel {
  restaurantName: string;
  headerTemplate: string;
  footerTemplate: string;
}

export interface TaxSettingsModel {
  taxPercent: number;
}

export interface DiscountSettingsModel {
  discountPercent: number;
  discountAmount: number;
}

export interface OrderItemModel {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export type PaymentMethodType = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card';

export interface CheckoutStateModel {
  paymentMethod: PaymentMethodType;
  showReceipt: boolean;
}
