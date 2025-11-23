export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  MANAGER = 'Manager',
  CLIENT = 'Client',
}

export enum TripStatus {
  SCHEDULED = 'Scheduled',
  IN_TRANSIT = 'InTransit',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum SpaceStatus {
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  BLOCKED = 'Blocked',
}

export enum ReservationStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
}

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  origin: string
  destination: string
  departure_date: string
  departure_time?: string
  status: TripStatus
  total_spaces: number
  notes_admin?: string
  notes_client?: string
  created_by: string
  created_at: string
  updated_at: string
  spaces?: Space[]
}

export interface TripListItem {
  id: string
  origin: string
  destination: string
  departure_date: string
  departure_time?: string
  status: TripStatus
  total_spaces: number
  available_spaces: number
  created_at: string
}

export interface Space {
  id: string
  trip_id: string
  space_number: number
  status: SpaceStatus
  cargo_type?: string
  weight?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  trip_id: string
  client_id: string
  status: ReservationStatus
  payment_receipt_url?: string
  bank_details_shown: boolean
  created_at: string
  updated_at: string
  spaces: Space[]
}

export interface BankDetails {
  bank_name: string
  account_number: string
  account_holder: string
  routing_number: string
}

export interface DashboardStats {
  total_trips: number
  active_trips: number
  total_reservations: number
  pending_reservations: number
  confirmed_reservations: number
  total_spaces: number
  available_spaces: number
  reserved_spaces: number
  occupancy_rate: number
  total_users: number
  active_users: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface CreateTripData {
  origin: string
  destination: string
  departure_date: string
  departure_time?: string
  total_spaces: number
  notes_admin?: string
  notes_client?: string
}

export interface CreateReservationData {
  trip_id: string
  space_ids: string[]
}
