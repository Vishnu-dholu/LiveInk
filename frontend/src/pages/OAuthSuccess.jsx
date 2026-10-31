import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeOAuthCode, getMe } from "@/api/auth";

const OAuthSuccess = () => {
  const [params] = useSearchParams();
  const code = params.get("code");
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    exchangeOAuthCode(code)
      .then(async (token) => {
        const user = await getMe(token);
        if (cancelled) return;

        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            userId: user.id,
            username: user.username,
            email: user.email,
          }),
        );
        navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error("OAuth login failed", err);
        if (!cancelled) navigate("/login", { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  return <div>Logging you in...</div>;
};

export default OAuthSuccess;
