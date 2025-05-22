export async function loginUser(credentials) {
    const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials)
    })

    if (!response.ok) throw new Error("Login failed")

    const data = await response.json()
    localStorage.setItem("token", data.token)
    return data
}

export function logout() {
    localStorage.removeItem("token")
    window.location.href = "/login"
}