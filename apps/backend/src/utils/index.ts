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
