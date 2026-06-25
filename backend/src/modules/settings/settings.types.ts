// File: backend/src/modules/settings/settings.types.ts

export type PrinterConnectionType = 'USB' | 'Bluetooth' | 'Network';

export interface RestaurantSettingsRecord {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  logo_url?: string;
  theme?: string;
  compact_mode: boolean;
  high_contrast: boolean;
  animations_enabled: boolean;
  address?: string;
  contact_number?: string;
  gst_number?: string;
  created_at: string;
  updated_at: string;
}

export interface PrinterSettingsRecord {
  id: string;
  restaurant_id: string;
  printer_name: string;
  connection_type: PrinterConnectionType;
  paper_width: string;
  is_default: boolean;
  status: string;
  last_tested_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettingsPayload {
  restaurant_name: string;
  logo_url?: string;
  theme?: string;
  compact_mode?: boolean;
  high_contrast?: boolean;
  animations_enabled?: boolean;
  address?: string;
  contact_number?: string;
  gst_number?: string;
}

export interface PrinterSettingsPayload {
  printer_name: string;
  connection_type: PrinterConnectionType;
  paper_width: string;
  is_default: boolean;
  status: string;
  last_tested_at?: string;
}
