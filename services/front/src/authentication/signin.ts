import '../style/signin.css'

document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
    <p class="title">SIGN IN</p>
    <div class='square'>
        <form method='post'>
            <input name='username' type='text' placeholder='username'/>
            <br />
            <input name='password' type='password' placeholder='password'/>
            <br />
            <input id='button' type='submit' name='signin'/>
        </form>

        <div class="separator">
            <span>OR</span>
        </div>

        <button id='google-signin-btn' type='button' class='google-btn'>
            Sign in with Google
        </button>
    </div>
`;


const googleBtn = document.getElementById('google-signin-btn') as HTMLButtonElement;

googleBtn.addEventListener('click', () => {
    window.location.href = 'http://localhost:3003/auth/google';
});