"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import apiService from "../../../services/apiService"; // Call API service
import useRequireAuth from "../../../hooks/useRequireAuth";
import {
  Steps,
  Card,
  Form,
  Input,
  Button,
  Divider,
  Select,
  Tag,
  message,
  Table,
  Radio,
  Modal,
} from "antd";
import { useRouter } from "next/navigation";
import debounce from "lodash/debounce";
import "./teamInfo.css";

// Submit button component
const SubmitButton = ({ visible, children }) => {
  if (!visible) return null; // Return null if not visible
  return (
    <Button type="primary" htmlType="submit">
      {children}
    </Button>
  );
};

// Tag rendering function
const tagRender = ({ label, value, closable, onClose }) => {
  const colorMap = {
    programming_fundamentals: "red",
    principles_of_programming: "green",
    data_structures_and_algorithms: "blue",
    algorithm_design_and_analysis: "purple",
    programming_challenges: "orange",
  };
  return (
    <Tag
      color={colorMap[value] || "gray"}
      closable={closable}
      onClose={onClose}
    >
      {label}
    </Tag>
  );
};

// Debounced search function
const useDebouncedSearch = (setLoading, setStudentOptions) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useCallback(
    debounce(async (keyword) => {
      if (!keyword.trim()) return;
      setLoading(true);
      try {
        const response = await apiService.get("/accounts/search", {
          keyword,
          page_no: 1,
          page_size: 10,
        });
        const students = response.data?.data?.filter(
          (student) =>
            student.account_name
              .toLowerCase()
              .includes(keyword.toLowerCase()) ||
            student.email.toLowerCase().includes(keyword.toLowerCase())
        );
        const options = students?.map((student) => ({
          label: `${student.full_name} (${student.account_name}) - ${student.email}`,
          value: student.id,
          info: student,
        }));
        setStudentOptions(options);
        setLoading(false);
      } catch (error) {
        console.log(error);
        message.error("Failed to fetch students.");
        setLoading(false);
      }
    }, 1000),
    [setLoading, setStudentOptions]
  );

