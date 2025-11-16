import '../style/signin.css'

document.querySelector<HTMLDivElement>('#authentication')!.innerHTML = `
    <p class="title">SIGN IN</p>
    <div class='square'>
        <form method='post'>
            <input name='username' type='text' placeholder='username'/>
            <br />
            <input name='password' type='password' placeholder='password'/>
            <br />
            <input id='button' type='submit' name='signin'/>
        </form>
    </div>
`;