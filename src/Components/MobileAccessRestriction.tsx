
import { MonitorX, ShieldAlert } from "lucide-react";

export default function MobileAccessRestriction() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F3F7F9",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#FFFFFF",
          padding: "32px 24px",
          borderRadius: "16px",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <ShieldAlert
          size={48}
          color="#D32F2F"
          style={{ marginBottom: "16px" }}
        />

        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#D32F2F",
            marginBottom: "12px",
          }}
        >
          Access Restricted
        </h2>

        <MonitorX
          size={32}
          color="#025B82"
          style={{ marginBottom: "12px" }}
        />

        <p
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#333333",
          }}
        >
          Desktop mode is not allowed on mobile devices.
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "#666666",
            lineHeight: 1.6,
          }}
        >
          Please access this website using a desktop or laptop.
        </p>
      </div>
    </div>
  );
}
