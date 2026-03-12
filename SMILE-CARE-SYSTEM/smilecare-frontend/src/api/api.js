const API_URL = "http://localhost:8082/api/v1";

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
    const response = await fetch("http://localhost:8082/api/v1/register", {
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
