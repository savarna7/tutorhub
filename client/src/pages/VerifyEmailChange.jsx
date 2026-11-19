
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmailChange } from '../services/profileService';
import { useAuth } from '../context/useAuth';

function VerifyEmailChange() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
const { isAuthenticated, refreshUser } = useAuth();
    const handleVerification = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await verifyEmailChange(token);
            if (isAuthenticated) {
    await refreshUser();
}
            setSuccess(result.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="profile-page">
            <section className="profile-section">
                <h1>Verify Your New Email</h1>

                {!token && (
                    <p className="profile-error">
                        Verification token is missing. Please use the link
                        from your verification email.
                    </p>
                )}

                {token && !success && (
                    <>
                        <p>
                            Click the button below to confirm your new
                            TutorHub email address.
                        </p>

                        <button
                            onClick={handleVerification}
                            disabled={loading}
                        >
                            {loading
                                ? 'Verifying...'
                                : 'Confirm Email Change'}
                        </button>
                    </>
                )}

                {success && (
                    <p className="profile-success">
                        {success}
                    </p>
                )}

                {error && (
                    <p className="profile-error">
                        {error}
                    </p>
                )}

                {success && (
                    <p>
                        <Link to="/profile">Return to My Profile</Link>
                    </p>
                )}

                {error && (
                    <p>
                        <Link to="/profile">Return to My Profile</Link>
                    </p>
                )}
            </section>
        </main>
    );
}

export default VerifyEmailChange;
