const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost'

function getsignup()
{
    const email = "test@gmail.com"
    const username = "test"
    const password = "test"

    fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
    })
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.error(err));
}

// fastify.post("/signin", async function (request, reply) {
// 	try {
// 		const response = await fetch(`${user_api_url}/signin`, {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 		},
// 		credentials: "include",
// 		body: JSON.stringify(request.body),
// 		onRequest: fastify.authenticate,
// 		});
// 		if (!response.ok) {
// 		const errmsg = await response.json();
// 		return reply.code(404).send(errmsg);
// 		}
// 		else
// 			console.log("user sign in !");

// 		const user = Object.create(User);
// 		user.username = await request.body.username;
// 		user.id = await getId(user.username);
// 		if (!user.id) {
// 			return reply.code(404).send({ error: "User ID not found" });
// 		}
// 		user.token = JWTgenerator(user);
// 		reply.setCookie("token", user.token, {
// 		httpOnly: true,
// 		signed: false,
// 		secure: true,
// 		path: "/",
// 		});

// 	} catch (e) {
// 		console.error(e);
// 	}
// 	});

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
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.error(err));
}

async function getPlayerInfo() {
    const USERNAME = 'alice'

    // await getlogin();
    // const res = await fetch(`${API_BASE}/auth/me`, {
    //         method: "GET",
    //         credentials: "include",
    // })
    // console.log("Response from /auth/me:", res);
    
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