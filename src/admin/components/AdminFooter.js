import React from "react";
import { Link } from "react-router-dom";

import "../css/AdminFooter.css";

function AdminFooter() {
  return (
    <footer className="admin-footer">

      <div className="admin-footer-container">

        {/* BRAND */}

        <div className="admin-footer-brand">

          <h2>
            Mini Mart
          </h2>

          <p>
            Admin Panel
          </p>

          <span>
            Manage your store easily and efficiently.
          </span>

        </div>


        {/* QUICK LINKS */}

        <div className="admin-footer-links">

          <h3>
            Quick Links
          </h3>

          <Link to="/admin/dashboard">
            Dashboard
          </Link>

          <Link to="/admin/products">
            Products
          </Link>

          <Link to="/admin/categories">
            Categories
          </Link>

          <Link to="/admin/orders">
            Orders
          </Link>

          <Link to="/admin/users">
            Users
          </Link>

        </div>


        {/* MANAGEMENT */}

        <div className="admin-footer-info">

          <h3>
            Store Management
          </h3>

          <p>
            Manage products, orders,
            categories and customers
            from one place.
          </p>

          <p>
            Mini Mart Admin Panel
          </p>

        </div>

      </div>


      {/* BOTTOM */}

      <div className="admin-footer-bottom">

        <span>
          © 2026 Mini Mart. All rights reserved.
        </span>

        <span>
          Admin Management System
        </span>

      </div>

    </footer>
  );
}

export default AdminFooter;