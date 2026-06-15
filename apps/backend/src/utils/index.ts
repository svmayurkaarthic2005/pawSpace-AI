// ─── API Response Helpers ─────────────────────────────────────────────────────

export const successResponse = <T>(data: T, message?: string) => {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
};

export const errorResponse = (message: string, details?: any) => {
  return {
    success: false,
    message,
    ...(details && { details }),
  };
};

// ─── Pagination Helpers ───────────────────────────────────────────────────────

/**
 * Maximum page size enforced across all paginated endpoints
 * Per Requirement 14.5: Performance and Scalability
 */
export const MAX_PAGE_SIZE = 50;

/**
 * Default page size if not specified
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Validate and normalize pagination parameters
 * Enforces maximum page size of 50 items
 * 
 * @param page - Page number (must be positive integer)
 * @param limit - Items per page (must be positive integer, max 50)
 * @returns Validated { page, limit } with limit capped at MAX_PAGE_SIZE
 * @throws Error if parameters are invalid
 */
export function validatePagination(page: string | number, limit: string | number): { page: number; limit: number } {
  const pageNum = typeof page === 'string' ? parseInt(page) : page;
  const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new Error('Invalid page parameter. Must be a positive integer');
  }
  
  if (isNaN(limitNum) || limitNum < 1) {
    throw new Error('Invalid limit parameter. Must be a positive integer');
  }
  
  // Enforce maximum page size
  const validatedLimit = Math.min(limitNum, MAX_PAGE_SIZE);
  
  return { page: pageNum, limit: validatedLimit };
}
