"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 从 localStorage 中恢复用户信息，但不阻塞页面渲染
  useEffect(() => {
    const loggedUser = localStorage.getItem("user");

    if (loggedUser) {
      try {
        setUser(loggedUser);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        localStorage.removeItem("user");
      }
    }
    setIsInitialized(true); // 标记状态初始化完成
  }, []);

  const login = (username) => {
    setUser(username);
    localStorage.setItem("user", (username));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isInitialized }}>
      {isInitialized ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
