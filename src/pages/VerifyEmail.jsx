import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      setError("Invalid verification link.");
      setStatus("error");
      return;
    }

    fetch(`${API}/api/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Verification failed");
        }

        //  No auto-login
        setStatus("success");

        //  Redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, [navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full text-center">

        {status === "verifying" && (
          <p className="text-lg font-medium">
             Verifying your email...
          </p>
        )}

        {status === "success" && (
          <>
            <p className="text-green-600 font-semibold mb-4">
               Email verified successfully!
            </p>

            <p className="text-slate-500 text-sm">
              Redirecting to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-red-600 font-medium mb-4">
               {error}
            </p>

            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline text-sm"
            >
              Go to Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}
