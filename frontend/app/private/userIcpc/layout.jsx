"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, message, Modal } from "antd";
import { ExclamationCircleFilled, LogoutOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useAuth } from "../../context/authcontext";
import apiService from "../../services/apiService";
import "./layout.css";

const { Header, Content } = Layout;

export default function UserIcpcLayout({ children }) {
  const { isLoading, user } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (pathname.includes("matchInfo")) {
      setActiveTab("matchInfo");
    } else if (pathname.includes("profile")) {
      setActiveTab("profile");
    } else if (pathname.includes("registration")) {
      setActiveTab("registration");
    } else if (pathname.includes("matchResult")) {
      setActiveTab("matchResult");
    }
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      message.info("please login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    router.push(`/private/userIcpc/${tab}`);
  };

  const renderMenu = () => (
    <Menu
      theme="dark"
      mode="horizontal"
      selectedKeys={[activeTab]}
      className="ant-menu"
    >
      <Menu.Item key="profile" className="menu-item">
        <a onClick={() => handleTabClick("profile")}>Personal Profile</a>
      </Menu.Item>
      <Menu.Item key="matchInfo" className="menu-item">
        <a onClick={() => handleTabClick("matchInfo")}>Programming Skills</a>
      </Menu.Item>
      <Menu.Item key="registration" className="menu-item">
        <a onClick={() => handleTabClick("registration")}>Team Selection</a>
      </Menu.Item>
      <Menu.Item key="matchResult" className="menu-item hide-on-mobile">
        {" "}
        {/* Hide this tab on mobile */}
        <a onClick={() => handleTabClick("matchResult")}>Matching Result</a>
      </Menu.Item>
    </Menu>
  );

  const logoutfunc = async () => {
    try {
      const response = await apiService.post("/logout");
      const { msg } = response;
      if (msg === "Success") {
        message.success("Logout Successfully!", 2);
        setTimeout(() => {
          router.push("/public/login");
        }, 1000);
        logout();
      } else {
        message.error("Logout failed, please try again", 3);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const confirmLogout = () => {
    Modal.confirm({
      title: "Logout?",
      icon: <ExclamationCircleFilled />,
      content: "Are you sure you want to log out?",
      onOk() {
        logoutfunc();
      },
      onCancel() {},
    });
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <Layout className="layout">
      <Header className="layout-header">
        {" "}
        {/*This is the header of the page*/}
        <div className="layout_whole">
          {renderMenu()}
          <Button
            type="primary"
            onClick={confirmLogout}
            style={{ marginLeft: "auto", borderRadius: "15px" }}
          >
            <LogoutOutlined /> Logout
          </Button>
        </div>
      </Header>
      <Content className="layout-content">
        {children}
        {/*This is the content of the page*/}
      </Content>
    </Layout>
  );
}
