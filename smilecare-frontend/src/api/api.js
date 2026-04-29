export const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : "http://localhost:8085/api/v1";

/**
 * Get authorization headers if token exists
 */
function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

/**
 * Helper function to make fetch requests with retry logic
 * @param {string} url - The URL to fetch from
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @param {number} initialDelay - Initial delay in ms (default: 500)
 * @returns {Promise<Response>} The fetch response
 */
async function fetchWithRetry(url, options = {}, maxRetries = 2, initialDelay = 500) {
  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.debug(`[API] Attempt ${attempt + 1}/${maxRetries + 1} for ${options.method || 'GET'} ${url}`);
      const res = await fetch(url, options);
      
      // Don't retry on 4xx errors (client errors) - only on 5xx or network errors
      if (!res.ok && res.status >= 400 && res.status < 500) {
        return res; // Return bad response immediately for client errors
      }
      
      return res;
    } catch (err) {
      lastError = err;
      console.warn(`[API] Request failed (attempt ${attempt + 1}): ${err.message}`);
      
      if (attempt < maxRetries) {
        console.debug(`[API] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError || new Error("Network request failed after retries");
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
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} password
 * @returns {Promise<Object>} new user data
 * @throws {Error} with backend error message if registration fails
 */
export async function register(firstName, lastName, email, password, confirmPassword) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
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
 * Fetch all registered users/clients (for admin)
 * @returns {Promise<Array>} Array of user objects
 * @throws {Error} with descriptive error message
 */
export async function getAllUsers() {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("[API] Fetching all clients from:", `${API_URL}/users`);
    const res = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.error("[API] Error response status:", res.status);
      const errData = await res.json().catch(() => null);
      throw new Error((errData && errData.message) ? errData.message : "Failed to fetch clients.");
    }

    const data = await res.json();
    console.log(`[API] Successfully fetched clients, count: ${data?.length || 0}`);
    return data;
  } catch (err) {
    console.error("[API] getAllUsers error:", err.message);
    throw new Error(err.message || "Server error. Please try again.");
  }
}

/**
 * Get all appointments (for admin)
 * @returns {Promise<Array>} Array of appointment objects
 * @throws {Error} with descriptive error message
 */
export async function getAllAppointments() {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("[API] Fetching all appointments from:", `${API_URL}/appointments`);
    const res = await fetchWithRetry(`${API_URL}/appointments`, {
      method: "GET",
      headers: headers
    }, 2);

    if (!res.ok) {
      let errorMessage = `Server error: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        const errorText = await res.text();
        if (errorText) {
          errorMessage = errorText.substring(0, 200); // Limit error message length
        }
      }
      
      console.error("[API] Fetch failed with status", res.status, ":", errorMessage);
      
      if (res.status === 500) {
        throw new Error("Server error: The backend encountered an issue. Please try again in a moment.");
      } else if (res.status === 401 || res.status === 403) {
        throw new Error("Access denied. Please log in again.");
      } else if (res.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }
      
      throw new Error(errorMessage || "Failed to fetch appointments");
    }

    const data = await res.json();
    console.log("[API] Successfully fetched appointments, count:", data.length);
    return data;
  } catch (err) {
    console.error("[API] getAllAppointments error:", err.message);
    throw new Error(err.message || "Network error: Unable to reach the server");
  }
}

/**
 * Get appointments for a specific user
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} Array of appointment objects
 * @throws {Error} with descriptive error message
 */
