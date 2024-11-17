"use client";
import React, { useState, useEffect } from "react";
import { Statistic, Typography, Card, Col, Row, message } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  LoginOutlined,
} from "@ant-design/icons";

import apiService from "../../../services/apiService";
import "./dashboard.css";
import moment from "moment";

const { Title } = Typography;

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    get_site_overview();
  }, []);

  const get_site_overview = async () => {
    try {
      const response = await apiService.get("/logistics/site");
      if (response.msg === "Success") {
        console.log("This is site_overview", response.data);
        setData(response.data);
      } else {
        message.error("Failed to fetch Site_overview.", 3);
      }
    } catch (error) {
      console.error("This is error", error);
    }
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  const formattedDate = moment(data.startup_time * 1000).format("YYYY-MM-DD");

  return (
    <>
      <Title className="dashboard-title">
        <DashboardOutlined style={{ marginBottom: "1.0em" }} />
        Dashboard
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            className="card-style-1"
            style={{ background: "linear-gradient(135deg, #e0f7fa, #e1f5fe)" }}
            hoverable
          >
            <Statistic
              title="Total user count"
              value={data.user_count}
              prefix={
                <UserOutlined style={{ color: "#1890ff", fontSize: "24px" }} />
              }
              valueStyle={{ fontWeight: "bold", color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            className="card-style-1"
            hoverable
            style={{
              background: "linear-gradient(135deg, #ffccc7, #ffa39e)",
            }}
          >
            <Statistic
              title="University Count"
              value={data.universal_count}
              prefix={
                <GlobalOutlined
                  style={{ fontSize: "24px", color: "#cf1322" }}
                />
              }
              valueStyle={{ fontWeight: "bold", color: "#cf1322" }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            hoverable
            className="card-style-1"
            style={{
              background: "linear-gradient(135deg, #d8bfd8, #dda0dd)",
            }}
          >
            <Statistic
              title="The number of logged-in users today"
              value={data.login_user_count}
              prefix={
                <UserOutlined style={{ fontSize: "24px", color: "#595959" }} />
              }
              valueStyle={{ fontWeight: "bold", color: "#595959" }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            style={{
              background: "linear-gradient(135deg, #fff9c4, #ffecb3)",
            }}
            className="card-style-1"
            hoverable
          >
            <Statistic
              title="Total login count today"
              value={data.login_count}
              prefix={<LoginOutlined style={{ fontSize: "24px" }} />}
              valueStyle={{ fontWeight: "bold", color: "#ff9800" }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            className="card-style-1"
            hoverable
            style={{
              background: "linear-gradient(135deg, #fff1b8, #ffe58f)",
            }}
          >
            <Statistic
              title="Startup Time"
              value={formattedDate}
              prefix={
                <ClockCircleOutlined
                  style={{ fontSize: "24px", color: "#d48806" }}
                />
              }
              valueStyle={{ fontWeight: "bold", color: "#d48806" }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            hoverable
            className="card-style-1"
            style={{
              background: "linear-gradient(135deg, #d9f7be, #b7eb8f)",
            }}
          >
            <Statistic
              title="System running time"
              value={data.runtime}
              prefix={
                <ClockCircleOutlined
                  style={{ fontSize: "24px", color: "#389e0d" }}
                />
              }
              valueStyle={{ fontWeight: "bold", color: "#389e0d" }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
