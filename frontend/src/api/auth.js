const rawBackend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
export const BACKEND_URL = rawBackend.replace(/\/+$/, "");

export async function loginUser(credentials) {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function registerUser(userData) {
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Registration failed");
  return data;
}

// Exchanges the one-time code from the OAuth redirect for a JWT
export async function exchangeOAuthCode(code) {
  const response = await fetch(`${BACKEND_URL}/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "OAuth login failed");
  return data.token;
}

export async function getMe(token) {
  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch user");
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  window.location.href = "/login";
}
