import React, { useCallback, useEffect, useState } from "react";

import {
FaSearch,
FaUsers,
FaEye,
FaEdit,
FaTimes,
FaSave,
} from "react-icons/fa";

import "../css/AdminUsers.css";

const USERS_API = "https://mini-mart-cdkr.onrender.com/api/users";
const ORDERS_API = "https://mini-mart-cdkr.onrender.com/api/orders";

function AdminUsers() {
const [users, setUsers] = useState([]);
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [saving, setSaving] = useState(false);

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");

const [selectedUser, setSelectedUser] = useState(null);
const [editingUser, setEditingUser] = useState(null);
const [newStatus, setNewStatus] = useState("");

const statuses = ["All", "Active", "Inactive"];

// GET ADMIN TOKEN
const getToken = () => {
return localStorage.getItem("adminToken");
};

// NORMALIZE USER STATUS FOR DISPLAY
const getUserStatus = (user) => {
return (user.status || "active").toLowerCase() === "active"
? "Active"
: "Inactive";
};

// FETCH USERS AND ORDERS FROM BACKEND
const fetchUsers = useCallback(async () => {
try {
setLoading(true);
setError("");

  const token = getToken();

  if (!token) {
    throw new Error("Admin login required. Please log in again.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [usersResponse, ordersResponse] = await Promise.all([
    fetch(USERS_API, { headers }),
    fetch(ORDERS_API, { headers }),
  ]);

  const usersData = await usersResponse.json();

  if (!usersResponse.ok) {
    throw new Error(
      usersData.message || "Unable to fetch users."
    );
  }

  setUsers(
    Array.isArray(usersData)
      ? usersData
      : usersData.users || []
  );

  // Orders are used to calculate each customer's order count
  // and total spending. User data still loads if orders fail.
  if (ordersResponse.ok) {
    const ordersData = await ordersResponse.json();

    setOrders(
      Array.isArray(ordersData)
        ? ordersData
        : ordersData.orders || []
    );
  } else {
    setOrders([]);
  }
} catch (err) {
  console.error("Fetch users error:", err);
  setError(err.message || "Unable to load users.");
} finally {
  setLoading(false);
}


}, []);

useEffect(() => {
  fetchUsers();
}, [fetchUsers]);

// GET USER'S ORDER COUNT
const getUserOrders = (user) => {
return orders.filter((order) => {
const orderUserId =
order.userId?._id ||
order.userId ||
order.user?._id ||
order.user;


  return (
    orderUserId &&
    String(orderUserId) === String(user._id)
  );
});


};

const getOrderCount = (user) => {
return getUserOrders(user).length;
};

// GET USER'S TOTAL SPENDING
const getUserSpending = (user) => {
return getUserOrders(user)
.filter(
(order) => order.orderStatus !== "Cancelled"
)
.reduce(
(total, order) =>
total + Number(order.totalAmount || 0),
0
);
};

// FORMAT REGISTRATION DATE
const getRegistrationDate = (user) => {
if (!user.createdAt) {
return "Not available";
}


const date = new Date(user.createdAt);

if (Number.isNaN(date.getTime())) {
  return "Not available";
}

return date.toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});


};

// SEARCH AND FILTER USERS
const filteredUsers = users.filter((user) => {
const name = (user.name || "").toLowerCase();
const email = (user.email || "").toLowerCase();
const phone = (user.phone || "").toLowerCase();


const searchText = search.toLowerCase();

const matchesSearch =
  name.includes(searchText) ||
  email.includes(searchText) ||
  phone.includes(searchText);

const matchesStatus =
  statusFilter === "All" ||
  getUserStatus(user) === statusFilter;

return matchesSearch && matchesStatus;


});

// OPEN USER DETAILS
const openViewUser = (user) => {
setSelectedUser(user);
};

// OPEN STATUS EDITOR
const openEditUser = (user) => {
setEditingUser(user);
setNewStatus(getUserStatus(user));
};

