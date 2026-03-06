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

async function requestDeletion() {
    const res = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include",
    })
    
    const me_user = await res.json();
    sendDeletionMail(me_user.id);
}

const DataDeleter = () => {
    return (
        <button className="btn-data-delete" onClick={() => requestDeletion()}>DELETE ACCOUNT</button>
    )
}

export default DataDeleter;