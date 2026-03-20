import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { runtimeEnv } from '../runtime-env'


const API_BASE = runtimeEnv.API_URL ?? 'https://localhost/api'

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
    const [open, setOpen] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const { t } = useTranslation();

    const navigate = useNavigate()
    const { logout } = useAuth();

    async function openModal() {
        setOpen(true);
        setForbidden(false);
    }

    async function requestDeletion() {     
        try {   
            const res = await fetch(`${API_BASE}/auth/me`, {
                    method: "GET",
                    credentials: "include",
            })
            const me_user = await res.json();

            const isUserInGame = await fetch(`${API_BASE}/user/user-ingame/${me_user.id}`, {
                method: "GET",
                credentials: "include",
            })
            const json = await isUserInGame.json();
            const isInGame = json.ingame;
            setForbidden(isInGame);

            if (!isInGame) {
                setOpen(false);

                await sendDeletionMail(me_user.id);
                await handleDeletion(me_user.id);
                
                navigate("/");
                logout();
            }
        } catch (error) {
            navigate("/");
            logout();
        }
    }

    return (
        <>
            <button className="btn-data-delete" onClick={() => openModal()}>{t('delete_account_button')}</button>

            {open && !forbidden && (
            <div className="login-overlay" role="dialog" aria-modal="true">
                <div className="login-card">

                    <div className="login-card__head">
                        <h2 style={{textAlign:"center"}}>{t('delete_account_title')}</h2>
                        <button className="close" onClick={() => setOpen(false)}>
                            x
                        </button>
                    </div>

                    <p style={{textAlign:"center"}}>{t('delete_account_confirm')}</p>
                    <p style={{textAlign:"center"}}>{t('delete_account_warning')}</p>

                    <div style={{display:"flex", gap:"55%", marginTop:"20px"}}>
                        <button className="btn ghost" onClick={() => setOpen(false)}>
                            {t('no')}
                        </button>

                        <button className="btn danger" onClick={requestDeletion}>
                            {t('yes')}
                        </button>
                    </div>

                </div>
            </div>
            )}
            {open && forbidden && (
            <div className="login-overlay" role="dialog" aria-modal="true">
                <div className="login-card">

                    <div className="login-card__head">
                        <button className="close" onClick={() => setOpen(false)}>
                            x
                        </button>
                    </div>

                    <div style={{textAlign:"center"}}>
                        <h2>{t('in_game_forbidden_title')}</h2>
                        <h3>{t('in_game_forbidden_desc')}</h3>

                        <button className="btn danger" onClick={() => setOpen(false)}>
                            {t('close')}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </>
    )
}

export default DataDeleter;