const TeamInfoPage = () => {
  const { Option } = Select;
  const isInitialLoad = useRef(true);
  const router = useRouter();
  const [form] = Form.useForm();
  const { user } = useRequireAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isMatchInfoComplete, setIsMatchInfoComplete] = useState(false);
  const [proficiency, setProficiency] = useState({});
  const [selectedCourses, setSelectedCourses] = useState({});
  const [studentOptions, setStudentOptions] = useState([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const [savedValues, setSavedValues] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const debouncedSearch = useDebouncedSearch(setLoading, setStudentOptions);
  // const [readymatch,setReadymatch] = useState(true)

  // Retrieve previously saved data and populate fields
  useEffect(() => {
    if (router.isReady) {
      const step = parseInt(router.query.step) || 1;
      setCurrentStep(step);
    }
    if (!user) {
      router.push("/public/login");
    }
    const isReset = localStorage.getItem("isReset") === "true";
    if (!isReset) {
      fetchMatchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  useEffect(() => {
    if (isInitialLoad.current) {
      console.log("Initial Load");
      getUserInfoIsComplete();
      isInitialLoad.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate proficiency data
  useEffect(() => {
    if (savedValues) {
      const savedProficiency = {
        proficiency_c: savedValues.proficiency_c,
        proficiency_cpp: savedValues.proficiency_cpp,
        proficiency_java: savedValues.proficiency_java,
        proficiency_python: savedValues.proficiency_python,
        // proficiency_javascript: savedValues.proficiency_javascript,
      };
      setProficiency(savedProficiency);
    }
  }, [savedValues]);

  const getUserInfoIsComplete = async () => {
    try {
      const response = await apiService.get("/profiles");
      const { data } = response;
      if (data.diet_requirements) {
        setIsProfileComplete(true);
        // setIsMatchInfoComplete(true);
      } else {
        Modal.info({
          title: "Personal information is not complete",
          content: (
            <div>
              <p>
                You have not completed your personal information. Please
                complete your personal information first.
              </p>
            </div>
          ),
          onOk() {
            router.push("/private/userIcpc/profile");
          },
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMatchData = async () => {
    try {
      const response = await apiService.get("/profiles/matchingInfo");
      if (response.msg === "Success") {
        form.setFieldsValue(response.data);
        const selectedCoursesFromData = [];
        if (response.data.proficiency_programming_fundamentals) {
          selectedCoursesFromData.push("programming_fundamentals");
        }
        if (response.data.proficiency_principles_of_programming) {
          selectedCoursesFromData.push("principles_of_programming");
        }
        if (response.data.proficiency_data_structures_and_algorithms) {
          selectedCoursesFromData.push("data_structures_and_algorithms");
        }
        if (response.data.proficiency_algorithm_design_and_analysis) {
          selectedCoursesFromData.push("algorithm_design_and_analysis");
        }
        if (response.data.proficiency_programming_challenges) {
          selectedCoursesFromData.push("programming_challenges");
        }

        form.setFieldsValue({
          learned_courses: selectedCoursesFromData,
        });
        setSavedValues(response.data);
        setIsMatchInfoComplete(true);
      } else {
        setIsMatchInfoComplete(false);
      }
    } catch (error) {
      console.log(error);
      setIsMatchInfoComplete(false);
    }
  };

  const languages = ["C", "CPP", "Java", "Python"];
  const proficiencyOptions = [
    { label: "Not at all", value: 0 },
    { label: "Somewhat", value: 1 },
    { label: "Yes", value: 2 },
  ];

  const handleProficiencyChange = (language, value) => {
    setProficiency({
      ...proficiency,
      [`proficiency_${language.toLowerCase()}`]: value,
    });
    form.setFieldsValue({
      [`proficiency_${language.toLowerCase()}`]: value,
    });
  };

  const handleCourseChange = (values) => {
    const updatedCourses = {
      proficiency_programming_fundamentals: values.includes(
        "programming_fundamentals"
      ),
      proficiency_principles_of_programming: values.includes(
        "principles_of_programming"
      ),
      proficiency_data_structures_and_algorithms: values.includes(
        "data_structures_and_algorithms"
      ),
      proficiency_algorithm_design_and_analysis: values.includes(
        "algorithm_design_and_analysis"
      ),
      proficiency_programming_challenges: values.includes(
        "programming_challenges"
      ),
    };
    setSelectedCourses(updatedCourses);
    form.setFieldsValue(updatedCourses);
  };

  const columns = [
    {
      title: "",
      dataIndex: "language",
      key: "language",
      render: (text) => <strong>{text}</strong>,
    },
    ...proficiencyOptions.map((option) => ({
      title: option.label,
      dataIndex: option.value,
      key: option.value,
      render: (_, record) => (
        <Radio.Group
          value={proficiency[`proficiency_${record.language.toLowerCase()}`]}
          onChange={(e) =>
            handleProficiencyChange(record.language, e.target.value)
          }
        >
          <Radio value={option.value} />
        </Radio.Group>
      ),
    })),
  ];

  const dataLanguage = languages.map((language) => ({
    key: language,
    language,
  }));

  const handleFormChange = (_, allValues) => {
    const hasChanges =
      JSON.stringify(allValues) !== JSON.stringify(savedValues);
    setIsFormChanged(hasChanges);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (savedValues) {
      form.setFieldsValue(savedValues);
      const savedProficiency = {
        proficiency_c: savedValues.proficiency_c,
        proficiency_cpp: savedValues.proficiency_cpp,
        proficiency_java: savedValues.proficiency_java,
        proficiency_python: savedValues.proficiency_python,
      };
      setProficiency(savedProficiency);
      form.setFieldsValue(savedProficiency);
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: "Confirm Reset",
      content: "Are you sure you want to clear all your MatchingInfo data?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setSavedValues({});
        form.resetFields();
        form.setFieldsValue({});
        localStorage.setItem("isReset", "true");
      },
    });
  };

  // Form submission logic
  const onFinish = async (values) => {
    const finalValues = {
      ...values,
      ...proficiency,
      ...selectedCourses,
    };

    try {
      await apiService.post("/profiles/matchingInfo", finalValues);
      message.success("Your matching info has been saved successfully.");
      setSavedValues(finalValues);
      setIsFormChanged(false);
      setIsMatchInfoComplete(true);
      setIsEditMode(false);
      localStorage.removeItem("isReset");
    } catch (error) {
      console.log(error);
    }
  };

  const participateMatch = async () => {
    try {
      const response = await apiService.post("/profiles/ready");
      const { msg } = response;
      if (msg === "Success") {
        // setReadymatch(false);
        message.success("Successful participation in the competition");
      } else {
        message.error("Participate failed, please try again", 3);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="team-background">
      <Card
        title={<span className="outer-card-title">Matching Info</span>}
        className="card-container"
      >
        <Steps current={currentStep}>
          <Steps.Step title="Personal Profile" description="Finished!" />
          <Steps.Step
            title="Matching Info"
            description={isMatchInfoComplete ? "Finished!" : "In Progress!"}
          />
          <Steps.Step title="Assigned Team" description="Waiting..." />
        </Steps>

        <Divider />

        {!isMatchInfoComplete || isEditMode || !isProfileComplete ? (
          <Form
            onFinish={onFinish}
            onValuesChange={handleFormChange} // Listen for form changes
            form={form}
            scrollToFirstError
            className="centered-form"
            style={{ paddingBlock: 32 }}
          >
            {/* Competition level */}
            <div>Which level would you like to compete in?</div>
            <Form.Item
              name="level"
              rules={[{ required: true, message: "Please select a level" }]}
            >
              <Select
                placeholder="Please select"
                onChange={(value) => form.setFieldsValue({ level: value })}
              >
                <Option value={0}>Level A</Option>
                <Option value={1}>Level B</Option>
              </Select>
            </Form.Item>

            <p
              style={{ fontSize: "12px", color: "gray", marginBottom: "30px" }}
            >
              The level A problem set will be very challenging and is designed
              to differentiate between the best teams in the region, whereas the
              level B problem set is aimed towards less experienced teams.
            </p>

            {/* Programming language proficiency */}
            <div>
              Choose your proficiency level for each programming language:
            </div>
            <p style={{ fontSize: "12px", color: "gray" }}>
              We will try to form teams where everyone can understand code from
              each other, so you can work together on coding and debugging.
            </p>
            <Table
              columns={columns}
              dataSource={dataLanguage}
              pagination={false}
              bordered
              rowKey="language"
            />

            {/* Completed courses */}
            <div style={{ marginTop: "20px" }}>
              Please select which of the following courses you have completed:
            </div>
            <p style={{ fontSize: "12px", color: "gray" }}>
              You don’t need to have completed them, but we will try to group
              students who are at a similar stage in their studies.
            </p>
            <Form.Item
              name="learned_courses"
              rules={[{ required: true, message: "Please select courses" }]}
            >
              <Select
                mode="multiple"
                allowClears
                onChange={handleCourseChange}
                tagRender={tagRender}
              >
                <Option value="programming_fundamentals">
                  Programming Fundamentals
                </Option>
                <Option value="principles_of_programming">
                  Principles of Programming
                </Option>
                <Option value="data_structures_and_algorithms">
                  Data Structures and Algorithms
                </Option>
                <Option value="algorithm_design_and_analysis">
                  Algorithm Design and Analysis
                </Option>
                <Option value="programming_challenges">
                  Programming Challenges
                </Option>
              </Select>
            </Form.Item>

            {/* Competitive programming experience */}
            <div>
              Please outline any experience you have in competitive programming:
            </div>
            <p style={{ fontSize: "12px", color: "gray" }}>
              Beginners are welcome, and Nil is an entirely acceptable response
              to this question.
            </p>
            <Form.Item
              name="competitive_experience"
              rules={[
                { required: true, message: "Please provide your experience." },
              ]}
            >
              <Input.TextArea placeholder="Enter your answer" rows={3} />
            </Form.Item>

            {/* Blacklist selection */}
            <div>
              (Optional) Select students who you do not want to be placed in a
              team with:
            </div>
            <Form.Item name="blacklist">
              <Select
                mode="multiple"
                allowClear
                showSearch
                onSearch={debouncedSearch}
                filterOption={false}
                loading={loading}
              >
                {studentOptions?.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ display: "flex", justifyContent: "center" }}>
              <SubmitButton visible={isFormChanged} form={form}>
                Submit Matching Info
              </SubmitButton>
              <Button style={{ marginLeft: 15 }} onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="dashed"
                style={{ marginLeft: 15 }}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p className="reminder" style={{ fontSize: "14px" }}>
              Your Matching Info has been saved.
            </p>
            <div style={{ display: "flex" }}>
              <Button type="primary" onClick={() => setIsEditMode(true)}>
                Edit Profile
              </Button>

              <Button
                type="primary"
                onClick={() => participateMatch()}
                style={{
                  display: "block",
                  marginLeft: "20px",
                }}
              >
                Participate in Matching
              </Button>
            </div>
            <div style={{ marginTop: "20px" }}>
              <p className="reminder" style={{ fontSize: "14px" }}>
                If you do not have teammates, just click the “Participate in
                Matching” button, and we will use our algorithm to help you find
                teammates.
              </p>
              <p className="reminder" style={{ fontSize: "14px" }}>
                If you already have teammates, click on the “Team Selection” tab
                to invite them to join your team.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeamInfoPage;
