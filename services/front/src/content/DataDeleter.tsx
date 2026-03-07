import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost/api'

async function sendDeletionMail(id: number) {
    const res = await fetch(`${API_BASE}/user/delete-data/mail`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: id,
        }),
    });

    if (!res.ok) {
        throw new Error("Erreur lors de l'envoi du mail");
    }
}

async function handleDeletion(id: number) {
    const res = await fetch(`${API_BASE}/user/delete-user`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: id,
        }),
    });

    if (!res.ok) {
        throw new Error("Erreur lors de la suppression du compte");
    }
}

const DataDeleter = () => {
    const [logoutError, setLogoutError] = useState('');
    const [open, setOpen] = useState(false);
    const navigate = useNavigate()
    const { logout } = useAuth();


    async function handleLogout() {
        try {
            const response = await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();
            if (!response.ok) {
                setLogoutError(data.error || "Something went wrong");
                return;
            } else
                logout();
        } catch (e) {
            setLogoutError("Cannot connect to authentication server");
            return;
        }
    }

    async function requestDeletion() {
        const res = await fetch(`${API_BASE}/auth/me`, {
                method: "GET",
                credentials: "include",
        })
        
        const me_user = await res.json();
        handleLogout();
        navigate('/');
        sendDeletionMail(me_user.id);
        handleDeletion(me_user.id);
        setOpen(false);
    }

    return (
        <>
            <button className="btn-data-delete" onClick={() => setOpen(true)}>DELETE ACCOUNT</button>

            {open && (
            <div className="login-overlay" role="dialog" aria-modal="true">
                <div className="login-card">

                    <div className="login-card__head">
                        <h2 style={{textAlign:"center"}}>Delete your account?</h2>
                        <button className="close" onClick={() => setOpen(false)}>
                            x
                        </button>
                    </div>

                    <p style={{textAlign:"center"}}>Are you sure you want to delete your account ?</p>
                    <p style={{textAlign:"center"}}>You will not be able to recover your data after this.</p>

                    <div style={{display:"flex", gap:"55%", marginTop:"20px"}}>
                        <button className="btn ghost" onClick={() => setOpen(false)}>
                            No
                        </button>

                        <button className="btn danger" onClick={requestDeletion}>
                            Yes
                        </button>
                    </div>

                </div>
            </div>
            )}
        </>
    )
}

export default DataDeleter;