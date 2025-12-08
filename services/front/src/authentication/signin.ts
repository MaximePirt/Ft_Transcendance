import '../style/signin.css';
import i18next from '../multi-languages/config';
import { createLanguageSwitcher, initLanguageSwitcher } from '../multi-languages/components/languageSwitcher';

document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
    ${createLanguageSwitcher()}
    <p class="title">${i18next.t('auth.signin').toUpperCase()}</p>
    <div class='square'>
        <form method='post'>
            <input name='username' type='text' placeholder='${i18next.t('auth.username')}'/>
            <br />
            <input name='password' type='password' placeholder='${i18next.t('auth.password')}'/>
            <br />
            <input id='button' type='submit' name='signin'/>
        </form>

        <div class="separator">
            <span>${i18next.t('auth.or')}</span>
        </div>

        <button id='google-signin-btn' type='button' class='google-btn'>
            ${i18next.t('auth.googleSignin')}
        </button>
    </div>
`;

initLanguageSwitcher();

const googleBtn = document.getElementById('google-signin-btn') as HTMLButtonElement;
googleBtn.addEventListener('click', () => {
    window.location.href = 'http://localhost:3003/auth/google';
});