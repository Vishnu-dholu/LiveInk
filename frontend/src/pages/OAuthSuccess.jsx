import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OAuthSuccess = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);

      // Fetch user data
      fetch("http://localhost:5001/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((user) => {
          localStorage.setItem(
            "user",
            JSON.stringify({
              userId: user.id,
              username: user.username,
              email: user.email,
            }),
          );
          navigate("/canvas");
        })
        .catch((err) => {
          console.error("Failed to fetch user after OAuth", err);
          navigate("/login");
        });
    }
  }, [token, navigate]);
  return <div>Logging you in...</div>;
};

export default OAuthSuccess;
