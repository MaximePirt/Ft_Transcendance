import '../style/signup.css'

document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
    <p class="title">SIGN UP</p>
    <div class='square'>
        <form method='post'>
            <input id="username" name='username' type='text' placeholder='username'/>
            <br />
            <input id="email" name='email' type='text' placeholder='email'/>
            <br />
            <input id="password" name='password' type='password' placeholder='password'/>
            <br />
            <input id="confpass" name='confpassword' type='password' placeholder='confirm password'/>
            <br />
            <input id='button' type='submit' name='signin' placeholder='submit'/>
        </form>
    </div>
`;

const username = document.getElementById("username") as HTMLInputElement;
const email = document.getElementById("email") as HTMLInputElement;
const password = document.getElementById("password") as HTMLInputElement;
const conf = document.getElementById("confpass") as HTMLInputElement;
const submit = document.getElementById("button") as HTMLButtonElement;
//check la qualité du mot de passe

interface User {
	username: string,
	email: string,
	password: string
}

async function registerUser() {
	if (conf.value != password.value) {
		console.log("oops...");
		return;
	}
	if (!username.value.length || !email.value.length
		|| !password.value.length || !conf.value.length) {
		console.log("data length...");
		return;
	}

	let myUser: User = { username: username.value, email: email.value, password: password.value };
	try {
		const response = await fetch("http://localhost:3000/register", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(myUser)
		});
		console.log("Data sent !");
	} catch (e) {
		console.error("Error", e);
	}
}

submit.addEventListener("click", () => {
	registerUser();
});