export async function getUserAppointments(userId) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("[API] Fetching appointments for user:", userId);
    const res = await fetchWithRetry(`${API_URL}/appointments/user/${userId}`, {
      method: "GET",
      headers: headers
    }, 2);

    if (!res.ok) {
      let errorMessage = `Server error: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        const errorText = await res.text();
        if (errorText) {
          errorMessage = errorText.substring(0, 200);
        }
      }
      
      console.error("[API] Fetch failed with status", res.status, ":", errorMessage);
      
      if (res.status === 404) {
        throw new Error("User not found");
      } else if (res.status === 500) {
        throw new Error("Server error: The backend encountered an issue. Please try again in a moment.");
      } else if (res.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }
      
      throw new Error(errorMessage || "Failed to fetch appointments");
    }

    const data = await res.json();
    console.log("[API] Successfully fetched user appointments, count:", data.length);
    return data;
  } catch (err) {
    console.error("[API] getUserAppointments error:", err.message);
    throw new Error(err.message || "Network error: Unable to reach the server");
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
 * Delete an appointment (admin only)
 * @param {number} appointmentId - The appointment ID to delete
 * @returns {Promise<Object>} Success response
 * @throws {Error} with descriptive error message
 */
export async function deleteAppointment(appointmentId) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("[API] Deleting appointment - ID:", appointmentId, "Type:", typeof appointmentId);
    
    // Validate appointment ID
    if (!appointmentId || appointmentId <= 0) {
      console.error("[API] Invalid appointment ID:", appointmentId);
      throw new Error("Invalid appointment ID: " + appointmentId);
    }

    const url = `${API_URL}/appointments/${appointmentId}`;
    console.log("[API] DELETE request to:", url);
    
    const res = await fetch(url, {
      method: "DELETE",
      headers: headers
    });

    console.log("[API] Response status:", res.status, res.statusText);

    if (!res.ok) {
      let errorMessage = `Server error: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
        console.log("[API] Error response data:", errorData);
      } catch {
        const errorText = await res.text();
        if (errorText) {
          errorMessage = errorText.substring(0, 200);
          console.log("[API] Error response text:", errorText);
        }
      }
      
      console.error("[API] Delete failed with status", res.status, ":", errorMessage);
      
      if (res.status === 404) {
        throw new Error("Appointment not found (ID: " + appointmentId + "). It may have already been deleted.");
      } else if (res.status === 403) {
        throw new Error("Access denied. Only admins can delete appointments.");
      } else if (res.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }
      
      throw new Error(errorMessage || "Failed to delete appointment");
    }

    const data = await res.json();
    console.log("[API] ✅ Appointment deleted successfully - Response:", data);
    return data;
  } catch (err) {
    console.error("[API] ❌ deleteAppointment error:", err.message);
    throw new Error(err.message || "Network error");
  }
}

/**
 * Format a JavaScript Date to YYYY-MM-DD string in local timezone
 * This is critical for consistent date handling between frontend and backend
 */
function formatDateToISO(date) {
  if (!date) return null;
  
  // Convert JavaScript Date to local timezone YYYY-MM-DD
  // (not UTC which would use toISOString())
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get available time slots
 * @param {number} serviceId - Optional: filter by service ID
 * @param {Date} selectedDate - Optional: filter by specific date
 * @returns {Promise<Array>} Array of available time slot objects
 */
export async function getAvailableTimeSlots(serviceId, selectedDate = null, abortSignal = null) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Build URL with parameters
    let url = `${API_URL}/time-slots/available`;
    const params = new URLSearchParams();
    
    if (serviceId) {
      params.append('serviceId', serviceId);
      console.log("🔍 Service ID:", serviceId);
    }
    
    if (selectedDate) {
      const formattedDate = formatDateToISO(selectedDate);
      params.append('date', formattedDate);
      console.log("🔍 Selected Date:", formattedDate);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log("🔍 Fetching from URL:", url);
    
    // Build fetch options with abort signal if provided
    const fetchOptions = {
      method: "GET",
      headers: headers
    };
    
    if (abortSignal) {
      fetchOptions.signal = abortSignal;
    }
    
    const res = await fetch(url, fetchOptions);

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ API Error:", res.status, errorText);
      throw new Error(`Failed to fetch time slots (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    console.log("✅ Time slots received:", data, `(${data?.length || 0} slots)`);
    return data;
  } catch (err) {
    // Re-throw AbortError as-is (will be caught in BookPage)
    if (err.name === "AbortError") {
      throw err;
    }
    
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

    console.log("📅 [bookAppointment] Sending booking data:", bookingData);

    // Ensure all required fields are present
    const payload = {
      patientId: bookingData.patientId,
      serviceId: bookingData.serviceId,
      timeSlotId: bookingData.timeSlotId,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      appointmentDate: bookingData.appointmentDate,
      status: "PENDING"
    };

    const res = await fetch(`${API_URL}/appointments/book`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({message: "Unknown error"}));
      console.error("❌ [bookAppointment] Error response:", errorData);
      throw new Error(errorData.message || `Failed to book appointment (${res.status})`);
    }

    const result = await res.json();
    console.log("✅ [bookAppointment] Booking successful:", result);
    return result;
  } catch (err) {
    console.error("❌ [bookAppointment] Error:", err);
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
 * Create a new dental service
 * @param {Object} serviceData - {name, description, price, duration, icon}
 * @returns {Promise<Object>} newly created service
 */
export async function addService(serviceData) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/services`;
    console.log("➕ Creating new service:", serviceData.name);
    
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        name: serviceData.name,
        description: serviceData.desc || serviceData.description,
        price: serviceData.price,
        durationUnit: serviceData.durationUnit || "minutes",
        duration_unit: serviceData.durationUnit || "minutes",
        durationMinutes: serviceData.duration_minutes || 30,
        duration_minutes: serviceData.duration_minutes || 30,
        icon: serviceData.icon
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to create service:", res.status, errorText);
      throw new Error(`Failed to create service (${res.status})`);
    }

    const newService = await res.json();
    console.log("✅ Service created successfully:", newService);
    return newService;
  } catch (err) {
    console.error("❌ Error creating service:", err);
    throw err;
  }
}

