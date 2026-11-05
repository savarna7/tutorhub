
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <Link to="/">TutorHub</Link>

      <div>
        <Link to="/login">Login</Link>
        <Link to="/register">Sign Up</Link>
      </div>
    </nav>
  );
}

export default Navbar;
