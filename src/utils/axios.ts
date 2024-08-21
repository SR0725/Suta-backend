import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_ENDPOINT;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_ENDPOINT is not defined");
}

const axiosInstance = axios.create({
  baseURL,
});

export default axiosInstance;
