import '../style/signup.css'

const index = document.querySelector<HTMLDivElement>('#index');

index!.innerHTML = `
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
            <input id='button' name='signin' placeholder='submit'/>
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
	const expmail: RegExp = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
	const exppass: RegExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
	let p = document.createElement('p');
	if (conf.value != password.value) {
		p.id = 'formerrpass';
		p.innerText = `password and confirm password are not the same.`;
		if (!document.getElementById("formerrpass"))
			index?.appendChild(p);
		return ;
	}
	else
		document.getElementById("formerrpass")?.remove();
	if (username.value.length == 0 || email.value.length == 0
		|| password.value.length == 0 || conf.value.length == 0) {
		p.id = 'formerrlen';
		p.innerText = `please fully fill the form.`;
		if (!document.getElementById("formerrlen"))
			index?.appendChild(p);
		return ;
	}
	else
		document.getElementById("formerrlen")?.remove();
	if (!expmail.test(email.value)) {
		p.id = 'formerrmail';
		p.innerText = `wrong email format.`;
		if (!document.getElementById("formerrmail"))
			index?.appendChild(p);
		return ;
	}
	else
		document.getElementById('formerrmail')?.remove();
	if (!exppass.test(password.value) && password.value.length < 12) {
		p.id = 'formerrpass';
		p.innerText = `Password must contain uppercase, lowercase, numbers, symbols
			and a length of at least 12 characters.`;
		if (!document.getElementById("formerrpass"))
			index?.appendChild(p);
		return ;
	}
	else 
		document.getElementById('formerrpass')?.remove();
	let myUser: User = { username: username.value, email: email.value, password: password.value };
	try {
		const response = await fetch("http://localhost:3003/signup", {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(myUser)
		});
		const data = await response.json();
		console.log(data.token);
	} catch (e) {
		console.error(e);
	}
}

submit.addEventListener("click", (e) => {
	e.preventDefault();
	registerUser();
});
