import axiosInstance from "./axiosInstance";

export async function authFetch(url, options = {}) {
    try {
        const response = await axiosInstance({
            url,
            method: options.method || "GET",
            data: options.body ? JSON.parse(options.body) : undefined,
        })

        return response
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized")
        }
        throw error
    }
}
