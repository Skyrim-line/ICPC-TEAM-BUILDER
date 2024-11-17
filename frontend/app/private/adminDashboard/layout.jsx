"use client";

import React, { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  BookOutlined,
  RadarChartOutlined,
  LogoutOutlined,
  ExclamationCircleFilled,
  BarChartOutlined,
  DashboardOutlined,
  DotChartOutlined,
} from "@ant-design/icons";
import { Layout, Menu, theme, Button, message, Modal } from "antd";
import Image from "next/image";
import Logo from "../../public/img/Logo.png";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/authcontext";
import useRequireAuth from "../../hooks/useRequireAuth";

import apiService from "../../services/apiService";
import "./layout.css";

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

export default function AdminDashboard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth;
  const { isLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState("userManagement");
  const [collapsed, setCollapsed] = useState(false);
  const [canAccessUserManagement, setCanAccessUserManagement] = useState(false);
  const [canAccessSystemManagement, setCanAccessSystemManagement] =
    useState(false);
  const [canAccessGroupManagement, setCanAccessGroupManagement] =
    useState(false);
  const [siteCoordinator, setSiteCoordinator] = useState(false);
  const [DictionaryManagement, setDictionaryManagement] = useState(false);
  const [ContestManagement, setContestManagement] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    if (pathname.includes("userManagement")) {
      setActiveTab("userManagement");
    } else if (pathname.includes("groupManagement")) {
      setActiveTab("groupManagement");
    } else if (pathname.includes("dashboard")) {
      setActiveTab("dashboard");
    } else if (pathname.includes("sitecoordinator")) {
      setActiveTab("sitecoordinator");
    } else if (pathname.includes("dictionaryManagement")) {
      setActiveTab("dictionaryManagement");
    } else if (pathname.includes("contestManagement")) {
      setActiveTab("contestManagement");
    }
  }, [pathname]);

  useEffect(() => {
    fetch_account_me();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    router.push(`/private/adminDashboard/${tab}`);
  };

  // 获取权限信息并设置访问状态
  const fetch_account_me = async () => {
    try {
      const response = await apiService.get("/accounts/me");

      if (response.msg === "Success") {
        const accountData = response.data;
        const menus = accountData.menus;
        const { roles } = response.data;
        const roleData = roles[0] ? roles[0] : {};
        if (roleData?.id === 4) {
          setSiteCoordinator(true);
        } else {
          setSiteCoordinator(false);
        }
        // console.log("This is account_me", accountData);

        // 设置权限状态
        menus.forEach((menu) => {
          if (menu.name === "User navigation" && menu.selected) {
            setCanAccessUserManagement(true);
          }
          if (
            menu.name === "System management" &&
            (menu.selected || menu.partial_selected) &&
            roleData?.id !== 4
          ) {
            setCanAccessSystemManagement(true);
            // 遍历 children 判断是否有 "Group management" 被选中 (Coach)
            for (const child of menu.children) {
              if (
                child.name === "Group management" &&
                child.selected &&
                roleData?.id !== 1
              ) {
                setCanAccessGroupManagement(true);
              }
              if (child.name === "Dictionary management" && child.selected) {
                setDictionaryManagement(true);
              }
              if (child.name === "Competition management" && child.selected) {
                setContestManagement(true);
              }
              if (child.name === "Logistics management" && child.selected) {
                setSiteCoordinator(true);
              }
            }
          }
        });
      }
    } catch (error) {
      // console.error("Failed to fetch account_me:", error);
      console.log(error);
      if (error === `Error: 401`) {
        console.log("121212212121");
      }
    }
  };

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

  const SideMenue = () => (
    <Menu theme="dark" mode="inline" selectedKeys={[activeTab]}>
      {canAccessUserManagement && (
        <Menu.Item key="userManagement" icon={<UserOutlined />}>
          <a onClick={() => handleTabClick("userManagement")}>
            User Management
          </a>
        </Menu.Item>
      )}
      {canAccessSystemManagement && (
        <SubMenu
          key="sub1"
          icon={<ToolOutlined />}
          title="Team System Management"
        >
          {canAccessGroupManagement && (
            <Menu.Item
              key="groupManagement"
              icon={<TeamOutlined />}
              onClick={() => handleTabClick("groupManagement")}
            >
              Group Management
            </Menu.Item>
          )}
          {DictionaryManagement && (
            <Menu.Item
              key="dictionaryManagement"
              icon={<BookOutlined />}
              onClick={() => handleTabClick("dictionaryManagement")}
            >
              University List
            </Menu.Item>
          )}
          {ContestManagement && (
            <Menu.Item
              key="contestManagement"
              icon={<RadarChartOutlined />}
              onClick={() => handleTabClick("contestManagement")}
            >
              Contest Management
            </Menu.Item>
          )}
        </SubMenu>
      )}
      {siteCoordinator && (
        <SubMenu
          key="sub2"
          icon={<DashboardOutlined />}
          title="Site Coordinator Management"
        >
          <Menu.Item
            key="dashboard"
            icon={<BarChartOutlined />}
            onClick={() => handleTabClick("dashboard")}
          >
            Dashboard
          </Menu.Item>
          <Menu.Item
            key="sitecoordinator"
            icon={<DotChartOutlined />}
            onClick={() => handleTabClick("sitecoordinator")}
          >
            Logistics Management
          </Menu.Item>
        </SubMenu>
      )}
      <Menu.Item
        key="6"
        icon={<LogoutOutlined />}
        onClick={() => confirmLogout()}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={300}
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: "#001529", // Set background color to match the theme
        }}
      >
        <Image src={Logo} alt="ICPC-icon" className="logo" />
        {SideMenue()}
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 300 }}>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: "24px 16px 0",
            padding: "24px",
          }}
        >
          {/* Render content based on sidebar navigation */}
          {children}
        </Content>
        <Footer
          style={{
            textAlign: "center",
          }}
        >
          ICPC TEAM BUILDER ©{new Date().getFullYear()} Created by Meeting is
          Destiny UNSW
        </Footer>
      </Layout>
    </Layout>
  );
}
