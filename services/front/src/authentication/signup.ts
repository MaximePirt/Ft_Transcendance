import '../style/signin.css'

document.querySelector<HTMLDivElement>('#authentication')!.innerHTML = `
    <p class="title">SIGN UP</p>
    <div class='square'>
        <form method='post'>
            <input name='username' type='text' placeholder='username'/>
            <br />
            <input name='email' type='text' placeholder='email'/>
            <br />
            <input name='password' type='password' placeholder='password'/>
            <br />
            <input name='confpassword' type='password' placeholder='confirm password'/>
            <br />
            <input id='button' type='submit' name='signin'/>
        </form>
    </div>
`;