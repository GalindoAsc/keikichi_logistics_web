import axios, { AxiosInstance } from 'axios'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  Trip,
  TripListItem,
  Space,
  Reservation,
  BankDetails,
  DashboardStats,
  CreateTripData,
  CreateReservationData,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login/json', credentials)
    return response.data
  }

  async register(data: RegisterData): Promise<User> {
    const response = await this.api.post<User>('/auth/register', data)
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/me')
    return response.data
  }

  // Trip endpoints
  async getTrips(params?: {
    origin?: string
    destination?: string
    departure_date?: string
    status?: string
  }): Promise<TripListItem[]> {
    const response = await this.api.get<TripListItem[]>('/trips', { params })
    return response.data
  }

  async getTrip(id: string): Promise<Trip> {
    const response = await this.api.get<Trip>(`/trips/${id}`)
    return response.data
  }

  async createTrip(data: CreateTripData): Promise<Trip> {
    const response = await this.api.post<Trip>('/trips', data)
    return response.data
  }

  async updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
    const response = await this.api.put<Trip>(`/trips/${id}`, data)
    return response.data
  }

  async deleteTrip(id: string): Promise<void> {
    await this.api.delete(`/trips/${id}`)
  }

  // Space endpoints
  async getTripSpaces(tripId: string): Promise<Space[]> {
    const response = await this.api.get<Space[]>(`/spaces/trip/${tripId}`)
    return response.data
  }

  async updateSpace(id: string, data: Partial<Space>): Promise<Space> {
    const response = await this.api.put<Space>(`/spaces/${id}`, data)
    return response.data
  }

  // Reservation endpoints
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const response = await this.api.post<Reservation>('/reservations', data)
    return response.data
  }

  async getMyReservations(): Promise<Reservation[]> {
    const response = await this.api.get<Reservation[]>('/reservations/my-reservations')
    return response.data
  }

  async getAllReservations(): Promise<Reservation[]> {
    const response = await this.api.get<Reservation[]>('/reservations')
    return response.data
  }

  async getReservation(id: string): Promise<Reservation> {
    const response = await this.api.get<Reservation>(`/reservations/${id}`)
    return response.data
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const response = await this.api.put<Reservation>(`/reservations/${id}`, data)
    return response.data
  }

  async cancelReservation(id: string): Promise<void> {
    await this.api.delete(`/reservations/${id}`)
  }

  async uploadReceipt(reservationId: string, file: File): Promise<{ file_url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await this.api.post(`/reservations/${reservationId}/upload-receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getBankDetails(reservationId: string): Promise<BankDetails> {
    const response = await this.api.get<BankDetails>(`/reservations/${reservationId}/bank-details`)
    return response.data
  }

  // Admin endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get<DashboardStats>('/admin/dashboard/stats')
    return response.data
  }

  async getUsers(): Promise<User[]> {
    const response = await this.api.get<User[]>('/admin/users')
    return response.data
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await this.api.put<User>(`/admin/users/${id}`, data)
    return response.data
  }
}

export const api = new ApiService()
