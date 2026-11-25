import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ClipboardList,
  Clock3,
  ListTodo,
  CircleCheck,
  RefreshCw,
  Plus,
  Search,
  ArrowRight,
} from "lucide-react";

import {
  getAllTasks,
  type DailyTaskItem,
} from "../../services/dailyTaskApi";

import "./DailyTask.css";

// ========================================
// ERROR MESSAGE
// ========================================

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Unable to load tasks.";
};

// ========================================
// STATUS CLASS
// ========================================

const getStatusClass = (status?: string) => {
  const value = status?.toLowerCase().trim();

  if (value === "completed") {
    return "completed";
  }

  if (
    value === "in progress" ||
    value === "in-progress" ||
    value === "in_progress"
  ) {
    return "progress";
  }

  return "pending";
};

// ========================================
// PRIORITY CLASS
// ========================================

const getPriorityClass = (priority?: string) => {
  const value = priority?.toLowerCase().trim();

  if (value === "high") return "highest";
  if (value === "low") return "lowest";

  return "medium";
};

// ========================================
// PRIORITY SORTING ORDER
// ========================================

const getPriorityOrder = (priority?: string) => {
  const value = priority?.toLowerCase().trim();

  if (value === "high") return 1;
  if (value === "medium") return 2;
  if (value === "low") return 3;

  return 2;
};

// ========================================
// CREATED DATE
// ========================================

const getCreatedDate = (task: DailyTaskItem) => {
  const item = task as DailyTaskItem & {
    createdAt?: string;
    createdOn?: string;
    created_at?: string;
  };

  return (
    item.createdAt ||
    item.createdOn ||
    item.created_at ||
    ""
  );
};

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

// ========================================
// DAILY TASK COMPONENT
// ========================================

