
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getTutors } from '../services/tutorService';

function Tutors() {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search, filter and sorting states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [sortBy, setSortBy] = useState('default');

    useEffect(() => {
        const fetchTutors = async () => {
            try {
                const data = await getTutors();
                setTutors(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTutors();
    }, []);

    // Get unique subject names from all tutors
    const subjects = useMemo(() => {
        const allSubjects = tutors.flatMap((tutor) =>
            Array.isArray(tutor.subjects) ? tutor.subjects : []
        );

        return [...new Set(allSubjects.map((subject) => subject.name))]
            .sort((a, b) => a.localeCompare(b));
    }, [tutors]);

    // Apply search, subject filter and sorting
    const filteredTutors = useMemo(() => {
        let result = tutors.filter((tutor) => {
            const search = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !search ||
                tutor.full_name.toLowerCase().includes(search) ||
                (tutor.qualification || '').toLowerCase().includes(search) ||
                (tutor.bio || '').toLowerCase().includes(search) ||
                (tutor.subjects || []).some((subject) =>
                    subject.name.toLowerCase().includes(search)
                );

            const matchesSubject =
                !selectedSubject ||
                (tutor.subjects || []).some(
                    (subject) => subject.name === selectedSubject
                );

            return matchesSearch && matchesSubject;
        });

        if (sortBy === 'price-low') {
            result.sort(
                (a, b) => Number(a.hourly_rate) - Number(b.hourly_rate)
            );
        } else if (sortBy === 'price-high') {
            result.sort(
                (a, b) => Number(b.hourly_rate) - Number(a.hourly_rate)
            );
        } else if (sortBy === 'experience') {
            result.sort(
                (a, b) =>
                    Number(b.experience_years) -
                    Number(a.experience_years)
            );
        }

        return result;
    }, [tutors, searchTerm, selectedSubject, sortBy]);

    if (loading) {
        return <p>Loading tutors...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <main className="tutors-page">
            <h1>Find Your Perfect Tutor</h1>

            <p className="tutors-subtitle">
                Learn from experienced tutors and achieve your goals.
            </p>

            {/* Search and filter controls */}
            <div className="tutor-filters">
                <input
                    type="text"
                    placeholder="Search by name, subject or qualification..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                >
                    <option value="">All Subjects</option>

                    {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                            {subject}
                        </option>
                    ))}
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="default">Sort By: Default</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="experience">Experience: High to Low</option>
                </select>
            </div>

            <p className="tutor-results-count">
                Showing {filteredTutors.length} of {tutors.length} tutors
            </p>

            <div className="tutors-grid">
                {filteredTutors.map((tutor) => (
                    <article className="tutor-card" key={tutor.tutor_id}>
                        <div className="tutor-card-header">
                            <div className="tutor-avatar">
                                {tutor.full_name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <h2>{tutor.full_name}</h2>
                                <p>
                                    {tutor.qualification ||
                                        'Qualification not provided'}
                                </p>
                            </div>
                        </div>

                        <p className="tutor-bio">
                            {tutor.bio || 'No introduction provided yet.'}
                        </p>

                        <p>
                            <strong>Experience:</strong>{' '}
                            {Number(tutor.experience_years)} years
                        </p>

                        <div className="tutor-subjects">
                            {(tutor.subjects || []).map((subject) => (
                                <span key={subject.id}>
                                    {subject.name}
                                </span>
                            ))}
                        </div>

                        <div className="tutor-card-footer">
                            <strong>
                                ₹{Number(tutor.hourly_rate).toLocaleString('en-IN')}/hr
                            </strong>

                            <Link
                                to={`/tutors/${tutor.tutor_id}`}
                                className="view-profile-link"
                            >
                                View Profile
                            </Link>
                        </div>
                    </article>
                ))}
            </div>

            {filteredTutors.length === 0 && (
                <p>No tutors match your search or filter.</p>
            )}
        </main>
    );
}

export default Tutors;
