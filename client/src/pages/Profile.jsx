
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getMyProfile,
    updateAccount,
    updateStudentProfile,
    updateTutorProfile,
    requestEmailChange
} from '../services/profileService';

function Profile() {
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const [accountForm, setAccountForm] = useState({
        fullName: '',
        phone: ''
    });

    const [emailForm, setEmailForm] = useState({
        newEmail: ''
    });

    const [studentForm, setStudentForm] = useState({
        educationLevel: '',
        learningGoals: ''
    });

    const [tutorForm, setTutorForm] = useState({
        qualification: '',
        experienceYears: '',
        hourlyRate: '',
        bio: ''
    });

    const hasStudentRole = profile?.roles?.includes('student');
    const hasTutorRole = profile?.roles?.includes('tutor');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getMyProfile();

                setProfile(data);

                setAccountForm({
                    fullName: data.full_name || '',
                    phone: data.phone || ''
                });

                setStudentForm({
                    educationLevel: data.education_level || '',
                    learningGoals: data.learning_goals || ''
                });

                setTutorForm({
                    qualification: data.qualification || '',
                    experienceYears: data.experience_years ?? '',
                    hourlyRate: data.hourly_rate ?? '',
                    bio: data.bio || ''
                });

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleAccountChange = (e) => {
        setAccountForm({
            ...accountForm,
            [e.target.name]: e.target.value
        });
    };

    const handleStudentChange = (e) => {
        setStudentForm({
            ...studentForm,
            [e.target.name]: e.target.value
        });
    };

    const handleTutorChange = (e) => {
        setTutorForm({
            ...tutorForm,
            [e.target.name]: e.target.value
        });
    };

    const handleAccountSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const updated = await updateAccount(accountForm);

            setProfile((prev) => ({
                ...prev,
                full_name: updated.full_name,
                phone: updated.phone
            }));

            setSuccess('Account details updated successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEmailChangeSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const result = await requestEmailChange(emailForm.newEmail);

            setSuccess(result.message);
            console.log('Email success message:', result.message);
            setEmailForm({
                newEmail: ''
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const updated = await updateStudentProfile(studentForm);

            setProfile((prev) => ({
                ...prev,
                education_level: updated.education_level,
                learning_goals: updated.learning_goals
            }));

            setSuccess('Student profile updated successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTutorSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const updated = await updateTutorProfile({
                ...tutorForm,
                experienceYears: Number(tutorForm.experienceYears),
                hourlyRate: Number(tutorForm.hourlyRate)
            });

            setProfile((prev) => ({
                ...prev,
                qualification: updated.qualification,
                experience_years: updated.experience_years,
                hourly_rate: updated.hourly_rate,
                bio: updated.bio
            }));

            setSuccess('Tutor profile updated successfully.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p>Loading profile...</p>;
    }

    if (!profile) {
        return <p>{error || 'Unable to load profile.'}</p>;
    }

    return (
        <main className="profile-page">
            <h1>My Profile</h1>
            <p>Manage your TutorHub account and profile information.</p>

            {error && <p className="profile-error">{error}</p>}
            {success && <p className="profile-success">{success}</p>}

            <section className="profile-section">
                <h2>Account Details</h2>

                <form onSubmit={handleAccountSubmit}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={accountForm.fullName}
                        onChange={handleAccountChange}
                        required
                        maxLength="100"
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        value={profile.email}
                        disabled
                    />

                    <label>Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={accountForm.phone}
                        onChange={handleAccountChange}
                        maxLength="20"
                    />

                    <button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Account Details'}
                    </button>
                </form>
            </section>

            <section className="profile-section">
                <h2>Change Email Address</h2>

                <p>
                    Current email: <strong>{profile.email}</strong>
                </p>

                <form onSubmit={handleEmailChangeSubmit}>
                    <label>New Email Address</label>

                    <input
                        type="email"
                        name="newEmail"
                        value={emailForm.newEmail}
                        onChange={(e) =>
                            setEmailForm({
                                ...emailForm,
                                newEmail: e.target.value
                            })
                        }
                        placeholder="Enter your new email address"
                        required
                    />

                    <button type="submit" disabled={saving}>
                        {saving ? 'Sending...' : 'Send Verification Link'}
                    </button>
                </form>

                <p>
                    Your email address will change only after you verify
                    the new address using the link sent to your inbox.
                </p>
            </section>

            {hasStudentRole && (
                <section className="profile-section">
                    <h2>Student Profile</h2>

                    <form onSubmit={handleStudentSubmit}>
                        <label>Education Level</label>
                        <input
                            type="text"
                            name="educationLevel"
                            value={studentForm.educationLevel}
                            onChange={handleStudentChange}
                            maxLength="100"
                        />

                        <label>Learning Goals</label>
                        <textarea
                            name="learningGoals"
                            value={studentForm.learningGoals}
                            onChange={handleStudentChange}
                            rows="4"
                        />

                        <button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Student Profile'}
                        </button>
                    </form>
                </section>
            )}

            {hasTutorRole && (
                <section className="profile-section">
                    <h2>Tutor Profile</h2>

                    <form onSubmit={handleTutorSubmit}>
                        <label>Qualification</label>
                        <input
                            type="text"
                            name="qualification"
                            value={tutorForm.qualification}
                            onChange={handleTutorChange}
                            maxLength="150"
                        />

                        <label>Years of Experience</label>
                        <input
                            type="number"
                            name="experienceYears"
                            value={tutorForm.experienceYears}
                            onChange={handleTutorChange}
                            min="0"
                            max="999.9"
                            step="0.1"
                            required
                        />

                        <label>Hourly Rate (₹)</label>
                        <input
                            type="number"
                            name="hourlyRate"
                            value={tutorForm.hourlyRate}
                            onChange={handleTutorChange}
                            min="0"
                            step="0.01"
                            required
                        />

                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={tutorForm.bio}
                            onChange={handleTutorChange}
                            rows="4"
                        />

                        <button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Tutor Profile'}
                        </button>
                    </form>
                </section>
            )}
        </main>
    );
}

export default Profile;
