interface UserInfo {
    userId: string;
    email: string;
    username: string;
}

function getUserInfoFromURL(): UserInfo | null {
    const urlParams = new URLSearchParams(window.location.search);

    const userId = urlParams.get('userId');
    const email = urlParams.get('email');
    const username = urlParams.get('username');

    if (!userId || !email || !username) {
        return null;
    }
    return { userId, email, username };
}

function handleAuthSuccess() {
    const userInfo = getUserInfoFromURL();

    if (!userInfo) {
        const error = new URLSearchParams(window.location.search).get('error');

        document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
            <div class="auth-error">
                <h2>Authentication Failed</h2>
                <p>${error || 'Unknown error occurred'}</p>
                <a href="/login">Try again</a>
            </div>
        `;
        return;
    }

    document.querySelector<HTMLDivElement>('#index')!.innerHTML = `
        <div class="auth-success">
            <h2>Welcome, ${userInfo.username}!</h2>
            <p>Authentication successful. Redirecting...</p>
            <div class="spinner"></div>
        </div>
    `;


    localStorage.setItem('googleAuthUser', JSON.stringify(userInfo));

    // TODO: Appeler le service JWT ici

    setTimeout(() => {
        console.log('User authenticated:', userInfo);
        window.location.href = '/home';
    }, 2000);
}

handleAuthSuccess();
