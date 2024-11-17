"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/authcontext";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Space,
  message,
  Flex,
} from "antd";
import apiService from "../../services/apiService";
import CryptoJS from "crypto-js";
import "./login.css";

const { Title } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm(); 
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    const savedPasswordEncrypted = localStorage.getItem("rememberedPassword");

    if (savedUsername && savedPasswordEncrypted) {
      const decryptedPassword = CryptoJS.AES.decrypt(
        savedPasswordEncrypted,
        "secretKey"
      ).toString(CryptoJS.enc.Utf8);
      form.setFieldsValue({
        username: savedUsername,
        password: decryptedPassword,
      });
    }
  }, [form]);

  const getAccountRole = async () => {
    try {
      const response = await apiService.get("/accounts/me");
      if (response.msg === "Success") {
        const { roles } = response.data;
        const roleData = roles[0] ? roles[0] : {};
        if (roleData?.id === 1) {
          setTimeout(() => {
            router.push("/private/adminDashboard/userManagement");
          },1000)
          return;
        }
        if(roleData?.id === 3){
          setTimeout(() => {
            router.push("/private/adminDashboard/groupManagement");
          },1000)
          return;
        }
        if(roleData?.id === 4){
          setTimeout(() => {
            router.push("/private/adminDashboard/dashboard");
          },1000)
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch account_me:", error);
    }
  };

  const onFinish = async (values) => {
    const { username, password, rememberMe } = values;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(username)) {
      message.error("Login failed: Please use your username, not email.", 3);
      return;
    }
    try {
      const response = await apiService.post(
        "/login",
        { username, password },
      );
      const { data } = response;

      login(username);

      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
        const encryptedPassword = CryptoJS.AES.encrypt(
          password,
          "secretKey"
        ).toString();
        localStorage.setItem("rememberedPassword", encryptedPassword);
      } else {
        localStorage.removeItem("rememberedUsername");
        localStorage.removeItem("rememberedPassword");
      }

      // Redirect based on user role
      if (data.is_self_registration) {
        message.success(
          "login success redirecting to personal profile page...",
          3
        );
        setTimeout(() => {
          router.push("/private/userIcpc/profile");
        }, 2000);
      } else if (data.is_self_registration === false) {
        message.success("Admin login success! Redirecting to admin page...");
        getAccountRole()
      } else {
        message.error("login failed please check your password or username", 3);
      }
    } catch (error) {
      console.error(error);
      message.error("Login failed, please check your credentials!", 3);
    }
  };

  return (
    <div className="background-container">
      <div className="login-box">
        <Title level={2} style={{ textAlign: "center", fontFamily: "Poppins" }}>
          Sign in
        </Title>
        <Space direction="vertical" size="large" style={{ width: "400px" }}>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            style={{
              width: "400px",
            }}
            initialValues={{ rememberMe: true }}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item name="rememberMe" valuePropName="checked">
              <Flex justify="space-between" align="center">
                <Checkbox>Remember me</Checkbox>
                <Link
                  href="/public/reset-password"
                  style={{ fontSize: "14px", textDecoration: "underline" }}
                >
                  Forgot your password
                </Link>
              </Flex>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Login
              </Button>
            </Form.Item>
            <Form.Item>
              <Link href="/public/home">
                <Button className="homepage-button" style={{ width: "400px" }}>
                  Back to homepage
                </Button>
              </Link>
            </Form.Item>

            <Form.Item>
              <Link
                href="/public/register"
                style={{ textDecoration: "underline", fontSize: "14px" }}
              >
                Do not have an account? Sign up
              </Link>
            </Form.Item>
          </Form>
        </Space>
      </div>
      <div
        className="footer-text"
        style={{ textAlign: "center", marginTop: "20px" }}
      >
        ICPC TEAM BUILDER ©{new Date().getFullYear()} Created By Meeting Is
        Destiny UNSW
      </div>
    </div>
  );
};

export default LoginPage;
