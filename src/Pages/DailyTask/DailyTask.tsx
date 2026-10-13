
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getAllTasks,
  type DailyTaskItem,
} from "../../services/dailyTaskApi";

import "./DailyTask.css";

/* =========================================
   DATE FORMAT
========================================= */

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  const date = datePart
    ? new Date(`${datePart}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================
   ERROR HANDLING
========================================= */

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return "Unable to load tasks.";
};

/* =========================================
   STATUS AND PRIORITY
========================================= */

const getStatusClass = (status?: string) => {
  const value = status?.toLowerCase();

  if (value === "completed") return "completed";

  if (
    value === "in progress" ||
    value === "in-progress"
  ) {
    return "progress";
  }

  return "pending";
};

const getPriorityClass = (priority?: string) => {
  const value = priority?.toLowerCase();

  if (value === "high") return "highest";
  if (value === "low") return "lowest";

  return "medium";
};

/* =========================================
   DAILY TASK COMPONENT
========================================= */

function DailyTask() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<DailyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /* LOAD TASKS */

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAllTasks();
      const result = response.data?.data;

      if (!Array.isArray(result)) {
        throw new Error("Invalid task response.");
      }

      setTasks(result);
    } catch (err) {
      setTasks([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  /* SEARCH AND FILTER */

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase().trim());

      const matchesStatus =
        statusFilter === "All" ||
        getStatusClass(task.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  /* TASK COUNTS */

  const total = tasks.length;

  const completed = tasks.filter(
    (task) => getStatusClass(task.status) === "completed"
  ).length;

  const inProgress = tasks.filter(
    (task) => getStatusClass(task.status) === "progress"
  ).length;

  const pending = tasks.filter(
    (task) => getStatusClass(task.status) === "pending"
  ).length;

  return (
    <div className="daily-task-page">
      {/* PAGE HEADER */}

      <header className="daily-task-header">
        <div className="daily-task-heading">
          <div className="daily-task-heading-icon">
            <svg
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="3"
                width="16"
                height="18"
                rx="2"
              />

              <path d="m8 9 2 2 4-4M8 16h8" />
            </svg>
          </div>

          <div>
            <h1>Daily Tasks</h1>
            <p>Create, manage, and track employee tasks.</p>
          </div>
        </div>

        <button
          type="button"
          className="add-task-button"
          onClick={() => navigate("/daily-task/add")}
        >
          <span className="add-task-plus">+</span>
          Add Task
        </button>
      </header>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="task-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void fetchTasks()}
          >
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <section className="daily-task-summary">
        {[
          {
            label: "Total Tasks",
            value: total,
            tone: "green",
          },
          {
            label: "Pending",
            value: pending,
            tone: "amber",
          },
          {
            label: "In Progress",
            value: inProgress,
            tone: "blue",
          },
          {
            label: "Completed",
            value: completed,
            tone: "purple",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`daily-task-summary-card daily-task-summary-card--${item.tone}`}
          >
            <div>
              <span>{item.label}</span>

              <strong>
                {loading || error ? "—" : item.value}
              </strong>
            </div>

            <span className="daily-task-summary-dot" />
          </div>
        ))}
      </section>

      {/* TASK OVERVIEW */}

      <section className="task-table-card">
        <div className="task-table-header">
          <div>
            <h2>Task Overview</h2>
            <p>View task priorities, progress, and details.</p>
          </div>

          <div className="task-table-filters">
            <input
              type="search"
              aria-label="Search tasks"
              placeholder="Search tasks..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              aria-label="Filter tasks by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="task-table-wrapper">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Created On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ||
              error ||
              filteredTasks.length === 0 ? (
                <tr className="task-message-row">
                  <td
                    colSpan={5}
                    className="task-table-message"
                  >
                    {loading
                      ? "Loading tasks..."
                      : error
                        ? "Task information is unavailable."
                        : "No tasks found."}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td data-label="Task Title">
                      <div className="task-title-cell">
                        {task.title}
                      </div>
                    </td>

                    <td data-label="Priority">
                      <span
                        className={`task-priority ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </td>

                    <td data-label="Created On">
                      {formatDate(task.createdAt)}
                    </td>

                    <td data-label="Status">
                      <span
                        className={`task-status ${getStatusClass(
                          task.status
                        )}`}
                      >
                        {task.status || "Pending"}
                      </span>
                    </td>

                    <td data-label="Action">
                      <button
                        type="button"
                        className="view-task-button"
                        onClick={() =>
                          navigate(`/daily-task/${task._id}`)
                        }
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DailyTask;
