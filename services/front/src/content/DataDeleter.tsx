import { useState } from "react"

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

const DataDeleter = () => {
    const [open, setOpen] = useState(false)

    async function requestDeletion() {
        const res = await fetch(`${API_BASE}/auth/me`, {
                method: "GET",
                credentials: "include",
        })
        
        const me_user = await res.json();
        sendDeletionMail(me_user.id);
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