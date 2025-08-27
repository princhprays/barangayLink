import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { isAuthenticated, isAdmin, isPending } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) return null;

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const NavItem = ({ to, label, disabled, exact = false }) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <li className={`side-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
        <Link to={disabled ? '#' : to} title={disabled ? 'Available after admin approval' : undefined}>
          {label}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="collapse-btn" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? '»' : '«'}
        </button>
        {!collapsed && <span className="sidebar-title">Menu</span>}
      </div>

      <nav className="sidebar-nav">
        <ul>
          {isAdmin ? (
            <>
              <NavItem to="/admin/dashboard" label="Admin Dashboard" exact />
              <NavItem to="/admin/verifications" label="Verifications" />
              <NavItem to="/admin/requests" label="Request Management" />
              <NavItem to="/admin/users" label="Manage Users" />
              <NavItem to="/admin/management" label="Admin Management" />
              <NavItem to="/admin/items/pending" label="Pending Items" />
            </>
          ) : (
            <>
              <NavItem to="/resident/dashboard" label="Dashboard" disabled={isPending} exact />
              <NavItem to="/my-requests" label="My Requests" disabled={isPending} />
              <NavItem to="/requests/new" label="Create Request" disabled={isPending} />
              <NavItem to="/items/new" label="Add Item" disabled={isPending} />
              <NavItem to="/benefits" label="Benefits" />
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;


