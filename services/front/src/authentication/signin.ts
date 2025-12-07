import '../style/signin.css'

const index = document.querySelector<HTMLDivElement>('#index');

index!.innerHTML = `
    <p class="title">SIGN IN</p>
    <div class='square'>
        <form method='post'>
            <input id="username" name='username' type='text' placeholder='username'/>
            <br />
            <input id="password" name='password' type='password' placeholder='password'/>
            <br />
            <input id='button' name='signin' type='button' value='submit'/>
        </form>
    </div>
`;

const username = document.getElementById("username") as HTMLInputElement;
const password = document.getElementById("password") as HTMLInputElement;
const submit = document.getElementById("button") as HTMLButtonElement;

interface User {
    username: string,
    password: string
}

let myUser: User = { username: username.value, password: password.value };
async function signinUser() {
    const p = document.createElement('p');
    if (username.value.length == 0) {
       	p.id = 'formerruser';
		p.innerText = `please enter your username.`;
		if (!document.getElementById("formerruser"))
			index?.appendChild(p);
		return; 
    } else
        document.getElementById("formerruser")?.remove();
    if (password.value.length == 0) {
        p.id = 'formerrpass';
		p.innerText = `please enter your password.`;
		if (!document.getElementById("formerrpass"))
			index?.appendChild(p);
		return; 
    } else
        document.getElementById("formerrpass")?.remove();
    try {
        const response = await fetch('http://localhost:3003/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(myUser)
        });
        console.log('data sent !');
        console.log(response);
    } catch (e) {
        console.error(e);
    }
}

submit.addEventListener("click", (e) => {
    e.preventDefault();
    signinUser();
});