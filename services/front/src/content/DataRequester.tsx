// @ts-ignore
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

async function getlogin()
{
    const username = "alice"
    const password = "password123"
    const res = fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
    })
    //.then((res) => res.json())
    //.then((data) => console.log(data))
    //.catch((err) => console.error(err));
}

async function getPlayerInfo() {
    const USERNAME = 'alice'

    await getlogin();
    const res = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            credentials: "include",
    })
    console.log("Response from /auth/me:", res);
    
    const me_user = await res.json();
    console.log(me_user)
    // const userIdResponse = await fetch(`${API_BASE}/userid/${USERNAME}`)
	// if (!userIdResponse.ok) throw new Error('Failed to resolve user id')

    // const { id } = await userIdResponse.json()
    
    // const response = await fetch(`${API_BASE}/users/${id}`)
    // if (!response.ok) throw new Error('Failed to resolve user profile')
    // const dataJson = await response.json()
    const data = JSON.stringify(me_user) 

    const blob = new Blob([data], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = USERNAME + ".json";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);

    sendExportMail(me_user)
}

const DataRequester = () => {
    return (
        <button className="btn-data-request" onClick={() => getPlayerInfo()}>REQUEST DATA</button>
    )
}

export default DataRequester;