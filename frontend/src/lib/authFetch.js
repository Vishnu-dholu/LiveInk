export async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token")
    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    }

    const response = await fetch(url, {
        ...options,
        headers,
    })

    if (response.status === 401) {
        console.error("Unauthorized")
    }

    return response
}