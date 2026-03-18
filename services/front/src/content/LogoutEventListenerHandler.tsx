import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '../contexts/AuthContext'

const LogoutEventListenerHandler = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const socket = new WebSocket(`${proto}//${window.location.host}/ws/user/logout`);

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log("== A RECU UN MESSAGE ===\n");
            console.log(msg);
            if (msg.type === "logout") {
                console.log("== A RECU SON MESSAGE DE LOGOUT ===");
                logout();
                navigate("/");
                window.location.reload();
                // if cookie : delete cookie
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