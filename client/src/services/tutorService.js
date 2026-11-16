
const API_URL = 'http://localhost:5001/api/tutors';

export const getTutors = async () => {
    const response = await fetch(API_URL);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tutors.');
    }

    return data.tutors;
};

// Fetch an individual tutor's profile
export const getTutorById = async (tutorId) => {
    const response = await fetch(`${API_URL}/${tutorId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tutor profile.');
    }

    return data.tutor;
};