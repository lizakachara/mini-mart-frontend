import React, {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const localUser = localStorage.getItem("user");
    const sessionUser = sessionStorage.getItem("user");

    const savedUser = localUser || sessionUser;

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      null
    );
  });

  // Login
  const login = (userData, userToken, rememberMe) => {
    setUser(userData);
    setToken(userToken);

    if (rememberMe) {
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      localStorage.setItem(
        "token",
        userToken
      );

      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      sessionStorage.setItem(
        "token",
        userToken
      );

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;