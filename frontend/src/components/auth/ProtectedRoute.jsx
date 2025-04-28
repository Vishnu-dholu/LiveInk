import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? children : <Navigate />;
};

export default ProtectedRoute;
