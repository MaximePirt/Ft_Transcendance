const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost/api'

async function sendExportMail(json: any) {
    const res = await fetch(`${API_BASE}/user/export-data/mail`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: 1,
            data: json,
        }),
    });

    if (!res.ok) {
        throw new Error("Erreur lors de l'envoi du mail");
    }
}

async function sendSignupMail() {
    const res = await fetch(`${API_BASE}/user/signup/mail`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: 1,
            codeValidation: "125068",
        }),
    });

    if (!res.ok) {
        throw new Error("Erreur lors de l'envoi du mail");
    }
}

async function getPlayerInfo() {
    const res = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include",
    })
    
    const me_user = await res.json();
    const data = JSON.stringify(me_user) 

    const blob = new Blob([data], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = me_user.username + ".json";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);

    sendExportMail(me_user);
    sendSignupMail();
}

const DataRequester = () => {
    return (
        <button className="btn-data-request" onClick={() => getPlayerInfo()}>REQUEST DATA</button>
    )
}

export default DataRequester;