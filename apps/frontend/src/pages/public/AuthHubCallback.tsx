import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Shield, AlertCircle, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "../../api/client";
import { useI18n } from "../../context/I18nContext";

export default function AuthHubCallback() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = sessionStorage.getItem("authhub_sso_state");

    if (!code) {
      setError(t("auth.sso_missing_code", "Authorization code was not returned by AuthHub."));
      setStatus("error");
      return;
    }

    if (savedState && state && state !== savedState) {
      setError(t("auth.sso_state_mismatch", "SSO State mismatch detected. Please login again."));
      setStatus("error");
      return;
    }

    // Clean up stored state
    sessionStorage.removeItem("authhub_sso_state");

    async function exchangeToken() {
      try {
        const res = await authApi.authHubCallback(code!);
        if (res.success && res.data) {
          localStorage.setItem("token", res.data.access_token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setStatus("success");
          setTimeout(() => {
            navigate("/dashboard");
          }, 800);
        } else {
          setError(res.message || t("auth.sso_exchange_failed", "Failed to authenticate with AuthHub."));
          setStatus("error");
        }
      } catch (err: any) {
        setError(err?.message || t("auth.sso_error", "An error occurred during AuthHub sign-in."));
        setStatus("error");
      }
    }

    void exchangeToken();
  }, [searchParams, navigate, t]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center px-4">
      <div className="card w-full max-w-md p-8 text-center space-y-6 border border-gray-800">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          {status === "processing" && (
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          )}
          {status === "error" && (
            <AlertCircle className="w-8 h-8 text-red-400" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            {status === "processing" && t("auth.sso_verifying", "Verifying AuthHub Identity...")}
            {status === "success" && t("auth.sso_success", "Identity Verified! Redirecting...")}
            {status === "error" && t("auth.sso_failed_title", "AuthHub Sign-in Failed")}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {status === "processing" &&
              t("auth.sso_processing_desc", "Connecting with centralized SSO service and issuing access session.")}
            {status === "success" &&
              t("auth.sso_redirect_desc", "Welcome back! Taking you to the WABridge dashboard.")}
            {status === "error" && (error || t("auth.sso_failed_desc", "Could not complete SSO sign-in."))}
          </p>
        </div>

        {status === "error" && (
          <div className="pt-2">
            <Link
              to="/login"
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> {t("auth.back_to_login", "Back to Login")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
