import { authFetch } from "@/lib/authFetch";
import { useEffect, useState } from "react";

export default function useCurrentUser() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await authFetch("http://localhost:5000/api/user/me")
                const data = await res.json()
                setUser(data)
            } catch (err) {
                console.error("Failed to fetch user:", err)
            }
        }

        fetchUser()
    }, [])

    return user
}