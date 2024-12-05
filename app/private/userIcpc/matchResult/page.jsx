"use client";

import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Divider,
  Form,
  message,
  Typography,
  List,
  Result,
  Card,
  Input,
  Button,
  Tag,
} from "antd";
import {
  ClockCircleOutlined,
  IdcardOutlined,
  FormOutlined,
} from "@ant-design/icons";
import apiService from "../../../services/apiService";
import { useRouter } from "next/navigation";
import "./result.css";
import useRequireAuth from "../../../hooks/useRequireAuth";

const { Text } = Typography;

const ResultPage = () => {
  const [form] = Form.useForm();
  const { user } = useRequireAuth();
  const router = useRouter();
  const [savedValues, setSavedValues] = useState({
    group_id: null,
    group_name: "",
    team_members: [],
  });
  const [matchResult, setMatchResult] = useState(false);
  const [matchReady, setMatchReady] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null); // Track the expanded card ID
  const [waiting, setWaiting] = useState(false);
  const [groupInfo, setGroupInfo] = useState(false);

  const proficiencyColors = {
    C: "blue",
    "C++": "purple",
    Java: "orange",
    Python: "green",
  };
  const getTag = (value) => (
    <Tag color={value ? "blue" : "red"}>{value ? "Yes" : "No"}</Tag>
  );

  const fetchProfileData = async () => {
    try {
      const response = await apiService.get("/profiles");
      const data = response.data;
      form.setFieldsValue(data);
      setSavedValues((prevValues) => ({ ...prevValues, ...data }));
    } catch (error) {
      message.error("Cannot get profile data:", error);
      router.push(`/public/login`);
    }
  };
  const getMyGroupInfo = async () => {
    try {
      const response = await apiService.get("/groups/me");
      const data = response.data;
      console.log("Get Group Info", data);
      if (response.msg === "Success") {
        setWaiting(true);
        setGroupInfo(true);
        setSavedValues((prevValues) => ({
          ...prevValues,
          group_id: data.group_id,
          group_name: data.group_name,
          team_members: data.members.map((member) => ({
            ...member, // directly pass all properties of the member
          })),
        }));
      } else {
        console.log("No group info found");
        setWaiting(false);
      }
    } catch (error) {
      message.error("Cannot get group data:", error);
    }
  };

  const fetchUserInfoData = async () => {
    try {
      const response = await apiService.get("/profiles/ready");
      const data = response.data;
      console.log("Check whether completed User Info", data);
      console.log("waiitng", waiting);
      if (data.completed === false && data.ready === false) {
        setMatchReady(true);
        setMatchResult(true);
        setWaiting(false);
      } else if (data.completed === true && data.ready === false) {
        setMatchReady(true);
        setMatchResult(true);
        setWaiting(false);
      } else if (data.completed === true && data.ready === true) {
        setWaiting(true);
        setGroupInfo(false); // This ensures "Matching in Progress" shows
      }
    } catch (error) {
      console.error("Cannot get user info data:", error);
      router.push(`/private/userIcpc/matchInfo`);
    }
  };
  useEffect(() => {
    if (!user) {
      router.push(`/public/login`);
    } else {
      fetchProfileData();
      fetchUserInfoData();
      getMyGroupInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    form.setFieldsValue({ group_name: savedValues.group_name });
  }, [savedValues, form]);

  // Submit handler for updating the team name
  const handleTeamNameSubmit = async (values) => {
    try {
      // API call to update the team name
      const response = await apiService.post("/groups/me", {
        name: values.group_name,
      });

      if (response.status === 200) {
        message.success("Team name updated successfully!");
        setSavedValues((prev) => ({ ...prev, group_name: values.group_name }));
      }
    } catch (error) {
      console.error("Failed to update team name:", error);
      message.error("Failed to update team name:", 3);
    }
  };

  // Generate a deterministic color based on the name
  const generateColorFromName = (name) => {
    if (!name) return "#000000";
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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleCardClick = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <Row className="result-page">
      <Col xs={24} sm={24} md={22} lg={18} xl={16}>
        <div className="profile-content">
          {groupInfo && (
            <Result
              status="success"
              title="Congratulations! You have matched!"
              subTitle="You can view your team information below."
            />
          )}

          {waiting && !groupInfo && (
            <Result
              icon={<ClockCircleOutlined style={{ color: "#faad14" }} />}
              title="Matching in Progress"
              subTitle="Your team information is being processed. Please wait for the results."
            />
          )}
          {matchResult && matchReady && (
            <Result
              status="error"
              title="You have not matched with anyone."
              subTitle="Please complete the 'Programming Skills' and click the 'Participate' button to match with others."
            />
          )}

          <div
            className="profile-avatar"
            style={{
              backgroundColor: generateColorFromName(
                savedValues.name || "Default User"
              ),
            }}
          >
            {getInitials(savedValues.name)}
          </div>
          <Divider />
          <div className="centered-info">
            <div className="info-item">
              <Text strong>Name: </Text>
              <span>{savedValues.name || "N/A"}</span>
            </div>
            <div className="info-item">
              <Text strong>Email: </Text>
              <span>{savedValues.email_address || "N/A"}</span>
            </div>
          </div>
          <Divider />
          {savedValues.team_members && savedValues.team_members.length > 0 ? (
            <Card title="My Team Information">
              <Form
                form={form} // 绑定 form 实例
                layout="vertical"
                // initialValues={{ group_name: savedValues.group_name }}
                onFinish={handleTeamNameSubmit}
              >
                <div className="centered-info">
                  <div className="info-item">
                    <Form.Item noStyle>
                      <Input
                        addonBefore={<Text strong>Team ID: </Text>}
                        addonAfter={<IdcardOutlined />}
                        value={savedValues.group_id || "N/A"}
                        readOnly
                        style={{
                          width: "400px",
                          marginLeft: "8px",
                          backgroundColor: "#f0f2f5",
                          textAlign: "right",
                        }}
                      />
                    </Form.Item>
                  </div>
                  <div className="info-item">
                    {/* <Text strong>Team Name: </Text> */}
                    <Form.Item
                      name="group_name"
                      value={savedValues.group_name || "N/A"}
                    >
                      <Input
                        addonBefore={<Text strong>Team Name:</Text>}
                        addonAfter={<FormOutlined />}
                        placeholder="Enter team name"
                        style={{
                          width: "392px",
                          backgroundColor: "#f0f2f5",
                          marginLeft: "8px",
                          textAlign: "right",
                        }}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item style={{ textAlign: "right", marginTop: "16px" }}>
                    <Button type="primary" htmlType="submit">
                      Save Team Name
                    </Button>
                  </Form.Item>
                </div>
              </Form>
            </Card>
          ) : (
            <div></div>
          )}

          {savedValues.team_members && savedValues.team_members.length > 0 ? (
            <Card title="My Teammates" style={{ marginTop: "30px" }}>
              <List
                dataSource={savedValues.team_members}
                renderItem={(item) => {
                  const isExpanded = expandedCard === item.id;
                  // Define color mapping for each proficiency label

                  // Filter proficiencies that are greater than zero
                  console.log("Item", item);
                  const proficiencies = [
                    { label: "C", value: item.proficiency_c },
                    { label: "C++", value: item.proficiency_cpp },
                    { label: "Java", value: item.proficiency_java },
                    { label: "Python", value: item.proficiency_python },
                  ].filter((proficiency) => proficiency.value > 0);
                  return (
                    <List.Item onClick={() => handleCardClick(item.id)}>
                      <List.Item.Meta
                        title={item.name}
                        description={
                          <div>
                            <div className="info-item-2">
                              <Text strong>Email: </Text>
                              <a
                                href={`mailto:${item.email}`}
                                style={{ color: "#1890ff" }}
                              >
                                {item.email || "N/A"}
                              </a>
                            </div>

                            {isExpanded ? (
                              <div className="proficiency-details">
                                <div className="info-item-2">
                                  <Text strong>Proficient Language: </Text>
                                  <div className="proficiency-list">
                                    {proficiencies.map((prof) => (
                                      <Tag
                                        color={proficiencyColors[prof.label]}
                                        key={prof.label}
                                      >
                                        {prof.label}/{" "}
                                        {prof.value === 1
                                          ? "Basic"
                                          : "Proficient"}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>

                                <div className="info-item-2">
                                  <Text strong>Programming Fundamentals: </Text>
                                  {getTag(
                                    item.proficiency_programming_fundamentals
                                  )}
                                </div>
                                <div className="info-item-2">
                                  <Text strong>
                                    Principles of Programming:{" "}
                                  </Text>
                                  {getTag(
                                    item.proficiency_principles_of_programming
                                  )}
                                </div>
                                <div className="info-item-2">
                                  <Text strong>
                                    Data Structures and Algorithms:{" "}
                                  </Text>
                                  {getTag(
                                    item.proficiency_data_structures_and_algorithms
                                  )}
                                </div>
                                <div className="info-item-2">
                                  <Text strong>
                                    Algorithm Design and Analysis:{" "}
                                  </Text>
                                  {getTag(
                                    item.proficiency_algorithm_design_and_analysis
                                  )}
                                </div>
                                <div className="info-item-2">
                                  <Text strong>Programming Challenges: </Text>
                                  {getTag(
                                    item.proficiency_programming_challenges
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        }
                        avatar={
                          <div
                            className="teammate-profile"
                            style={{
                              backgroundColor: generateColorFromName(item.name),
                            }}
                          >
                            {getInitials(item.name)}
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          ) : (
            <div></div>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default ResultPage;
