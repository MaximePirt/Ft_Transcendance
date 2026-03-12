const API_BASE = import.meta.env.VITE_API_URL || "https://localhost/api";

async function logoutUser(
    logout: () => void,
    navigate: (path: string) => void,
    setError: (msg: string) => void) {

    try {
        const response = await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();
        if (!response.ok) {
            setError(data.error || "Something went wrong");
            return;
        }

        logout();
        navigate("/");
    } catch {
        setError("Cannot connect to authentication server");
    }
}

export default logoutUser;