import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, User as UserIcon, MessageCircle } from 'lucide-react';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">APEX AGENCIES</Link>
      <div className="nav-links">
        <Link to="/"><Home size={20} /> Home</Link>
        {user && <Link to="/community"><MessageCircle size={20} /> Community</Link>}
        {user ? (
          <>
            <span className="user-name"><UserIcon size={18} /> {user.name}</span>
            <button onClick={handleLogout} className="btn-logout"><LogOut size={18} /></button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
