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
} from "antd";

import { BookOutlined } from "@ant-design/icons";
import apiService from "../../../services/apiService";
const { Title } = Typography;

const DictionaryManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  }); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    getUniversityList(pagination.current, pagination.pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUniversityList = async (page = 1, pageSize = 10, search = "") => {
    setLoading(true);
    try {
      const response = await apiService.get("/universities", {
        page_no: page,
        page_size: pageSize,
        keyword: search,
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
        message.error("Failed to fetch university data.");
      } 
    } catch (error) {
      console.error("Error fetching university data:", error);
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

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const response = await apiService.post("/universities", values);
      const { msg } = response;
      if (msg === "Success") {
        message.success("University added successfully.");
        closeAddModal();
        getUniversityList(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error("Failed to add university.");
      }
    } catch (error) {
      console.error("Failed to add university:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiService.delete(`/universities/${id}`);
      const { msg } = response;
      if (msg === "Success") {
        message.success("University deleted successfully.");
        getUniversityList(pagination.current, pagination.pageSize, searchTerm);
      } else {
        message.error("Failed to delete university.");
      }
    } catch (error) {
      console.error("Failed to delete university:", error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    getUniversityList(1, pagination.pageSize, value);
  };

  const handleTableChange = (pagination) => {
    getUniversityList(pagination.current, pagination.pageSize, searchTerm);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "University Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Domain",
      dataIndex: "domain",
      key: "domain",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this university?"
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
        University List
      </Title>
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by university name"
          enterButton="Search"
          onSearch={handleSearch}
          style={{ width: 300, marginRight: 16 }}
        />
        <Button type="primary" onClick={openAddModal}>
          Add University
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
        title="Add University"
        open={isModalOpen}
        onCancel={closeAddModal}
        onOk={handleAdd}
      >
        <Form form={form} layout="vertical" name="add_university_form">
          <Form.Item
            name="name"
            label="University Name"
            rules={[
              { required: true, message: "Please input the university name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="domain"
            label="Domain"
            rules={[{ required: true, message: "Please input the domain!" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DictionaryManagement;