// UPDATE USER STATUS IN MONGODB
const updateUserStatus = async () => {
if (!editingUser) {
return;
}


try {
  setSaving(true);

  const token = getToken();

  if (!token) {
    throw new Error("Admin login required. Please log in again.");
  }

  const response = await fetch(
    `${USERS_API}/${editingUser._id}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus.toLowerCase(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to update user status."
    );
  }

  // Refresh data from the database.
  await fetchUsers();

  setEditingUser(null);
  setNewStatus("");

  alert("User status updated successfully!");
} catch (err) {
  console.error("Update user status error:", err);
  alert(err.message || "Unable to update user status.");
} finally {
  setSaving(false);
}

};

// STATUS CSS CLASS
const getStatusClass = (status) => {
return status === "Active"
? "user-status active"
: "user-status inactive";
};

return ( <div className="admin-users-page">
{/* HEADER */} <section className="admin-users-header"> <div className="admin-users-container"> <div> <p className="admin-users-label">
Store Management </p>

        <h1>Manage Users</h1>

        <p className="admin-users-description">
          View and manage your Mini Mart customers.
        </p>
      </div>

      <div className="users-total-badge">
        <FaUsers />
        {users.length} Total Users
      </div>
    </div>
  </section>

  {/* CONTENT */}
  <section className="admin-users-content">
    <div className="admin-users-container">
      {/* SEARCH AND FILTERS */}
      <div className="users-controls">
        <div className="users-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="users-status-filters">
          {statuses.map((status) => (
            <button
              key={status}
              className={
                statusFilter === status
                  ? "user-filter active"
                  : "user-filter"
              }
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* HEADING */}
      <div className="users-heading">
        <div>
          <h2>All Users</h2>
          <p>{filteredUsers.length} users found</p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div role="alert" style={{ marginBottom: "16px" }}>
          {error}

          <button
            type="button"
            onClick={fetchUsers}
            style={{ marginLeft: "12px" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="admin-users-table-wrapper">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Registered</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="no-users">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-users">
                  <FaUsers />
                  <h3>No Users Found</h3>
                  <p>
                    {users.length === 0
                      ? "No registered users were found."
                      : "No users match your search."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const status = getUserStatus(user);

                return (
                  <tr key={user._id}>
                    {/* USER */}
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {(user.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* PHONE */}
                    <td>{user.phone || "Not provided"}</td>

                    {/* REGISTERED */}
                    <td>{getRegistrationDate(user)}</td>

                    {/* ORDERS */}
                    <td>
                      <strong>{getOrderCount(user)}</strong>
                    </td>

                    {/* TOTAL SPENT */}
                    <td>
                      <strong className="user-spending">
                        ₹
                        {getUserSpending(user).toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span className={getStatusClass(status)}>
                        {status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="user-actions">
                        <button
                          type="button"
                          className="view-user-button"
                          title="View User"
                          onClick={() => openViewUser(user)}
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          className="edit-user-button"
                          title="Update User Status"
                          onClick={() => openEditUser(user)}
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  {/* VIEW USER MODAL */}
  {selectedUser && (
    <div className="admin-user-modal-overlay">
      <div className="admin-user-modal">
        <div className="user-modal-header">
          <div>
            <h2>User Details</h2>
            <p>Customer information</p>
          </div>

          <button
            type="button"
            className="close-user-modal"
            onClick={() => setSelectedUser(null)}
          >
            <FaTimes />
          </button>
        </div>

        <div className="user-modal-body">
          <div className="modal-user-profile">
            <div className="modal-user-avatar">
              {(selectedUser.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <h3>{selectedUser.name}</h3>
            <p>{selectedUser.email}</p>
          </div>

          <div className="user-detail-row">
            <span>Phone</span>
            <strong>
              {selectedUser.phone || "Not provided"}
            </strong>
          </div>

          <div className="user-detail-row">
            <span>Address</span>
            <strong>
              {selectedUser.address || "Not provided"}
            </strong>
          </div>

          <div className="user-detail-row">
            <span>Registered</span>
            <strong>
              {getRegistrationDate(selectedUser)}
            </strong>
          </div>

          <div className="user-detail-row">
            <span>Total Orders</span>
            <strong>{getOrderCount(selectedUser)}</strong>
          </div>

          <div className="user-detail-row">
            <span>Total Spending</span>
            <strong className="modal-spending">
              ₹
              {getUserSpending(selectedUser).toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <div className="user-detail-row">
            <span>Status</span>
            <strong>{getUserStatus(selectedUser)}</strong>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* UPDATE USER STATUS MODAL */}
  {editingUser && (
    <div className="admin-user-modal-overlay">
      <div className="admin-user-modal small">
        <div className="user-modal-header">
          <div>
            <h2>Update User</h2>
            <p>{editingUser.name}</p>
          </div>

          <button
            type="button"
            className="close-user-modal"
            onClick={() => setEditingUser(null)}
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        <div className="user-status-form">
          <label>User Status</label>

          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={saving}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="save-user-status"
            onClick={updateUserStatus}
            disabled={saving}
          >
            <FaSave />
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  )}
</div>

);
}

export default AdminUsers;
