"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Input, Button, Typography, Space, Form, message } from "antd";
import apiService from "../../services/apiService"; // API service for making requests
import { passwordRegex } from "../../utils/utils"; // Import regex pattern
import "./index.css";

const { Title } = Typography;

const ResetPassword = () => {
  const [isCodeSent, setIsCodeSent] = useState(false); // Check if verification code is sent
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [countdown, setCountdown] = useState(0); // Countdown state
  const [form] = Form.useForm(); // Use Ant Design's useForm Hook for form management

  const router = useRouter();

  // Handle reset password request
  const handleReset = async (values) => {
    const { email, new_password, verification_code } = values;
    try {
      const response = await apiService.post(
        "/forgot/verify",
        { email, new_password, verification_code },
      );
      const { msg } = response;
      if (msg === "Success") {
        message.success(
          "Your new password has been set successfully! Redirecting to login page..."
        );

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/public/login");
        }, 2000);
      } else {
        message.error("Reset password failed, please try again", 3);
      }
    } catch (error) {
      console.error(error);
      message.error("Reset password failed, try it again later", 3);
    }
  };

  // Send verification code logic
  const handleSendVerificationCode = async () => {
    try {
      // Validate if email input is correct
      await form.validateFields(["email"]);

      const email = form.getFieldValue("email");
      setIsLoading(true);
      const response = await apiService.post("/forgot/send", { email });
      const { msg } = response;
      if (msg === "Success") {
        message.success("Your verification code has been sent successfully!");
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
          Reset Your Password
        </Title>
        <p
          style={{
            color: "black",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          Please enter your email address to reset your password
        </p>
        <Space direction="vertical" size="large" style={{ width: "400px" }}>
          <Form
            form={form}
            name="resetPassword"
            onFinish={handleReset} // Form submission handling logic
            layout="vertical"
          >
            {/* New password input */}
            <Form.Item
              name="new_password"
              label="Create New Password"
              rules={[
                {
                  required: true,
                  message: "Please input your new password!",
                },
                {
                  pattern: passwordRegex, // Use imported regex pattern
                  message:
                    "Password must be at least 8 characters long and contain at least three of the following: uppercase letters, lowercase letters, numbers, and special characters.",
                },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a new password"
              />
            </Form.Item>

            {/* Confirm new password */}
            <Form.Item
              name="confirm_new_password"
              label="Confirm New Password"
              dependencies={["password"]}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("new_password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The passwords do not match!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm your new password" />
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
                />
                <Button
                  type="primary"
                  onClick={handleSendVerificationCode}
                  disabled={isCodeSent || isLoading} // Disable button after sending code
                  loading={isLoading}
                  style={{ marginLeft: "10px" }} // Keep button on the same line as input
                >
                  {isCodeSent ? `${countdown}s` : "Send Code"}{" "}
                  {/* Display countdown */}
                </Button>
              </div>
            </Form.Item>

            {/* Verification code input */}
            <Form.Item
              name="verification_code"
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

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Confirm Reset
              </Button>
            </Form.Item>
            <Form.Item>
              <Link href="/public/home">
                <Button className="homepage-button" style={{ width: "400px" }}>
                  Back to homepage
                </Button>
              </Link>
            </Form.Item>
          </Form>

          <Link
            href="/public/login"
            style={{ textDecoration: "underline", fontSize: "14px" }}
          >
            Back to login here
          </Link>
          <Link
            href="/public/register"
            style={{ textDecoration: "underline", fontSize: "14px" }}
          >
            Do not have an account? Sign up
          </Link>
        </Space>
      </div>
    </div>
  );
};

export default ResetPassword;
