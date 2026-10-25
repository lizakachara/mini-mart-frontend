import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

import {
FiUser,
FiEdit3,
FiPackage,
FiHeart,
FiLogOut,
FiMail,
FiPhone,
FiMapPin,
FiChevronRight,
FiX,
FiSave,
FiShoppingCart,
FiStar,
} from "react-icons/fi";

import "../css/Profile.css";

const API_URL = "http://localhost:5000/api";

function Profile() {
const navigate = useNavigate();
const { user, token, logout, login } = useAuth();
const { cartItems } = useContext(CartContext);

const cartCount = cartItems.reduce(
  (total, item) => total + (Number(item.quantity) || 1),
  0
);

const [profile, setProfile] = useState({
name: "",
email: "",
phone: "",
address: "",
});

const [formData, setFormData] = useState({
name: "",
phone: "",
address: "",
});

const [editing, setEditing] = useState(false);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

// Fetch the latest customer profile from MongoDB
useEffect(() => {
const fetchProfile = async () => {
try {
setError("");

 
    if (!token) {
      throw new Error("Please log in again to view your profile.");
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load your profile.");
    }

    const customer = data.user || data;

    const details = {
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    };

    setProfile(details);

    setFormData({
      name: details.name,
      phone: details.phone,
      address: details.address,
    });
  } catch (err) {
    setError(err.message || "Could not load your profile.");
  } finally {
    setLoading(false);
  }
};

fetchProfile();
 

}, [token]);

const handleChange = (event) => {
const { name, value } = event.target;

 
setFormData((previous) => ({
  ...previous,
  [name]: value,
}));
 

};

// Save updated profile to MongoDB
const handleSave = async (event) => {
event.preventDefault();

 
setError("");
setMessage("");

try {
  setSaving(true);

  if (!token) {
    throw new Error("Please log in again.");
  }

  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not update your profile.");
  }

  const customer = data.user || data;

  const updatedProfile = {
    name: customer.name ?? formData.name.trim(),
    email: customer.email ?? profile.email,
    phone: customer.phone ?? formData.phone.trim(),
    address: customer.address ?? formData.address.trim(),
  };

  setProfile(updatedProfile);

  setFormData({
    name: updatedProfile.name,
    phone: updatedProfile.phone,
    address: updatedProfile.address,
  });

  // Keep the current user's stored details in sync.
  if (typeof login === "function" && user) {
    login(
      {
        ...user,
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        address: updatedProfile.address,
      },
      token,
      Boolean(localStorage.getItem("token"))
    );
  }

  setEditing(false);
  setMessage("Profile updated successfully.");
} catch (err) {
  setError(err.message || "Could not update your profile.");
} finally {
  setSaving(false);
}
 

};

const handleLogout = () => {
logout();
navigate("/login");
};

const displayName = profile.name || user?.name || "My Profile";
const initials = displayName
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join("") || "MM";

if (loading) {
return ( <div className="profile-page"> <div className="profile-container"> <p>Loading your profile...</p> </div> </div>
);
}

return ( <div className="profile-page"> <div className="profile-container"> <div className="profile-heading"> <p className="profile-kicker">Your Mini Mart studio</p> <h1>My Account</h1> <p>A personal space for your details, orders, and saved finds.</p> </div>

 
    {error && (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )}

    {message && (
      <div className="alert alert-success" role="alert">
        {message}
      </div>
    )}

    <div className="profile-card">
      <div className="profile-avatar" aria-hidden="true">
        {initials}
      </div>

      <div className="profile-main-info">
        <span className="profile-member-chip">
          <FiStar /> Mini Mart member
        </span>
        <h2>{displayName}</h2>
        <p>Welcome back. Your storefront identity is ready.</p>
      </div>

      <button
        type="button"
        className="edit-profile-button"
        onClick={() => {
          setError("");
          setMessage("");
          setFormData({
            name: profile.name,
            phone: profile.phone,
            address: profile.address,
          });
          setEditing(true);
        }}
      >
        <FiEdit3 />
        <span>Edit Profile</span>
      </button>
    </div>

    <div className="profile-grid">
      <div className="profile-section">
        <div className="section-title">
          <div className="section-icon">
            <FiUser />
          </div>
          <div>
            <h2>Personal Information</h2>
            <p>Your account details</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <FiUser />
            <div>
              <span>Name</span>
              <strong>{profile.name || "Not provided"}</strong>
            </div>
          </div>

          <div className="detail-item">
            <FiMail />
            <div>
              <span>Email</span>
              <strong>{profile.email || "Not provided"}</strong>
            </div>
          </div>

          <div className="detail-item">
            <FiPhone />
            <div>
              <span>Mobile Number</span>
              <strong>{profile.phone || "Not provided"}</strong>
            </div>
          </div>

          <div className="detail-item">
            <FiMapPin />
            <div>
              <span>Address</span>
              <strong>{profile.address || "Not provided"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">
          <div className="section-icon">
            <FiPackage />
          </div>
          <div>
            <h2>My Shopping</h2>
            <p>Manage your shopping activity</p>
          </div>
        </div>

        <div className="profile-options">
          <Link to="/orders" className="profile-option">
            <div className="option-left">
              <div className="option-icon">
                <FiPackage />
              </div>
              <div>
                <h3>My Orders</h3>
                <p>View your previous orders</p>
              </div>
            </div>
            <FiChevronRight className="option-arrow" />
          </Link>

          <Link to="/wishlist" className="profile-option">
            <div className="option-left">
              <div className="option-icon">
                <FiHeart />
              </div>
              <div>
                <h3>My Wishlist</h3>
                <p>View your saved products</p>
              </div>
            </div>
            <FiChevronRight className="option-arrow" />
          </Link>

          <Link to="/cart" className="profile-option">
            <div className="option-left">
              <div className="option-icon">
                <FiShoppingCart />
              </div>
              <div>
                <h3>Shopping Cart</h3>
                <p>
                  {cartCount > 0
                    ? `${cartCount} item${cartCount === 1 ? "" : "s"} waiting`
                    : "Your cart is ready for new picks"}
                </p>
              </div>
            </div>
            <FiChevronRight className="option-arrow" />
          </Link>
        </div>
      </div>
    </div>

    <div className="logout-section">
      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
      >
        <FiLogOut />
        <span>Logout</span>
      </button>
    </div>

    {editing && (
      <div
        className="profile-modal-overlay"
        onClick={() => !saving && setEditing(false)}
      >
        <div
          className="profile-edit-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="profile-modal-header">
            <h2>Edit Profile</h2>

            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              aria-label="Close edit profile"
            >
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="profile-form-group">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={100}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email}
                disabled
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-phone">Mobile Number</label>
              <input
                id="profile-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={20}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-address">Address</label>
              <textarea
                id="profile-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="profile-form-buttons">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" disabled={saving}>
                <FiSave />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
</div>
 

);
}

export default Profile;
