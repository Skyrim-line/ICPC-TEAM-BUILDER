"use client";

import React, { useState, useEffect } from "react";
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Input, Button, Typography, Space, Form, message } from "antd";
import apiService from "../../services/apiService"; // API service for making requests
import "./register.css"; // Remember to add custom styles in this CSS file
import Link from "next/link";
import { passwordRegex } from "../../utils/utils"; // Import password regex pattern

const { Title } = Typography;

const RegisterPage = () => {
  const [isCodeSent, setIsCodeSent] = useState(false); // Check if verification code is sent
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [countdown, setCountdown] = useState(0); // Countdown state
  const [form] = Form.useForm(); // Use Ant Design's useForm hook for form management

  const router = useRouter();

  // Handle registration request
  const handleRegister = async (values) => {
    const { username, email, password, code } = values;
    try {
      const response = await apiService.post(
        "/register",
        { email, username, password, code },
      );
      const { msg } = response;
      if (msg === "Success") {
        message.success(
          "Successfully registered, redirecting to Login page..."
        );
        router.push("/public/login"); // Redirect to login page upon successful registration
      } else {
        message.error("Registration failed, please try again", msg);
      }
    } catch (error) {
      message.error("Registration failed, please try again", error);
    }
  };

  // Send verification code logic
  const handleSendVerificationCode = async () => {
    try {
      // Validate if email input is correct
      await form.validateFields(["email"]);

      const email = form.getFieldValue("email");
      setIsLoading(true);
      const response = await apiService.post(
        "/verificationCode",
        { email },
      );
      const { msg } = response;
      if (msg === "Success") {
        message.success("Verification code has been sent to your email");
        setIsCodeSent(true);
        setCountdown(60); // Start 60-second countdown
      } else {
        message.error("Failed to send verification code, please try again", 3);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to send verification code, please try again", 3);
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown logic
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (countdown === 0 && isCodeSent) {
      setIsCodeSent(false); // Allow resending the code after countdown ends
    }

    return () => clearInterval(timer); // Clear timer to avoid memory leaks
  }, [countdown, isCodeSent]);

  return (
    <div className="background-container">
      <div className="login-box">
        <Title level={2} style={{ textAlign: "center", fontFamily: "Poppins" }}>
          Create an account
        </Title>
        <p style={{ color: "black", fontSize: "14px", marginBottom: "5px" }}>
          Sign up here to team builder system
        </p>
        <Space direction="vertical" size="large" style={{ width: "400px" }}>
          <Form
            form={form}
            name="register"
            onFinish={handleRegister} // Form submission handling logic
            style={{
              width: "400px",
            }} // Set form width
            layout="vertical"
          >
            {/* Username input */}
            <Form.Item
              name="username"
              label="Create a Username"
              rules={[
                {
                  required: true,
                  message: "Please input your username!",
                  whitespace: true,
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
              />
            </Form.Item>

            {/* Password input */}
            <Form.Item
              name="password"
              label="Create a Password"
              rules={[
                {
                  required: true,
                  message: "Please input your password!",
                },
                {
                  pattern: passwordRegex, // Use the imported regex pattern
                  message:
                    "Password must be at least 8 characters long and contain at least three of the following: uppercase letters, lowercase letters, numbers, and special characters.",
                },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a password"
              />
            </Form.Item>

            {/* Confirm password */}
            <Form.Item
              name="confirm"
              label="Confirm Password"
              dependencies={["password"]}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please confirm your password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The passwords do not match!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm your password" />
            </Form.Item>

            {/* Email input and send verification button */}
            <Form.Item
              name="email"
              label="Your University E-mail"
              rules={[
                {
                  type: "email",
                  message: "The input is not valid E-mail!",
                },
                {
                  required: true,
                  message: "Please input your E-mail!",
                },
              ]}
            >
              <div className="email-verification">
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter your email"
                  style={{ width: "290px" }}
                />
                <Button
                  type="primary"
                  onClick={handleSendVerificationCode}
                  disabled={isCodeSent || isLoading} // Disable button after sending code
                  loading={isLoading}
                  style={{ marginLeft: "10px" }}
                >
                  {isCodeSent ? `${countdown}s` : "Send Code"}{" "}
                  {/* Display countdown */}
                </Button>
              </div>
            </Form.Item>
            <p className="uni-account">
              You are only allowed to register with your university account. If
              you use another account, such as Gmail, the verification code will
              fail to send.
            </p>

            {/* Verification code input */}
            <Form.Item
              name="code"
              label="Verification Code"
              rules={[
                {
                  required: true,
                  message:
                    "Please input the verification code sent to your email!",
                },
              ]}
            >
              <Input
                placeholder="Enter verification code"
                maxLength={6} // Limit code length
              />
            </Form.Item>

            {/* Register button */}
            <Form.Item style={{ marginBottom: "20px" }}>
              <Button type="primary" htmlType="submit" block>
                Create an account
              </Button>
            </Form.Item>
            <Form.Item style={{ marginBottom: "10px" }}>
              <Link href="/public/home">
                <Button className="homepage-button" style={{ width: "400px" }}>
                  Back to homepage
                </Button>
              </Link>
            </Form.Item>
            <Form.Item style={{ marginBottom: "5px" }}>
              <Link
                href="/public/login"
                style={{
                  textDecoration: "underline",
                  fontSize: "14px",
                }}
              >
                Back to login here
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

export default RegisterPage;
