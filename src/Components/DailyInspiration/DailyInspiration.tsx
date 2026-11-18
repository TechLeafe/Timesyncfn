
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./DailyInspiration.css";

interface InspirationData {
  date: string;
  category: "Motivation" | "Technology" | "Science";
  content: string;
  author?: string;
  source?: string;
}

interface ApiResponse {
  success: boolean;
  data: InspirationData;
}

const categoryDetails = {
  Motivation: {
    icon: "✨",
    label: "A LITTLE MOTIVATION",
  },
  Technology: {
    icon: "💻",
    label: "TECH INSIGHT",
  },
  Science: {
    icon: "🔬",
    label: "SCIENCE SPOTLIGHT",
  },
};

const DailyInspiration = () => {
  const [inspiration, setInspiration] =
    useState<InspirationData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchInspiration = async () => {
      try {
        setLoading(true);
        setError(false);

        // Assumes axiosInstance baseURL already ends in /api/
        const response = await axiosInstance.get<ApiResponse>(
          "daily-inspiration"
        );

        if (response.data.success && response.data.data) {
          setInspiration(response.data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to load daily inspiration:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInspiration();
  }, []);

  if (loading) {
    return (
      <div className="daily-inspiration-card daily-inspiration-loading">
        <span className="inspiration-loading-icon">✨</span>
        <p>Loading today's inspiration...</p>
      </div>
    );
  }

  if (error || !inspiration) {
    return null;
  }

  const details = categoryDetails[inspiration.category];

  const formattedDate = new Date(`${inspiration.date}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <section className="daily-inspiration-card">
      <div className="inspiration-decoration inspiration-decoration-one" />
      <div className="inspiration-decoration inspiration-decoration-two" />

      <div className="daily-inspiration-content">
        <div className="inspiration-top">
          <div className="inspiration-category">
            <span className="inspiration-icon">{details.icon}</span>

            <span>{details.label}</span>
          </div>

          {/* <span className="inspiration-date">{formattedDate}</span> */}
        </div>

        <div className="inspiration-message">

          <p>{inspiration.content}</p>
        </div>

        {inspiration.source === "ZenQuotes" && (
          <div className="inspiration-attribution">
            <a
              href="https://zenquotes.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default DailyInspiration;
