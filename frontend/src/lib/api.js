import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, "");
const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const get = (endpoint) => axios.get(`${API}/${endpoint}`);

export const fetchPublicConfig = () => {
  return get("public/config").then((response) => {
    if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) {
      throw new Error("The public config API returned an invalid response.");
    }
    return response.data;
  });
};

export const fetchLocations = () => {
  return get("public/locations").then((response) => {
    if (!Array.isArray(response.data?.cities)) {
      throw new Error("The public locations API returned an invalid response.");
    }
    return response.data.cities;
  });
};

export const fetchHealth = () => get("health").then((response) => response.data);
export const fetchArchitecture = () => get("system/architecture").then((response) => response.data);
