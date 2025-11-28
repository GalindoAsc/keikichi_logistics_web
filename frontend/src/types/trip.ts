import { Space } from "./space";

export type TripStatus = "scheduled" | "in_transit" | "completed" | "cancelled";

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time?: string;
  status: TripStatus;
  total_spaces: number;
  price_per_space: number;
  individual_pricing: boolean;
  tax_included: boolean;
  tax_rate: number;
  payment_deadline_hours: number;
  notes_public?: string;
  notes_internal?: string;
  truck_identifier?: string;
  trailer_identifier?: string;
  truck_plate?: string;
  trailer_plate?: string;
  driver_name?: string;
  driver_phone?: string;
  available_spaces?: number;
  reserved_spaces?: number;
  blocked_spaces?: number;
  on_hold_spaces?: number;
  spaces?: Space[];
}
