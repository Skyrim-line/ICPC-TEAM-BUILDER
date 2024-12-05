"use client";

import React, { useEffect, useState } from "react";
import {
  Space,
  Table,
  message,
  Modal,
  Button,
  Form,
  Input,
  Select,
  Popconfirm,
  Typography,
  Divider,
} from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import apiService from "../../../services/apiService";
const { Option } = Select;
const { Title } = Typography;

// UserManagement component
const UserManagement = () => {
  const [accountList, setAccountListArr] = useState([]);
  const [universityList, setUniversityList] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // 存储搜索关键字
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [visible, setVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  // New state to control the visibility of the "Add User" modal
  const [addUserVisible, setAddUserVisible] = useState(false);
  const [isCoach, setIsCoach] = useState(false); // Track if 'coach' role is selected
  // const [rolesList, setRolesList] = useState([]); // 动态角色列表
  const [form] = Form.useForm();

  useEffect(() => {
    fetch_account_list(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetch_account_list = async (page = 1, pageSize = 10, search = "") => {
    try {
      console.log("This is page", page, pageSize);
      const response = await apiService.get("/accounts", {
        page_no: page,
        page_size: pageSize,
        name: search,
      });
      const { msg, data } = response;
      if (msg === "Success" && data) {
        setAccountListArr(data.data || []);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: data.total || 0,
        }));
      } else {
        message.error("Failed to fetch accounts.", 3);
      }
    } catch (error) {
      console.log("This is error", error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetch_account_list(1, pagination.pageSize, value);
  };

  // Get user information
  const get_account_info = async (id) => {
    try {
      const response = await apiService.get(`/accounts/${id}`);
      const { msg, data } = response;

      if (msg === "Success" && data) {
        setUserInfo(data);
        // console.log("This is data", data);

        // Dynamically generate rolesList, including the user's ID
        const dynamicRolesList = data.roles.map((role) => ({
          id: role.id, // 使用 `Option` 的 `key`
          name: role.name,
        }));

        console.log("This is Role list get from user", dynamicRolesList);
        form.setFieldsValue({
          ...data,
          roles: data.roles.map((role) => role.name), // Map roles to their IDs
        });
        setVisible(true);
      } else {
        message.error("Failed to fetch account info.", 3);
      }
    } catch (error) {
      console.error("This is error", error);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setUserInfo(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const updatedData = await form.validateFields();
      if (userInfo) {
        const selectedRoles = []
          .concat(updatedData.roles)
          .map((roleName) => {
            const roleId =
              {
                admin: 1,
                user: 2,
                coach: 3,
                "site-coordinator": 4,
              }[roleName] || null;

            return roleId ? { id: roleId, name: roleName } : null;
          })
          .filter(Boolean);
        console.log("This is selectedRoles", selectedRoles);
        const response = await apiService.put(`/accounts/${userInfo.id}`, {
          id: userInfo.id,
          name: updatedData.name,
          email: updatedData.email,
          password: updatedData.password,
          remark: updatedData.remark,
          roles: selectedRoles,
        });
        if (response.msg === "Success") {
          message.success("User information updated successfully.");
          setVisible(false);
          fetch_account_list(pagination.current, pagination.pageSize); // Refresh list
        }
      } else {
        const Roles = []
          .concat(updatedData.roles)
          .map((roleName) => {
            const roleId =
              {
                admin: 1,
                user: 2,
                coach: 3,
                "site-coordinator": 4,
              }[roleName] || null;

            return roleId ? { id: roleId, name: roleName } : null;
          })
          .filter(Boolean); // Removes a possibly null role
        const newUser = {
          name: updatedData.name,
          email: updatedData.email,
          password: updatedData.password,
          remark: updatedData.remark,
          roles: Roles,
          university_id: updatedData.university_id,
        };
        console.log("This is newUser", newUser);

        const response = await apiService.post("/accounts", newUser);

        if (response.msg === "Success") {
          const addedUser = { ...newUser, id: accountList.length + 1 };
          setAccountListArr([...accountList, addedUser]);
          message.success("New user added successfully.");
          setAddUserVisible(false); // Close the Add User modal
        } else {
          message.error("Failed to add new user.", 3);
        }
      }

      form.resetFields();
      setUserInfo(null);
    } catch (error) {
      console.error("This is error", error);
      // message.error("Failed to save updated information.", 3);
    }
  };

  const handleAdd = () => {
    setUserInfo(null);
    fetch_university_list();
    setAddUserVisible(true);
    form.resetFields();
    setIsCoach(false);
  };

  const handleAddUserCancel = () => {
    setAddUserVisible(false);
    form.resetFields();
    setIsCoach(false);
  };
  const handleRoleChange = (value) => {
    setIsCoach(value.includes("coach")); // Check if 'coach' is selected
  };

  const fetch_university_list = async (
    page = 1,
    pageSize = 10,
    search = ""
  ) => {
    try {
      const response = await apiService.get("/universities", {
        page_no: page,
        page_size: pageSize,
        keyword: search,
      });
      const { msg, data } = response;
      const listData = data.data;

      if (msg === "Success") {
        setUniversityList(listData);
      } else {
        message.error("Failed to fetch university list.");
      }
    } catch (error) {
      console.error("Error fetching university list:", error);
    }
  };
  // Delete
  const handleDelete = async (id) => {
    try {
      const response = await apiService.delete(`/accounts/${id}`);
      if (response.msg === "Success") {
        message.success("User deleted successfully.");
      } else {
        message.error("Failed to delete user.", 3);
      }
      const newData = accountList.filter((item) => item.id !== id);
      setAccountListArr(newData);
    } catch (error) {
      console.error("This is error", error);
    }
  };

  // Modal rendering function for adding a new user
  const renderAddUserModal = () => (
    <Modal
      title="Add New User"
      visible={addUserVisible}
      onCancel={handleAddUserCancel}
      footer={[
        <Button key="close" onClick={handleAddUserCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>
        <Form.Item label="Password" name="password">
          <Input />
        </Form.Item>
        <Form.Item label="Remark" name="remark">
          <Input />
        </Form.Item>
        <Form.Item label="Roles" name="roles">
          <Select placeholder="Select roles" onChange={handleRoleChange}>
            <Option key={1} value="admin">
              admin
            </Option>
            <Option key={2} value="user">
              user
            </Option>
            <Option key={3} value="coach">
              coach
            </Option>
            <Option key={4} value="site-coordinator">
              site-coordinator
            </Option>
          </Select>
        </Form.Item>
        {isCoach && (
          <Form.Item label="University" name="university_id">
            <Select placeholder="Select university here">
              {universityList.map((university) => (
                <Option key={university.id} value={university.id}>
                  {university.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );

  // User Edit Details Modal rendering function
  const renderUserInfoModal = () => (
    <Modal
      title="Edit User Information"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="close" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>
        <Form.Item label="Password" name="password">
          <Input />
        </Form.Item>
        <Form.Item label="Remark" name="remark">
          <Input />
        </Form.Item>
        <Form.Item label="Roles" name="roles">
          <Select placeholder="Select roles">
            <Option key={1} value="admin">
              admin
            </Option>
            <Option key={2} value="user">
              user
            </Option>
            <Option key={3} value="coach">
              coach
            </Option>
            <Option key={4} value="site-coordinator">
              site-coordinator
            </Option>
          </Select>
        </Form.Item>
        <Form.Item label="Last Login Time" name="last_login_time">
          <Input disabled />
        </Form.Item>
      </Form>
    </Modal>
  );

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: "ascend",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            color="primary"
            variant="link"
            onClick={() => get_account_info(record.id)}
          >
            Edit Details
          </Button>
          {accountList.length >= 1 ? (
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button color="danger" variant="link">
                Delete
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  // This code below is main part of the page
  return (
    <div>
      <Title className="dashboard-title">
        <UserAddOutlined style={{ marginBottom: "1.0em" }} />
        User Management
      </Title>
      <Divider />

      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by User name"
          enterButton="Search"
          onSearch={handleSearch}
          style={{ width: 300, marginRight: 16 }}
        />
        <Button
          onClick={handleAdd}
          type="primary"
          style={{
            marginBottom: 16,
          }}
        >
          Add a new user
        </Button>
        {/* // Including the new modal in the render */}
        {renderAddUserModal()}
      </div>

      <Table
        dataSource={accountList}
        columns={columns}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => {
            setPagination((prev) => ({ ...prev, current: page, pageSize }));
            fetch_account_list(page, pageSize, searchTerm);
          },
        }}
      />
      {renderUserInfoModal()}
    </div>
  );
};

export default UserManagement;
