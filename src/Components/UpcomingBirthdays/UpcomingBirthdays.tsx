import { useEffect, useState } from "react";

import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  getUpcomingBirthdays,
  type UpcomingBirthday,
} from "../../services/upcomingBirthdayService";

import "./UpcomingBirthdays.css";

const UpcomingBirthdays = () => {
  const [birthdays, setBirthdays] = useState<
    UpcomingBirthday[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  // ==========================================
  // FETCH BIRTHDAYS
  // ==========================================

  const fetchBirthdays = async () => {
    try {
      setError("");

      const data = await getUpcomingBirthdays();

      setBirthdays(data);
    } catch (err) {
      console.error("Upcoming Birthday Error:", err);

      setError("Unable to load upcoming birthdays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBirthdays();

    // Automatically refresh every 60 seconds
    const interval = window.setInterval(() => {
      void fetchBirthdays();
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  // ==========================================
  // EMPLOYEE INITIALS
  // ==========================================

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const getBirthdayStatus = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";

    return `In ${days} days`;
  };

  const visibleBirthdays = showAll
    ? birthdays
    : birthdays.slice(0, 3);

  return (
    <section className="upcoming-birthday-card">

      {/* HEADER */}

      <div className="upcoming-birthday-header">

        <div className="upcoming-birthday-heading">

          <div className="upcoming-birthday-icon">
            <CakeOutlinedIcon />
          </div>

          <div>
            <h2>Upcoming Birthdays</h2>

            <p>Let's wish them a happy birthday!</p>
          </div>

        </div>

        <button
          type="button"
          className="upcoming-birthday-refresh"
          title="Refresh birthdays"
          aria-label="Refresh birthdays"
          onClick={() => void fetchBirthdays()}
        >
          <RefreshRoundedIcon />
        </button>

      </div>

      {/* CAKE IMAGE */}

      <div className="upcoming-birthday-banner">
        <img
          src={`${import.meta.env.BASE_URL}birthday-cake.png`}
          alt="Birthday cake"
        />

        <div>
          <h3>Celebrate Together!</h3>

          <p>Make every birthday special.</p>
        </div>
      </div>

      {/* LOADING */}

      {loading && (
        <div className="upcoming-birthday-message">
          Loading upcoming birthdays...
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="upcoming-birthday-message">

          <p>{error}</p>

          <button
            type="button"
            className="upcoming-birthday-retry"
            onClick={() => void fetchBirthdays()}
          >
            Try Again
          </button>

        </div>
      )}

      {/* EMPTY STATE */}

      {!loading && !error && birthdays.length === 0 && (
        <div className="upcoming-birthday-message">
          No upcoming birthdays available.
        </div>
      )}

      {/* BIRTHDAY LIST */}

      {!loading && !error && (
        <div className="upcoming-birthday-list">

          {visibleBirthdays.map((employee, index) => (
            <div
              className="upcoming-birthday-row"
              key={employee._id}
            >

              <div
                className={`upcoming-birthday-avatar avatar-${index % 3}`}
              >
                {getInitials(employee.employeeName)}
              </div>

              <div className="upcoming-birthday-person">

                <h4>{employee.employeeName}</h4>

                <p>{employee.employeeId}</p>

              </div>

              <div
                className={`upcoming-birthday-date ${
                  employee.isToday ? "birthday-today" : ""
                }`}
              >

                <strong>
                  {employee.formattedBirthday}
                </strong>

                <span>
                  {getBirthdayStatus(
                    employee.daysRemaining
                  )}
                </span>

              </div>

              <div className="upcoming-birthday-gift">
                <CardGiftcardOutlinedIcon />
              </div>

            </div>
          ))}

        </div>
      )}

      {/* VIEW ALL */}

      {!loading && !error && birthdays.length > 3 && (
        <button
          type="button"
          className="upcoming-birthday-view"
          onClick={() => setShowAll((previous) => !previous)}
        >
          {showAll
            ? "Show Less"
            : `View All Birthdays (${birthdays.length})`}
        </button>
      )}

    </section>
  );
};

export default UpcomingBirthdays;