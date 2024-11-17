"use client";

import React, { useState, useEffect } from "react";
import { Typography, Table, message, Tag, Divider, Button } from "antd";
import { DotChartOutlined, DownloadOutlined } from "@ant-design/icons";
import apiService from "../../../services/apiService";
import { saveAs } from "file-saver";
import { parse } from "json2csv";
import * as XLSX from "xlsx";
const { Title } = Typography;

const LogicticsManagement = () => {
  const [userInfolist, setUserInfolist] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetch_account_list(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetch_account_list = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      // console.log("This is page", page, pageSize);
      const response = await apiService.get("/logistics", {
        page_no: page,
        page_size: pageSize,
      });
      const { msg, data } = response;
      if (msg === "Success" && data) {
        console.log("This is data", data);
        setUserInfolist(data.data || []);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: data.total || 0,
        }));
      } else {
        message.error("Failed to fetch accounts.", 3);
      }
    } catch (error) {
      console.error("This is error", error);
    }
  };

  const fetch_all_data = async () => {
    const pageSize = 20;
    let page = 1;
    let allData = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await apiService.get("/logistics", {
          page_no: page,
          page_size: pageSize,
        });
        const { msg, data } = response;
        if (msg === "Success" && data && data.data.length > 0) {
          allData = [...allData, ...data.data];
          hasMore = data.data.length === pageSize;
          page += 1;
        } else {
          hasMore = false;
          message.error("Failed to fetch all accounts for download.", 3);
        }
      }
    } catch (error) {
      console.error("This is error", error);
    }
    return allData;
  };

  //Data mapping function
  const mapData = (data) => {
    return data.map((item) => ({
      ID: item.id,
      "Account Name": item.account_name,
      "Full Name": item.full_name,
      Gender:
        item.gender === 0
          ? "Male"
          : item.gender === 1
          ? "Female"
          : item.gender === 2
          ? "Non-Binary Gender"
          : "Unknown",
      "Preferred Pronouns":
        item.preferred_pronouns === 1
          ? "He/Him"
          : item.preferred_pronouns === 2
          ? "She/Her"
          : item.preferred_pronouns === 3
          ? "They/Them"
          : "Other",
      University: item.university_name,
      "Official Email": item.official_email || "None",
      "Account Email": item.account_email,
      "Dietary Requirement": item.dietary_requirements,
      "Shirt Size":
        item.shirt_size === 1
          ? "XS"
          : item.shirt_size === 2
          ? "S"
          : item.shirt_size === 3
          ? "M"
          : item.shirt_size === 4
          ? "L"
          : item.shirt_size === 5
          ? "XL"
          : item.shirt_size === 6
          ? "XXL"
          : "Unknown",
      "Consent Photos": item.consent_photos ? "YES" : "NO",
      "Matched Or Not": item.matched ? "YES" : "NO",
    }));
  };

  // Map the table data and export it to a csv file
  const handle_download = async () => {
    const allData = await fetch_all_data();
    const mappedData = mapData(allData);
    try {
      const csvData = parse(mappedData);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "icpc_user_data.csv");
      message.success("CSV file downloaded successfully!", 2);
    } catch (error) {
      console.error("This is error from download", error);
      message.error("Failed to download CSV file.", 3);
    }
  };

  // Map the table data and export it to excel file
  const handle_download_excel = async () => {
    const allData = await fetch_all_data();
    const mappedData = mapData(allData);
    try {
      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Logistics Data");
      XLSX.writeFile(workbook, "icpc_user_data.xlsx");
      message.success("Excel file downloaded successfully!", 2);
    } catch (error) {
      console.error("This is error from waiting fetch exe", error);
      message.error("Failed to download Excel file.", 3);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: "ascend",
    },
    {
      title: "Account Name",
      dataIndex: "account_name",
      key: "account_name",
      sorter: (a, b) => a.account_name.localeCompare(b.account_name),
      render: (account_name) => <a>{account_name}</a>,
    },
    {
      title: "Full Name",
      dataIndex: "full_name",
      key: "full_name",
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
      render: (full_name) => <a>{full_name}</a>,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => {
        const genderMap = {
          0: "Male",
          1: "Female",
          2: "Non-Binary Gender",
        };
        return genderMap[gender] || "Unknown";
      },
    },
    {
      title: "Preferred Pronouns",
      dataIndex: "preferred_pronouns",
      key: "preferred_pronouns",
      render: (preferred_pronouns) => {
        const genderMap = {
          1: "He/Him",
          2: "She/Her",
          3: "They/Them",
          4: "Other",
        };
        return genderMap[preferred_pronouns] || "Unknown";
      },
    },
    {
      title: "University",
      dataIndex: "university_name",
      key: "university_name",
    },
    {
      title: "Official Email",
      dataIndex: "official_email",
      key: "official_email",
      render: (email) =>
        email ? (
          <a
            href={`mailto:${email}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "blue", textDecoration: "underline" }}
          >
            {email}
          </a>
        ) : (
          <span style={{ color: "gray" }}>None</span>
        ),
    },
    {
      title: "Account Email",
      dataIndex: "account_email",
      key: "account_email",
      render: (email) => (
        <a
          href={`mailto:${email}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          {email}
        </a>
      ),
    },
    {
      title: "Dietary Requirement",
      dataIndex: "dietary_requirements",
      key: "dietary_requirements",
    },
    {
      title: "Shirt Size",
      dataIndex: "shirt_size",
      key: "shirt_size",
      render: (size) => {
        const shirtSizeMap = {
          0: "Male S",
          1: "Male M",
          2: "Male L",
          3: "Male XL",
          4: "Male 2XL",
          5: "Male 3XL",
          6: "Male 4XL",
          7: "Male 5XL",
          8: "Female S",
          9: "Female M",
          10: "Female L",
          11: "Female XL",
          12: "Female 2XL",
          13: "Female 3XL",
        };
        return shirtSizeMap[size] || "Unknown";
      },
    },

    {
      title: "Consent Photos",
      dataIndex: "consent_photos",
      key: "consent_photos",
      render: (consent) => {
        let color = consent ? "geekblue" : "volcano";
        return (
          <Tag color={color} key={consent}>
            {consent ? "YES" : "NO"}
          </Tag>
        );
      },
    },
    {
      title: "Matched Or Not",
      dataIndex: "matched",
      key: "matched",
      render: (matched) => {
        let color = matched ? "green" : "volcano";
        return (
          <Tag color={color} key={matched}>
            {matched ? "YES" : "NO"}
          </Tag>
        );
      },
    },
  ];

  return (
    <>
      <Title className="dashboard-title">
        <DotChartOutlined style={{ marginRight: "8px" }} /> Logictics Management
      </Title>
      <Divider />
      <Button
        onClick={handle_download}
        type="default"
        shape="round"
        icon={<DownloadOutlined />}
        style={{
          marginBottom: 16,
          marginRight: 16,
        }}
      >
        Download CSV file
      </Button>
      <Button
        onClick={handle_download_excel}
        type="default"
        shape="round"
        icon={<DownloadOutlined />}
        style={{
          marginBottom: 16,
        }}
      >
        Download Excel file
      </Button>
      <Table
        dataSource={Array.isArray(userInfolist) ? userInfolist : []}
        columns={columns}
        rowKey="id"
        scroll={{
          x: "max-content",
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => {
            setPagination((prev) => ({ ...prev, current: page, pageSize }));
            fetch_account_list(page, pageSize);
          },
        }}
      />
    </>
  );
};

export default LogicticsManagement;
