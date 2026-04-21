import axios from "./axios";

export const getDashboardStats = () => axios.get("/dashboard/stats");
