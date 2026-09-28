/**
 * A tiny wrapper around fetch that automatically handles JSON
 * and throws meaningful errors on non-2xx responses.
 */
export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const config = {
    method: body ? 'POST' : 'GET',
    credentials: 'include', // Ensure cookies (like JWT, if we use them) are sent
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, config);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.error?.message || response.statusText || 'API Request Failed');
    error.status = response.status;
    error.code = data.error?.code;
    error.details = data;
    throw error;
  }

  return data;
}
