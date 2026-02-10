const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function getPlayerInfo() {
    const USERNAME = 'alice'

    // const res = await fetch(`/auth/me`, {
    //         method: "GET",
    //         credentials: "include",
    // })
    // console.log(res)
    
    // const me_user = await res.json();
    // console.log(me_user)
    const userIdResponse = await fetch(`${API_BASE}/userid/${USERNAME}`)
	if (!userIdResponse.ok) throw new Error('Failed to resolve user id')

    const { id } = await userIdResponse.json()
    
    const response = await fetch(`${API_BASE}/users/${id}`)
    if (!response.ok) throw new Error('Failed to resolve user profile')

    const dataJson = await response.json()
    const data = JSON.stringify(dataJson) 

    const blob = new Blob([data], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = USERNAME + ".json";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);
}

const DataRequester = () => {
    return (
        <button className="btn-data-request" onClick={() => getPlayerInfo()}>REQUEST DATA</button>
    )
}

export default DataRequester;