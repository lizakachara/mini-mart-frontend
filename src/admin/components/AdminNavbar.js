import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  FaUserShield,
  FaChevronDown,
  FaSignOutAlt,
  FaThLarge,
  FaBoxOpen,
  FaTags,
  FaClipboardList,
  FaUsers,
  FaChartPie,
} from "react-icons/fa";

import "../css/AdminNavbar.css";

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showMenu, setShowMenu] =
    React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    navigate("/admin/login");
  };

  return (
    <nav className="admin-navbar">

      {/* BRAND */}

      <div className="admin-brand">

        <span className="admin-logo">
          Mini Mart
        </span>

        <span className="admin-divider"></span>

        <span className="admin-panel-text">
          Control Studio
        </span>

      </div>


      {/* NAVIGATION */}

      <div className="admin-nav-links">

        <Link
          to="/admin/dashboard"
          className={
            location.pathname === "/admin/dashboard"
              ? "admin-nav-link active"
              : "admin-nav-link"
          }
        >
          <FaThLarge />
          Dashboard
        </Link>


        <Link
          to="/admin/products"
          className={
            location.pathname === "/admin/products"
              ? "admin-nav-link active"
              : "admin-nav-link"
          }
        >
          <FaBoxOpen />
          Products
        </Link>


        <Link
          to="/admin/categories"
          className={
            location.pathname === "/admin/categories"
              ? "admin-nav-link active"
              : "admin-nav-link"
          }
        >
          <FaTags />
          Categories
        </Link>


        <Link
          to="/admin/analytics"
          className={
            location.pathname === "/admin/analytics"
              ? "admin-nav-link active"
              : "admin-nav-link"
          }
        >
          <FaChartPie />
          Analytics
        </Link>


        <Link
          to="/admin/orders"
          className={
            location.pathname === "/admin/orders"
              ? "admin-nav-link active"
              : "admin-nav-link"
          }
        >
          <FaClipboardList />
          Orders
        </Link>


        <Link
          to="/admin/users"
          className={
            location.pathname === "/admin/users"
              ? "admin-nav-link active"
              : "admin-nav-link"
          }
        >
          <FaUsers />
          Users
        </Link>

      </div>


      {/* ADMIN PROFILE */}

      <div className="admin-profile-wrapper">

        <button
          className="admin-profile"
          onClick={() =>
            setShowMenu(!showMenu)
          }
        >

          <FaUserShield />

          <span>
            Admin
          </span>

          <FaChevronDown
            className={
              showMenu
                ? "admin-dropdown-icon rotate"
                : "admin-dropdown-icon"
            }
          />

        </button>


        {/* DROPDOWN */}

        {showMenu && (

          <div className="admin-profile-dropdown">

            <div className="admin-dropdown-user">

              <FaUserShield />

              <div>

                <strong>
                  Administrator
                </strong>

                <span>
                  admin@minimart.com
                </span>

              </div>

            </div>


            <button
              className="admin-logout-button"
              onClick={handleLogout}
            >

              <FaSignOutAlt />

              Logout

            </button>

          </div>

        )}

      </div>

    </nav>
  );
}

export default AdminNavbar;