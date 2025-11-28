export type SpaceStatus = "available" | "reserved" | "blocked" | "on_hold" | "internal";

export interface Space {
  id: string;
  space_number: number;
  status: SpaceStatus;
  price?: number;
  hold_expires_at?: string;
  held_by?: string;
  is_mine?: boolean;
}

export interface SpaceSummary {
  available: number;
  reserved: number;
  blocked: number;
  on_hold: number;
  internal: number;
}

export interface TripSpacesResponse {
  trip_id: string;
  total_spaces: number;
  spaces: Space[];
  summary: SpaceSummary;
}
