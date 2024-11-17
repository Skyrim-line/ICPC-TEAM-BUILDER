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
  Select,
  Drawer,
  Tag,
  Card,
  Descriptions,
  Row,
  Col,
  Divider,
} from "antd";
import { useRouter } from "next/navigation";
import {
  BookOutlined,
  ExclamationCircleFilled,
  CloseCircleOutlined,
} from "@ant-design/icons";
import apiService from "../../../services/apiService";
import DebounceSelect from "../components/DebounceSelect/debounceSelect";

const { Title } = Typography;

const proficiencyMapping = {
  0: { label: "Not at all", color: "red" },
  1: { label: "Basic", color: "blue" },
  2: { label: "Proficient", color: "green" },
};

const GroupManagement = () => {
  const [data, setData] = useState([]);
  const [noMatchList, setNoMatchList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mathLoading, setMathLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [noMatchPagination, setNoMatchPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  const [canReleased, setCanReleased] = useState(false);
  const router = useRouter();

  const getProficiencyTag = (level) => {
    const { label, color } = proficiencyMapping[level] || {};
    return <Tag color={color}>{label}</Tag>;
  };

  useEffect(() => {
    fetchGroupList(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUnmatchStudents(noMatchPagination.current, noMatchPagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGroupList = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await apiService.get("/groups", {
        page_no: page,
        page_size: pageSize,
      });
      const { msg, data } = response;
      const { total } = data;
      const listData = data.data;
      const hasUnreleased = listData?.some((item) => item.released === false);
      setCanReleased(hasUnreleased);
      if (msg === "Success") {
        setData(listData);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total,
        }));
      } else {
        Modal.info({
          title: "Coach Permissions",
          icon: <ExclamationCircleFilled />,
          content: "Please create a coach account to use this feature?",
          okText: "Yes",
          onOk: () => {
            Modal.destroyAll();
            router.back();
          },
        });
      }
    } catch (error) {
      console.error("Error fetching Group data:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchUnmatchStudents = async (page = 1, pageSize = 10) => {
    setMathLoading(true);
    try {
      const response = await apiService.get("/groups/unmatched", {
        page_no: page,
        page_size: pageSize,
      });
      const { msg, data } = response;
      const { total } = data;
      const listData = data.data;

      if (msg === "Success") {
        setNoMatchList(listData);
        setNoMatchPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total,
        }));
      } else {
        message.error("Error fetching data.");
      }
    } catch (error) {
      console.error("Error fetching  data:", error);
    } finally {
      setMathLoading(false);
    }
  };

  const fetchStudentOptions = async (searchValue, page = 1, pageSize = 10) => {
    if (typeof searchValue !== "string" || !searchValue.trim()) {
      return { options: [], total: 0 };
    }
    try {
      const response = await apiService.get("/accounts/search", {
        keyword: searchValue,
        page_no: page,
        page_size: pageSize,
      });
      const { data } = response;
      const students = data?.data || []; // Ensure data is an array

      return {
        options: students.map((student) => ({
          label: `${student.full_name}-(${student.account_name}) - ${student.email}`,
          value: student.id,
        })),
        total: data.total || 0, // Ensure total is defined
      };
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch students.", 3);
      return { options: [], total: 0 };
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
      const newLevel = values.level;
      const name = values.name;
      if (values.members?.length !== 3) {
        message.info("please select 3 members");
        return;
      }
      const newMembers = values.members.map((member) => Number(member));
      const response = await apiService.post("/groups", {
        name,
        level: newLevel.value,
        members: newMembers,
      });
      const { msg } = response;
      if (msg === "Success") {
        message.success("Group added successfully.");
        closeAddModal();
        fetchGroupList(pagination.current, pagination.pageSize);
      } else {
        message.error(response.data);
      }
    } catch (error) {
      console.error("Failed to add group:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiService.delete(`/groups/${id}`);
      const { msg } = response;
      if (msg === "Success") {
        message.success("Group deleted successfully.");
        fetchGroupList(pagination.current, pagination.pageSize);
      } else {
        message.error("Failed to delete group.");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const handleTableChange = (pagination) => {
    fetchGroupList(pagination.current, pagination.pageSize);
  };

  const handeleMatchTableChange = (noMatchPagination) => {
    fetchUnmatchStudents(noMatchPagination.current, noMatchPagination.pageSize);
  };

  const openGroupDetailModal = async (id) => {
    try {
      const response = await apiService.get(`/groups/${id}`);
      if (response.msg === "Success") {
        setGroupDetails(response.data);
        setDrawerVisible(true);
      } else {
        message.error("Failed to fetch group details.");
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
    }
  };

  const renderProficiencyTags = (member) => {
    const proficiencies = [
      "proficiency_algorithm_design_and_analysis",
      "proficiency_data_structures_and_algorithms",
      "proficiency_principles_of_programming",
      "proficiency_programming_challenges",
      "proficiency_programming_fundamentals",
    ];

    return proficiencies
      .filter((key) => member[key])
      .map((key) => (
        <Tag color="blue" key={key} style={{ marginBottom: 5 }}>
          {key
            .replace(/proficiency_/g, "")
            .replace(/_/g, " ")
            .toUpperCase()}
        </Tag>
      ));
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Group Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      render: (level) => {
        const genderMap = {
          0: "Level A",
          1: "Level B",
        };
        return genderMap[level] || "Unknown";
      },
    },
    {
      title: "Released",
      key: "released",
      render: (_, record) => <div>{record.released ? "Yes" : "No"}</div>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this group?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
          <Button type="link" onClick={() => openGroupDetailModal(record.id)}>
            Detail
          </Button>
        </Space>
      ),
    },
  ];

  const columns_match = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Name",
      dataIndex: "real_name",
      key: "real_name",
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      render: (level) => {
        const genderMap = {
          0: "Level A",
          1: "Level B",
        };
        return genderMap[level] || "Unknown";
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
  ];

  const handleRelease = async () => {
    try {
      const response = await apiService.post("/groups/release");
      const { msg } = response;
      if (msg === "Success") {
        message.success("released data successfully.");
        fetchGroupList(pagination.current, pagination.pageSize);
        fetchUnmatchStudents(
          noMatchPagination.current,
          noMatchPagination.pageSize
        );
      } else {
        message.error("Error released data.");
      }
    } catch (error) {
      console.error("Error released data:", error);
    }
  };

  return (
    <div>
      <Title className="dashboard-title">
        <BookOutlined style={{ marginRight: "0.3em" }} />
        Group Management
      </Title>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={openAddModal}
          style={{ marginRight: "20px" }}
        >
          Add Group
        </Button>
        {canReleased ? (
          <Button type="primary" onClick={handleRelease}>
            release
          </Button>
        ) : (
          ""
        )}
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
      <Divider />
      <Title className="dashboard-title">
        <CloseCircleOutlined style={{ marginRight: "0.3em" }} />
        No Match List
      </Title>
      <Table
        columns={columns_match}
        dataSource={noMatchList}
        loading={mathLoading}
        pagination={{
          current: noMatchPagination.current,
          pageSize: noMatchPagination.pageSize,
          total: noMatchPagination.total,
          showSizeChanger: true,
          onChange: handeleMatchTableChange,
        }}
        rowKey="id"
      />

      <Drawer
        title="Group Details"
        placement="right"
        width={700}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {groupDetails && (
          <div>
            <Card title="Group Details" style={{ marginBottom: 20 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Group Name">
                  {groupDetails.name}
                </Descriptions.Item>
                <Descriptions.Item label="Level">
                  {groupDetails.level === 1 ? "B" : "A"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="Members" style={{ marginTop: 20 }}>
              {groupDetails.members.map((member) => (
                <Card
                  key={member.id}
                  type="inner"
                  title={member.real_name}
                  style={{ marginBottom: 20 }}
                >
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="Email">
                      {member.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Competitive Experience">
                      {member.competitive_experience || "No"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Proficiency (C)">
                      {getProficiencyTag(member.proficiency_c)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Proficiency (C++)">
                      {getProficiencyTag(member.proficiency_cpp)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Proficiency (Java)">
                      {getProficiencyTag(member.proficiency_java)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Proficiency (Python)">
                      {getProficiencyTag(member.proficiency_python)}
                    </Descriptions.Item>
                  </Descriptions>
                  <Divider />
                  <Row gutter={[8, 8]}>
                    <Col span={24}>
                      <strong>Completed Subjects:</strong>
                      <div style={{ marginTop: 8 }}>
                        {renderProficiencyTags(member)}
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Card>
          </div>
        )}
      </Drawer>

      {/* Add Group Modal */}
      <Modal
        title="Add Group"
        open={isModalOpen}
        onCancel={closeAddModal}
        onOk={handleAdd}
      >
        <Form form={form} layout="vertical" name="add_group_form">
          <Form.Item
            name="name"
            label="Group Name"
            rules={[
              { required: true, message: "Please input the group name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: "Please select the level!" }]}
          >
            <Select
              labelInValue
              options={[
                { value: 0, label: "LevelA" },
                { value: 1, label: "LevelB" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="members"
            label="Members"
            rules={[{ required: true, message: "Please select members" }]}
          >
            <DebounceSelect
              value={selectedStudents}
              placeholder="Search for students"
              fetchOptions={(searchValue, page) =>
                fetchStudentOptions(searchValue, page)
              }
              onChange={(newValue) => setSelectedStudents(newValue || [])}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupManagement;
