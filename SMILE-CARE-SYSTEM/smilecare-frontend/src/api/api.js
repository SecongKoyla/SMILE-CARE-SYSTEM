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

/**
 * Get available time slots
 * @param {number} serviceId - Optional: filter by service ID
 */
export async function getAvailableTimeSlots(serviceId) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let url = `${API_URL}/time-slots/available`;
    if (serviceId) {
      url += `?serviceId=${serviceId}`;
    }

    console.log("🔍 Fetching from URL:", url);
    
    const res = await fetch(url, {
      method: "GET",
      headers: headers
    });

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ API Error:", res.status, errorText);
      throw new Error(`Failed to fetch time slots (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    console.log("✅ Time slots received:", data);
    return data;
  } catch (err) {
    console.error("❌ Network/Parse error:", err);
    throw new Error(err.message || "Network error");
  }
}

/**
 * Book an appointment
 * @param {Object} bookingData - { patientId, serviceId, timeSlotId }
 * @returns {Promise<Object>} appointment data
 */
export async function bookAppointment(bookingData) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/appointments/book`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        ...bookingData,
        status: "PENDING"
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to book appointment");
    }

    return await res.json();
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
}

/**
 * Get all services
 * @returns {Promise<Array>} list of dental services
 */
export async function getServices() {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/services`;
    console.log("🔍 Fetching services from:", url);
    
    const res = await fetch(url, {
      method: "GET",
      headers: headers
    });

    console.log("📡 Services response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error:", res.status, errorText);
      throw new Error(`Failed to fetch services (${res.status})`);
    }

    const data = await res.json();
    console.log("✅ Services data:", data);
    return data;
  } catch (err) {
    console.error("❌ Error fetching services:", err);
    return []; // Return empty array if fetch fails
  }
}

/**
 * Get all clinic hours (admin availability config)
 * @returns {Promise<Array>} list of clinic hours for each day
 */
export async function getClinicHours() {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/clinic-hours`;
    console.log("🔍 Fetching clinic hours from:", url);
    
    const res = await fetch(url, {
      method: "GET",
      headers: headers
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch clinic hours (${res.status})`);
    }

    const data = await res.json();
    console.log("✅ Clinic hours:", data);
    return data;
  } catch (err) {
    console.error("❌ Error fetching clinic hours:", err);
    return [];
  }
}

/**
 * Update clinic hours for a specific day
 * @param {number} dayOfWeek - 0-6 (Monday-Sunday)
 * @param {Object} config - {isOperating, morningStart, morningEnd, afternoonStart, afternoonEnd}
 */
export async function updateClinicHours(dayOfWeek, config) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/clinic-hours/${dayOfWeek}`;
    
    const res = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(config)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Failed to update clinic hours`);
    }

    const data = await res.json();
    console.log("✅ Clinic hours updated:", data);
    return data;
  } catch (err) {
    console.error("❌ Error updating clinic hours:", err);
    throw err;
  }
}
