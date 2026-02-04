export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


export const DEFAULT_TIMEOUT_MS = 15000;

export function getErrorMessage(error, fallback = "Something went wrong.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || fallback;
}

function isRetryableStatus(status) {
  if (typeof status !== "number") return true;
  return status >= 500;
}

export async function requestJson(url, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Get token
    const token = localStorage.getItem("access_token");

    // Build headers
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...rest.headers,
    };

    // Build full URL
    const fullUrl = url.startsWith("http")
      ? url
      : `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl, {
      ...rest,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        (typeof data === "string" && data.trim()) || data?.message || "";

      const error = new Error(
        message || `Request failed (${response.status})`
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out.");
    }
    throw error;

  } finally {
    clearTimeout(timeoutId);
  }
}


export async function requestWithRetry(
  requestFn,
  { retries = 2, baseDelayMs = 500, shouldRetry } = {}
) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      const retryAllowed =
        typeof shouldRetry === "function"
          ? shouldRetry(error)
          : isRetryableStatus(error?.status);

      if (!retryAllowed || attempt === retries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);

      await new Promise((resolve) => setTimeout(resolve, delay));

      attempt += 1;
    }
  }

  throw lastError;
}
