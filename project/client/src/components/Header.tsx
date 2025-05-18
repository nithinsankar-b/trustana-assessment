import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.2 6.5a1 1 0 0 0-1.2-.8l-9.9 2.3h-.08a1 1 0 0 0-.7 1.2l1.77 7.67c.14.6.75.95 1.34.8l.7-.17M23 17.3V9.84A.84.84 0 0 0 22.2 9h-7.93a.84.84 0 0 0-.83.84v10.58a.84.84 0 0 0 .83.84h7.92a.84.84 0 0 0 .83-.86" />
            <path d="M8.08 12.55a3.05 3.05 0 0 0-4.73-.16v0A3.05 3.05 0 0 0 2.1 15.86l.16.33" />
            <path d="M4.91 17.87a2.99 2.99 0 0 0-1.36.33v0a3 3 0 0 0-1.55 3.94v0a3 3 0 0 0 3.94 1.55v0a3 3 0 0 0 1.55-3.94v0c-.4-.87-1.2-1.53-2.13-1.69" />
            <path d="M2.04 14.4v.01" />
          </svg>
          Product Enrichment
        </Link>
        <nav className="nav">
          <ul>
            <li>
              <NavLink to="/" end>Products</NavLink>
            </li>
            <li>
              <NavLink to="/attributes">Attributes</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;