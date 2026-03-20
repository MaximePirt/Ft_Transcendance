import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '../contexts/AuthContext'

const LogoutEventListenerHandler = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const socket = new WebSocket(`${proto}//${window.location.host}/ws/user/logout`);

        socket.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "logout") {
                await logout();
                await navigate("/");
                window.location.reload();
            }
        };

        socket.onerror = (err) => {
            console.error("WebSocket error", err);
        };

        return () => {
            socket.close();
        };
    }, [])
    return null;
}

export default LogoutEventListenerHandler;