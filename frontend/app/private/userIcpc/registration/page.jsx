"use client";

import { useState, useEffect, useRef } from "react";
import { message, Card, Button, Modal, Table, Space, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import apiService from "../../../services/apiService";
import DebounceSelect from "../components/DebounceSelect/debounceSelect"; // Import abstract component
import "./registration.css";

const RegistrationPage = () => {
  const isInitialLoad = useRef(true);
  const router = useRouter();
  const [invitationArr, setInvitationArr] = useState([]);
  const [invitationArrMe, setInvitationArrMe] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]); // To store selected students
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // Control invite confirmation modal
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false); // Control accept invitation confirmation modal
  // const [loading, setLoading] = useState(false); // Control loading state
  const [invitedStudent, setInvitedStudent] = useState([]); // Currently selected student to invite
  const [acceptInvitationId, setAcceptInvitationId] = useState(null); // ID of the currently accepted invitation
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [paginationMe, setPaginationMe] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    GetInvitation(pagination.current, pagination.pageSize);
    GetInvitationMe(paginationMe.current, paginationMe.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      getMatchInfoIsComplete();
      isInitialLoad.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMatchInfoIsComplete = async () => {
    try {
      const response = await apiService.get("/profiles/ready");
      const { data } = response;
      if (!data.completed) {
        Modal.info({
          title: "Matching information is not complete",
          content: (
            <div>
              <p>
                You have not completed your matching information. Please
                complete your matching information first.
              </p>
            </div>
          ),
          onOk() {
            router.push("/private/userIcpc/matchInfo");
          },
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch data of students I invited
  const GetInvitation = async (page_no = 1, page_size = 10) => {
    try {
      const response = await apiService.get("/profiles/invitation", {
        page_no,
        page_size,
      });
      const { msg, data, total } = response;
      if (msg === "Success") {
        setInvitationArr(Array.isArray(data) ? data : [data]); // Ensure data is an array
        setPagination((prev) => ({ ...prev, total }));
      } else {
        setInvitationArr([]);
      }
    } catch (error) {
      console.error(error);
      message.error("Cannot get data:", 3);
    }
  };

  // Fetch data of invitations from others
  const GetInvitationMe = async (page_no = 1, page_size = 10) => {
    try {
      const response = await apiService.get("/profiles/invitation/me", {
        page_no,
        page_size,
      });
      const { msg, data, total } = response;
      if (msg === "Success") {
        setInvitationArrMe(Array.isArray(data) ? data : [data]);
        setPaginationMe((prev) => ({ ...prev, total }));
      }
    } catch (error) {
      console.error(error);
      message.error("Cannot get data:", 3);
    }
  };

  // Pagination handler
  const handleTableChange = (pagination) => {
    setPagination(pagination);
    GetInvitation(pagination.current, pagination.pageSize);
  };

  const handleTableChangeMe = (pagination) => {
    setPaginationMe(pagination);
    GetInvitationMe(pagination.current, pagination.pageSize);
  };

  // Fetch student list function, add page parameter for dynamic control of page_no
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
          label: `${student.full_name} (${student.account_name}) - ${student.email}`,
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

  // Logic after clicking invite button
  const handleInvite = (student) => {
    console.log(student, "student");
    setInvitedStudent(student);
    setIsInviteModalOpen(true);
  };

  // Confirmation logic for the invite confirmation modal
  const handleConfirmInvite = async () => {
    try {
      const response = await apiService.post("/profiles/invitation", {
        invited_account_id: invitedStudent, // Send student ID
      });
      if (response.msg === "Success") {
        message.success("Invitation sent successfully!");
        setIsInviteModalOpen(false);
        setSelectedStudents([]);
        GetInvitation(pagination.current, pagination.pageSize); // Update invitation list
      } else {
        message.error("You can only invite one student");
        setSelectedStudents([]);
        setIsInviteModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      setIsInviteModalOpen(false);
      message.error(
        "You have already invited a student and cannot invite again. You can cancel the invitation of students who have not accepted your invitation.",
        3
      );
    }
  };

  // Logic for clicking accept invitation
  const handleAcceptInvitation = (invitationId) => {
    setAcceptInvitationId(invitationId);
    setIsConsentModalOpen(true);
  };

  // Confirmation logic for accepting invitation
  const handleConfirmConsent = async () => {
    try {
      const response = await apiService.post("/profiles/invitation/consent", {
        id: acceptInvitationId, // Pass the accepted invitation ID
      });
      if (response.msg === "Success") {
        message.success("Accepted the invitation!");
        setInvitationArrMe((prevInvitations) =>
          prevInvitations.map(
            (invitation) =>
              invitation.id === acceptInvitationId
                ? { ...invitation, accepted: true } // Mark as accepted
                : { ...invitation, hideAction: true } // Hide buttons for other invitations
          )
        );
        setIsConsentModalOpen(false);
        GetInvitationMe(paginationMe.current, paginationMe.pageSize); // Update invitations from others
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to accept invitation.");
    }
  };

  const handleDeleteInvitation = async (id) => {
    try {
      const response = await apiService.delete(`/profiles/invitation/${id}`);
      const { msg } = response;
      if (msg === "Success") {
        message.success("Deleted successfully.");
        GetInvitation(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to delete.");
    }
  };

  // Display table of invitations from others
  const invitationMeColumns = [
    {
      title: "Invited By",
      dataIndex: "invitor_account_name",
      key: "invitor_account_name",
    },
    {
      title: "Email",
      dataIndex: "invitor_account_email",
      key: "invitor_account_email",
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "action",
      render: (id, record) => {
        if (record.accepted) {
          return <span>Accepted</span>; // Show "Accepted" text for accepted invitations
        }
        if (record.hideAction) {
          return null; // Hide buttons for other invitations
        }
        return id ? (
          <Button type="primary" onClick={() => handleAcceptInvitation(id)}>
            Accept Invitation
          </Button>
        ) : null;
      },
    },
  ];

  // Display table of students I invited
  const invitationColumns = [
    {
      title: "Invited Student",
      dataIndex: "invited_account_name",
      key: "invited_account_name",
    },
    {
      title: "Email",
      dataIndex: "invited_account_email",
      key: "invited_account_email",
    },
    {
      title: "Accepted",
      dataIndex: "accepted",
      key: "accepted",
      render: (accepted) => (accepted ? "Yes" : "No"),
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "action",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this invitation?"
            onConfirm={() => handleDeleteInvitation(record.id)}
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
    <div className="registration-page">
      {/* Card for inviting students */}
      <Card title="Invite Students" className="card-select-container">
        <DebounceSelect
          value={selectedStudents} // Selected students
          placeholder="Search for students"
          fetchOptions={(searchValue, page) =>
            fetchStudentOptions(searchValue, page)
          } // Pass function to fetch student options
          onChange={(newValue) => setSelectedStudents(newValue || [])} // Update selection
          style={{ width: "100%" }}
        />
        <Button
          type="primary"
          onClick={() => handleInvite(selectedStudents)}
          disabled={selectedStudents?.length === 0}
          style={{ marginTop: "16px" }}
        >
          Send Invitation
        </Button>
      </Card>

      {/* Table for displaying invited students */}
      <Card
        title="Your Invitations"
        className="card-select-container"
        style={{ marginTop: "20px" }}
      >
        <Table
          dataSource={invitationArr}
          columns={invitationColumns}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handleTableChange,
          }}
        />
      </Card>

      {/* Table for displaying invitations from others */}
      <Card
        title="Invitations for Me"
        className="card-select-container"
        style={{ marginTop: "20px" }}
      >
        <Table
          dataSource={invitationArrMe}
          columns={invitationMeColumns}
          rowKey="id"
          pagination={{
            current: paginationMe.current,
            pageSize: paginationMe.pageSize,
            total: paginationMe.total,
            onChange: handleTableChangeMe,
          }}
        />
      </Card>
      {/* Confirmation modal for inviting */}
      <Modal
        title="Confirm Invitation"
        open={isInviteModalOpen}
        onOk={handleConfirmInvite}
        onCancel={() => setIsInviteModalOpen(false)}
      >
        <p>Are you sure you want to invite {invitedStudent?.label}?</p>
      </Modal>

      {/* Confirmation modal for accepting invitation */}
      <Modal
        title="Confirm Consent"
        open={isConsentModalOpen}
        onOk={handleConfirmConsent}
        onCancel={() => setIsConsentModalOpen(false)}
      >
        <p>Are you sure you want to accept this invitation?</p>
      </Modal>
    </div>
  );
};

export default RegistrationPage;
