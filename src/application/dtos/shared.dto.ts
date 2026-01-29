// Generic API Response wrapper for Server Actions
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Pagination wrapper if needed later
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
