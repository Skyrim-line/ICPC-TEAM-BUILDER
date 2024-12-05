"use client";
import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Popconfirm,
  Space,
  Modal,
  Form,
  Typography,
  DatePicker,
} from "antd";

import { BookOutlined } from "@ant-design/icons";
import apiService from "../../../services/apiService";
import dayjs from "dayjs";

const { Title } = Typography;

const ContenstManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();

  useEffect(() => {
    fetchTaskList(pagination.current, pagination.pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTaskList = async (page = 1, pageSize = 10, search = "") => {
    setLoading(true);
    try {
      const response = await apiService.get("/tasks", {
        page_no: page,
        page_size: pageSize,
        name: search,
      });
      const { msg, data } = response;
      const { total } = data;
      const listData = data.data;

      if (msg === "Success") {
        setData(listData);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total,
        }));
      } else {
        message.error("Failed to fetch tasks data.");
      }
    } catch (error) {
      console.error("Failed to fetch tasks data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsModalOpen(true);
  };

  const closeAddModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const openUpdateModal = (record) => {
    setSelectedRecord(record);
    updateForm.setFieldsValue({
      name: record.name,
      time: dayjs(record.execute_time),
    });
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    updateForm.resetFields();
  };

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const formattedTime = values.time.format("YYYY-MM-DD HH:mm:ss");
      const response = await apiService.post("/tasks", {
        ...values,
        time: formattedTime,
      });
      const { msg } = response;
      if (msg === "Success") {
        message.success("Task added successfully.");
        closeAddModal();
        fetchTaskList(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error("Failed to add task.");
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      const formattedTime = values.time.format("YYYY-MM-DD HH:mm:ss");
      const response = await apiService.put(`/tasks/${selectedRecord.id}`, {
        id: selectedRecord.id,
        name: values.name,
        time: formattedTime,
      });
      const { msg } = response;
      if (msg === "Success") {
        message.success("Task updated successfully.");
        closeUpdateModal();
        fetchTaskList(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error("Failed to update task.");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiService.delete(`/tasks/${id}`);
      const { msg } = response;
      if (msg === "Success") {
        message.success("Task deleted successfully.");
        fetchTaskList(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error("Failed to delete task.");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTaskList(1, pagination.pageSize, value);
  };

  const handleTableChange = (pagination) => {
    fetchTaskList(pagination.current, pagination.pageSize, searchTerm);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Task Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Execute Time",
      dataIndex: "execute_time",
      key: "execute_time",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openUpdateModal(record)}>
            Update
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this task?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title className="dashboard-title">
        <BookOutlined style={{ marginBottom: "1.0em" }} />
        Contest Management
      </Title>
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by task name"
          enterButton="Search"
          onSearch={handleSearch}
          style={{ width: 300, marginRight: 16 }}
        />
        <Button type="primary" onClick={openAddModal}>
          Add Task
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: handleTableChange,
        }}
        rowKey="id"
      />

      <Modal
        title="Add Task"
        open={isModalOpen}
        onCancel={closeAddModal}
        onOk={handleAdd}
      >
        <Form form={form} layout="vertical" name="add_task_form">
          <Form.Item
            name="name"
            label="Task Name"
            rules={[{ required: true, message: "Please input the task name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="time"
            label="Execute Time"
            rules={[{ required: true, message: "Please input the time!" }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Update Task"
        open={isUpdateModalOpen}
        onCancel={closeUpdateModal}
        onOk={handleUpdate}
      >
        <Form form={updateForm} layout="vertical" name="update_task_form">
          <Form.Item
            name="name"
            label="Task Name"
            rules={[{ required: true, message: "Please input the task name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="time"
            label="Execute Time"
            rules={[{ required: true, message: "Please input the time!" }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContenstManagement;
