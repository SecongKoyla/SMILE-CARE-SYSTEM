export const API_URL = "http://localhost:8085/api/v1";

/**
 * Get authorization headers if token exists
 */
function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

/**
 * Login a user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} user data
 * @throws {Error} with backend error message if login fails
 */
export async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Login failed");
    }

    return await res.json();
  } catch (err) {
    // Rethrow so calling code can catch it
    throw new Error(err.message || "Network error");
  }
}

/**
 * Register a new user
 * @param {string} email
 * @param {string} fullName
 * @param {string} password
 * @returns {Promise<Object>} new user data
 * @throws {Error} with backend error message if registration fails
 */
export async function register(fullName, email, password, confirmPassword) {
  try {
    const response = await fetch("http://localhost:8085/api/v1/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        password,
        confirmPassword // ✅ send to backend
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Registration failed");

    return data;
  } catch (err) {
    throw new Error(err.message || "Server error. Please try again.");
  }
}

/**
 * Get all appointments (for admin)
 */
export async function getAllAppointments() {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/appointments`, {
      method: "GET",
      headers: headers
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Fetch error:", res.status, errorData);
      throw new Error(`Failed to fetch appointments (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
}

/**
 * Get appointments for a specific user
 */
export async function getUserAppointments(userId) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/appointments/user/${userId}`, {
      method: "GET",
      headers: headers
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Fetch error:", res.status, errorData);
      throw new Error(`Failed to fetch appointments (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(appointmentId, status) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/appointments/${appointmentId}/status?status=${status}`, {
      method: "PUT",
      headers: headers
    });

    if (!res.ok) throw new Error("Failed to update appointment status");

    return await res.json();
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
}
