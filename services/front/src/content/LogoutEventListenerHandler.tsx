import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const LogoutEventListenerHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleStorage = (event: any) => {
            if (event.key === "auth-event") {
                navigate('/');
                window.location.reload();
            }
        }

        window.addEventListener("storage", handleStorage)
        return () => {
            window.removeEventListener("storage", handleStorage)
        }
    }, [])
    return null;
}

export default LogoutEventListenerHandler;