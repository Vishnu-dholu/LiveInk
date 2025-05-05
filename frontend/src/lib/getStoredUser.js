
export const getStoredUser = () => {
    const userData =
        localStorage.getItem("user") || sessionStorage.getItem("user");

    try {
        return userData ? JSON.parse(userData) : null;
    } catch (err) {
        console.error("Failed to parse stored user:", err);
        return null;
    }
};
