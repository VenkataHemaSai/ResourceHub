export const ERROR_MESSAGES = {
  unauthorized: "You must be logged in to access this.",
  forbidden: "You do not have permission to perform this action.",

  not_found: "The requested resource was not found.",
  conflict: "This action conflicts with existing data.",
  SLOT_TAKEN: "Someone just booked this slot. Please choose a different time.",
  validation_error: "Please check the form for errors.",

  network_error:
    "Cannot reach the server. Please check your internet connection.",

  default: "An unexpected error occurred. Please try again later.",
};

/**
 * Get a user-friendly error message for a given API error code.
 */
export function getErrorMessage(code) {
  if (!code) return ERROR_MESSAGES.default;
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.default;
}
