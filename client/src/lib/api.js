import { getErrorMessage } from "./errorMessages";

/**
 * Core API fetch wrapper.
 * Throws normalized error objects: { status, code, message, fields, isApiError: true }
 */
export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...customConfig.headers,
  };

  const config = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(endpoint, config);
  } catch (error) {
    // Network failure (server down, no internet)
    throw {
      status: 0,
      code: "network_error",
      message: getErrorMessage("network_error"),
      isApiError: true,
    };
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (response.ok) {
    return data;
  }

  // Handle standard API errors defined by our backend
  const errPayload = data?.error || {};

  throw {
    status: response.status,
    code: errPayload.code || "unknown_error",
    message: errPayload.message || getErrorMessage("default"),
    fields: errPayload.fields || null,
    isApiError: true,
  };
}
