/**
 * Safe shape for a single event in API list responses. Matches management-api eventToJson.
 * Use for typing GET /events data.
 */
export interface PublicManagementEvent {
  id: string;
  actorId: string;
  actorType: string;
  actorDisplayName?: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  timestamp: string;
  details: string | null;
}

/** Response data for GET /events (paginated list). */
export interface ListEventsData {
  events: PublicManagementEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  truncatedTotal?: true;
}
