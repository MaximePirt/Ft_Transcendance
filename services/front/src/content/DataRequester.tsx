import { runtimeEnv } from '../runtime-env'
import { useTranslation } from 'react-i18next'

const API_BASE = runtimeEnv.API_URL ?? 'https://localhost/api'


async function sendExportMail(json: any, id: number) {
    const res = await fetch(`${API_BASE}/user/export-data/mail`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: id,
            data: json,
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

    sendExportMail(me_user, me_user.id);
}

const DataRequester = () => {
    const { t } = useTranslation()

    return (
        <button className="btn-data-request" onClick={() => getPlayerInfo()}>{t('request_data_button')}</button>
    )
}

export default DataRequester;