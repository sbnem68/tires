import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const fetchPublicConfig = () => axios.get(`${API}/public/config`).then((r) => r.data);
export const fetchLocations = () => axios.get(`${API}/public/locations`).then((r) => r.data.cities);
export const fetchHealth = () => axios.get(`${API}/health`).then((r) => r.data);
export const fetchArchitecture = () => axios.get(`${API}/system/architecture`).then((r) => r.data);
