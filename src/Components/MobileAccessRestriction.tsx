
import { ShieldAlert } from "lucide-react";

export default function MobileAccessRestriction() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F4F8FA",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "36px 24px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <ShieldAlert
          size={52}
          color="#D32F2F"
        />

        <h2 style={{ color: "#D32F2F" }}>
          Access Restricted
        </h2>

        <p
          style={{
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          Desktop mode is not allowed on mobile devices.
        </p>

        <p
          style={{
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
