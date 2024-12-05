import { message } from "antd";


const API_BASE_URL = "/api"; // Set to proxy path

const apiService = {
  // General request method, works regardless of whether a token is needed
  async request(endpoint, method, data = null) {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return response.json();
  },


  // GET request with support for query parameters
  async get(endpoint, params = {}) {
    // Convert query parameters to URL query string
    const queryString = new URLSearchParams(params).toString();
    const urlWithParams = queryString
      ? `${API_BASE_URL}${endpoint}?${queryString}` // Ensure URL includes query parameters
      : `${API_BASE_URL}${endpoint}`;

    // Construct headers
    const headers = {
      "Content-Type": "application/json",
    };


    // Make GET request
    const response = await fetch(urlWithParams, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        message.info("Unauthorized. Please login.");
        window.location.href = "/public/login";
        throw new Error("Unauthorized");
      }
      throw new Error("Network response was not ok");
    }

    return response.json();
  },

  // POST request
  async post(endpoint, data) {
    return await this.request(endpoint, "POST", data);
  },

  // PUT request
  async put(endpoint, data) {
    return await this.request(endpoint, "PUT", data);
  },

  // DELETE request
  async delete(endpoint) {
    return await this.request(endpoint, "DELETE", null);
  },
};

export default apiService;
