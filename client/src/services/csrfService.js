
// Read the CSRF cookie and extract its random token
export const getCsrfToken = () => {
    const csrfCookie = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('csrfToken='));

    if (!csrfCookie) {
        return null;
    }

    const cookieValue = decodeURIComponent(
        csrfCookie.substring('csrfToken='.length)
    );

    // Cookie format: randomToken.signature
    return cookieValue.split('.')[0] || null;
};

// Add the CSRF token to request headers
export const getCsrfHeaders = () => {
    const token = getCsrfToken();

    if (!token) {
        throw new Error(
            'Security token missing. Please refresh the page or log in again.'
        );
    }

    return {
        'X-CSRF-Token': token
    };
};
