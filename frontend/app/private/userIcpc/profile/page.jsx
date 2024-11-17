"use client";

import {
  Button,
  Form,
  Divider,
  message,
  Select,
  Input,
  Radio,
  Row,
  Col,
  Typography,
  Flex,
  Modal,
} from "antd";
import "./profile.css";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiService from "../../../services/apiService";
import useRequireAuth from "../../../hooks/useRequireAuth";

const { Title, Text } = Typography;
const { Option } = Select;

const ProfilePage = () => {
  const [form] = Form.useForm();
  const { user } = useRequireAuth();
  const router = useRouter();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savedValues, setSavedValues] = useState({});
  const [showICPCEmail, setShowICPCEmail] = useState(null);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [isICPCEmailFilled, setIsICPCEmailFilled] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push(`/public/login`);
    }
    const isReset = localStorage.getItem("isReset") === "true";
    if (!isReset) {
      fetchProfileData();
    }
  }, []);

  useEffect(() => {
    const email = form.getFieldValue("official_email");
    setIsICPCEmailFilled(!!email);
  }, [form, showICPCEmail]);

  const fetchProfileData = async () => {
    try {
      const response = await apiService.get("/profiles");
      const { msg, data } = response;
      if (msg === "Success") {
        const isNameValid = data.name && data.name.trim() !== "";
        if (isNameValid) {
          form.setFieldsValue(data);
          setIsProfileComplete(true);
          setSavedValues(data);
        } else {
          setIsProfileComplete(false);
          form.resetFields();
        }
      } else {
        console.error("Cannot get profile data:", response);
      }
    } catch (error) {
      console.error("Cannot get profile data:", error);
    }
  };

  const onFinish = async (values) => {
    try {
      await apiService.post("/profiles", values);
      message.success("Successfully saved Personal Profile!");
      setSavedValues(values);
      setIsProfileComplete(true);
      setIsEditMode(false);
      setIsFormChanged(false);
      localStorage.removeItem("isReset");
      fetchProfileData();
      router.push(`/private/userIcpc/matchInfo`);
    } catch (error) {
      message.error(
        "Failed to save Personal Profile! Please try again later.",
        error
      );
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setIsFormChanged(false);
    form.setFieldsValue(savedValues);
  };

  const handleReset = () => {
    Modal.confirm({
      title: "Confirm Reset",
      content: "Are you sure you want to clear all your profile data?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setSavedValues({});
        form.resetFields();
        form.setFieldsValue({});
        localStorage.setItem("isReset", "true");
        setIsProfileComplete(false);
        setIsFormChanged(false);
      },
    });
  };

  const handleRadioChange = (e) => {
    setShowICPCEmail(e.target.value);
  };

  const handleICPCEmailChange = (e) => {
    setIsICPCEmailFilled(!!e.target.value);
    setIsFormChanged(true);
  };

  const generateColorFromName = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `#${((hash >> 24) & 0xff).toString(16)}${(
      (hash >> 16) &
      0xff
    ).toString(16)}${((hash >> 8) & 0xff).toString(16)}`.slice(0, 7);
    return color;
  };

  const getInitials = (name) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return initials;
  };

  const avatarColor = generateColorFromName(savedValues.name || "Default User");

  return (
    <Row className="profile-container">
      <Col xs={24} sm={24} md={22} lg={18} xl={16}>
        <div className="profile-content">
          <Row gutter={24}>
            <Col xs={24} sm={24} md={8}>
              <div className="left-profile-section">
                <div
                  className="profile-avatar"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(savedValues.name)}
                </div>
                <Divider />
                <Text strong>Name:</Text>
                <p>{savedValues.name || ""}</p>
                <Text strong>Email:</Text>
                <p>{savedValues.email_address || ""}</p>
              </div>
            </Col>

            <Col xs={24} sm={24} md={16}>
              <div className="right-profile-section">
                {!isProfileComplete || isEditMode ? (
                  <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    onValuesChange={() => setIsFormChanged(true)}
                  >
                    <Form.Item
                      name="name"
                      label="Full Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your full name",
                        },
                      ]}
                    >
                      <Input placeholder="Enter your name" />
                    </Form.Item>
                    <Form.Item
                      name="shirt_size"
                      label="T-shirt size"
                      rules={[
                        {
                          required: true,
                          message: "Please select your T-shirt size",
                        },
                      ]}
                    >
                      <Select placeholder="Select T-shirt size">
                        <Option value={0}>Male S</Option>
                        <Option value={1}>Male M</Option>
                        <Option value={2}>Male L</Option>
                        <Option value={3}>Male XL</Option>
                        <Option value={4}>Male 2XL</Option>
                        <Option value={5}>Male 3XL</Option>
                        <Option value={6}>Male 4XL</Option>
                        <Option value={7}>Male 5XL</Option>
                        <Option value={8}>Female S</Option>
                        <Option value={9}>Female M</Option>
                        <Option value={10}>Female L</Option>
                        <Option value={11}>Female XL</Option>
                        <Option value={12}>Female 2XL</Option>
                        <Option value={13}>Female 3XL</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="gender"
                      label="Select your gender"
                      rules={[
                        {
                          required: true,
                          message: "Please select your gender here",
                        },
                      ]}
                    >
                      <Select placeholder="Select gender">
                        <Option value={0}>Male</Option>
                        <Option value={1}>Female</Option>
                        <Option value={2}>None-Binary Gender</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="preferred_pronouns"
                      label="Preferred pronouns"
                      rules={[
                        {
                          required: true,
                          message: "Please select your preferred pronouns",
                        },
                      ]}
                    >
                      <Select placeholder="Select pronouns">
                        <Option value={1}>He/Him</Option>
                        <Option value={2}>She/Her</Option>
                        <Option value={3}>They/Them</Option>
                        <Option value={4}>Other</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="diet_requirements"
                      label="Dietary requirements"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your dietary requirements",
                        },
                      ]}
                    >
                      <Input placeholder="Enter dietary requirements" />
                    </Form.Item>
                    <Form.Item
                      name="consent_photos"
                      label="Consent to photos"
                      rules={[
                        { required: true, message: "Please select an option" },
                      ]}
                    >
                      <Radio.Group>
                        <Radio value={true}>Yes</Radio>
                        <Radio value={false}>No</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item
                      name="official_account"
                      label="ICPC Global Account"
                      rules={[
                        { required: true, message: "Please select an option" },
                      ]}
                    >
                      <Radio.Group onChange={handleRadioChange}>
                        <Radio value={true}>Yes</Radio>
                        <Radio value={false}>No</Radio>
                      </Radio.Group>
                    </Form.Item>
                    {showICPCEmail === true && (
                      <Form.Item
                        name="official_email"
                        label="Input your ICPC registration email here"
                        rules={[
                          {
                            message:
                              "Please provide the email used for ICPC registration",
                            type: "email",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter your ICPC registration email"
                          onChange={handleICPCEmailChange}
                        />
                      </Form.Item>
                    )}
                    {showICPCEmail === false && (
                      <Text className="no-account-text">
                        Don’t have an ICPC account? Visit the{" "}
                        <Link
                          href="https://icpc.global/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ICPC website
                        </Link>{" "}
                        to register and then come back here and select “Yes” to
                        add your ICPC account before you can continue.
                      </Text>
                    )}
                    <Form.Item>
                      <Flex gap="large" wrap>
                        <Button
                          type="primary"
                          htmlType="submit"
                          disabled={
                            !isFormChanged ||
                            (showICPCEmail && !isICPCEmailFilled)
                          }
                        >
                          Save Profile
                        </Button>
                        <Button type="default" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button type="dashed" onClick={handleReset}>
                          Reset
                        </Button>
                      </Flex>
                    </Form.Item>
                  </Form>
                ) : (
                  <div>
                    <Title level={4}>Personal Settings</Title>
                    <Text
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        fontSize: 18,
                      }}
                    >
                      Your profile has been saved successfully!
                    </Text>
                    <Button
                      type="primary"
                      onClick={handleEdit}
                      style={{
                        marginTop: 20,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </Col>
    </Row>
  );
};

export default ProfilePage;