export default function DailyTask() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<DailyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ========================================
  // FETCH TASKS
  // ========================================

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

  // ========================================
  // SEARCH, FILTER AND PRIORITY SORTING
  // ========================================

  const filteredTasks = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return tasks
      .filter((task) => {
        const title = String(
          task.title || ""
        ).toLowerCase();

        const status = getStatusClass(task.status);

        const matchesSearch = title.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aCompleted =
          getStatusClass(a.status) === "completed";

        const bCompleted =
          getStatusClass(b.status) === "completed";

        // Completed tasks always appear at the bottom

        if (aCompleted !== bCompleted) {
          return aCompleted ? 1 : -1;
        }

        // High → Medium → Low priority

        const priorityDifference =
          getPriorityOrder(a.priority) -
          getPriorityOrder(b.priority);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        // Latest task first within the same priority

        const aDate =
          Date.parse(getCreatedDate(a)) || 0;

        const bDate =
          Date.parse(getCreatedDate(b)) || 0;

        return bDate - aDate;
      });
  }, [tasks, searchTerm, statusFilter]);

  // ========================================
  // TASK STATISTICS
  // ========================================

  const total = tasks.length;

  const completed = tasks.filter(
    (task) =>
      getStatusClass(task.status) === "completed"
  ).length;

  const inProgress = tasks.filter(
    (task) =>
      getStatusClass(task.status) === "progress"
  ).length;

  const pending = tasks.filter(
    (task) =>
      getStatusClass(task.status) === "pending"
  ).length;

  const completionRate =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  const summaryCards = [
    {
      label: "Total Tasks",
      value: total,
      tone: "green",
      icon: ClipboardList,
    },
    {
      label: "Pending",
      value: pending,
      tone: "amber",
      icon: Clock3,
    },
    {
      label: "In Progress",
      value: inProgress,
      tone: "blue",
      icon: ListTodo,
    },
    {
      label: "Completed",
      value: completed,
      tone: "purple",
      icon: CircleCheck,
    },
  ] as const;

  return (
    <div className="daily-task-page">

      {/* ERROR MESSAGE */}

      {error && (
        <div className="task-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void fetchTasks()}
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
            />
            Retry
          </button>
        </div>
      )}

      {/* TASK SUMMARY CARDS */}

      <section
        className="daily-task-summary"
        aria-label="Task statistics"
      >
        {summaryCards.map(
          ({ label, value, tone, icon: Icon }) => (
            <article
              className={`daily-task-summary-card daily-task-summary-card--${tone}`}
              key={label}
            >
              <div className="daily-task-summary-info">
                <span className="daily-task-summary-label">
                  {label}
                </span>

                <strong>
                  {loading || error ? "—" : value}
                </strong>
              </div>

              <span
                className="daily-task-summary-dot"
                aria-hidden="true"
              >
                <Icon size={22} strokeWidth={1.9} />
              </span>
            </article>
          )
        )}
      </section>

      {/* OVERALL TASK PROGRESS */}

      <section
        className="task-progress-card"
        aria-label="Task completion progress"
      >
        <div className="task-progress-copy">
          <span
            className="task-progress-icon"
            aria-hidden="true"
          >
            <CircleCheck size={20} />
          </span>

          <div>
            <h2>Overall Task Progress</h2>

            <p>
              {loading || error
                ? "Progress is unavailable"
                : `${completed} of ${total} tasks completed`}
            </p>
          </div>
        </div>

        <div className="task-progress-meter">
          <div className="task-progress-meta">
            <span>Completion rate</span>

            <strong>
              {loading || error
                ? "—"
                : `${completionRate}%`}
            </strong>
          </div>

          <div
            className="task-progress-track"
            role="progressbar"
            aria-label="Tasks completed"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              loading || error
                ? undefined
                : completionRate
            }
          >
            <div
              style={{
                width: `${
                  loading || error
                    ? 0
                    : completionRate
                }%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* TASK OVERVIEW */}

      <section className="task-table-card">

        {/* TASK OVERVIEW HEADER */}

        <div className="task-table-header">

          <div>
            <h2>Task Overview</h2>

            <p>
              View task priorities, progress, and details.
            </p>
          </div>

          <div className="task-table-filters">

            {/* ADD TASK BUTTON */}

            <button
              type="button"
              className="add-task-button"
              onClick={() =>
                navigate("/daily-task/add")
              }
            >
              <Plus size={20} />
              Add Task
            </button>

            {/* SEARCH TASKS */}

            <div className="task-search-field">
              <Search
                size={18}
                aria-hidden="true"
              />

              <input
                type="search"
                placeholder="Search tasks..."
                aria-label="Search tasks"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>

            {/* STATUS FILTER */}

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="all">
                All Statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="progress">
                In Progress
              </option>

              <option value="completed">
                Completed
              </option>
            </select>

          </div>
        </div>

        {/* TASK TABLE */}

        <div className="task-table-wrapper">
          <table className="task-table">

            <thead>
              <tr>
                <th scope="col">Task Title</th>
                <th scope="col">Priority</th>
                <th scope="col">Created On</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
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

                    {/* TASK TITLE */}

                    <td data-label="Task Title">
                      <span className="task-title-cell">
                        {task.title}
                      </span>
                    </td>

                    {/* PRIORITY */}

                    <td data-label="Priority">
                      <span
                        className={`task-priority ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </td>

                    {/* CREATED ON */}

                    <td data-label="Created On">
                      {formatDate(getCreatedDate(task))}
                    </td>

                    {/* STATUS */}

                    <td data-label="Status">
                      <span
                        className={`task-status ${getStatusClass(
                          task.status
                        )}`}
                      >
                        {task.status || "Pending"}
                      </span>
                    </td>

                    {/* VIEW DETAILS BUTTON */}

                    <td data-label="Action">
                      <button
                        type="button"
                        className="view-task-button"
                        onClick={() =>
                          navigate(
                            `/daily-task/${task._id}`
                          )
                        }
                      >
                        View Details
                        <ArrowRight size={16} />
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