/**
 * Update an existing dental service
 * @param {number} serviceId - Service ID to update
 * @param {Object} serviceData - {name, description, price, duration, icon}
 * @returns {Promise<Object>} updated service
 */
export async function updateService(serviceId, serviceData) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/services/${serviceId}`;
    console.log("✏️ Updating service:", serviceId);
    
    const res = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({
        name: serviceData.name,
        description: serviceData.desc || serviceData.description,
        price: serviceData.price,
        durationUnit: serviceData.durationUnit || "minutes",
        duration_unit: serviceData.durationUnit || "minutes",
        durationMinutes: serviceData.duration_minutes || 30,
        duration_minutes: serviceData.duration_minutes || 30,
        icon: serviceData.icon
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to update service:", res.status, errorText);
      throw new Error(`Failed to update service (${res.status})`);
    }

    const updatedService = await res.json();
    console.log("✅ Service updated successfully:", updatedService);
    return updatedService;
  } catch (err) {
    console.error("❌ Error updating service:", err);
    throw err;
  }
}

/**
 * Delete a dental service
 * @param {number} serviceId - Service ID to delete
 * @returns {Promise<void>}
 */
export async function deleteService(serviceId) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/services/${serviceId}`;
    console.log("🗑️ Deleting service:", serviceId);
    
    const res = await fetch(url, {
      method: "DELETE",
      headers: headers
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to delete service:", res.status, errorText);
      throw new Error(`Failed to delete service (${res.status})`);
    }

    console.log("✅ Service deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting service:", err);
    throw err;
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
      headers: headers,
      timeout: 10000
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ API returned ${res.status}:`, errorText);
      throw new Error(`Failed to fetch clinic hours (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn("⚠️ No clinic hours data returned from API");
      return [];
    }
    
    console.log("✅ Clinic hours fetched successfully:", data);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Error fetching clinic hours:", err.message || err);
    throw new Error(err.message || "Failed to fetch clinic hours. Please try again.");
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
      const errorText = await res.text();
      console.error(`❌ Update failed (${res.status}):`, errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Failed to update clinic hours`);
      } catch {
        throw new Error(`Failed to update clinic hours (${res.status})`);
      }
    }

    const data = await res.json();
    console.log("✅ Clinic hours updated successfully:", data);
    return data;
  } catch (err) {
    console.error("❌ Error updating clinic hours:", err);
    throw err;
  }
}
