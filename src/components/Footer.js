import React from "react";
import { Link } from "react-router-dom";
import "../css/Footer.css";

function Footer() {
  return (
    <footer className="mini-footer">

      <div className="container">

        <div className="row">

          {/* Brand */}

          <div className="col-md-4 mb-4">

            <h3 className="footer-logo">
              Mini Mart
            </h3>

            <p className="footer-description">
              Fresh groceries and everyday essentials
              delivered right to your doorstep.
            </p>

          </div>


          {/* Quick Links */}

          <div className="col-md-4 mb-4">

            <h5 className="footer-title">
              Quick Links
            </h5>

            <ul className="footer-links">

              <li>
                <Link to="/">
                  Home
                </Link>
              </li>

              <li>
                <Link to="/products">
                  Products
                </Link>
              </li>

              <li>
                <Link to="/cart">
                  Cart
                </Link>
              </li>

              <li>
                <Link to="/login">
                  Login
                </Link>
              </li>

            </ul>

          </div>


          {/* Customer Service */}

          <div className="col-md-4 mb-4">

            <h5 className="footer-title">
              Customer Service
            </h5>

            <p>
              Need help with your order?
            </p>

            <p>
              Email: support@minimart.com
            </p>

            <p>
              Phone: +91 98765 43210
            </p>

            <p>
              Use the chat button for product help.
            </p>

          </div>

        </div>


        {/* Bottom */}

        <div className="footer-bottom">

          <p>
            © 2026 Mini Mart. All rights reserved.
          </p>

          <p>
            Fresh products. Simple shopping.
          </p>

        </div>

      </div>

    </footer>
  );
}

export default Footer;