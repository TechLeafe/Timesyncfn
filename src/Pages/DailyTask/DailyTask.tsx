import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock3,
  ListTodo,
  CircleCheck,
  Plus,
  Search,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { getAllTasks, type DailyTaskItem } from "../../services/dailyTaskApi";
import "./DailyTask.css";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = datePart ? new Date(`${datePart}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Unable to load tasks.";
};

const getStatusClass = (status?: string) => {
  const value = status?.toLowerCase().trim();
  if (value === "completed") return "completed";
  if (value === "in progress" || value === "in-progress") return "progress";
  return "pending";
};

const getPriorityClass = (priority?: string) => {
  const value = priority?.toLowerCase().trim();
  if (value === "high") return "highest";
  if (value === "low") return "lowest";
  return "medium";
};

export default function DailyTask() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllTasks();
      const result = response.data?.data;
      if (!Array.isArray(result)) throw new Error("Invalid task response.");
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

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = (task.title ?? "").toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "All" || getStatusClass(task.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const total = tasks.length;
  const completed = tasks.filter((task) => getStatusClass(task.status) === "completed").length;
  const inProgress = tasks.filter((task) => getStatusClass(task.status) === "progress").length;
  const pending = tasks.filter((task) => getStatusClass(task.status) === "pending").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const summaryCards = [
    { label: "Total Tasks", value: total, tone: "green", icon: ClipboardList },
    { label: "Pending", value: pending, tone: "amber", icon: Clock3 },
    { label: "In Progress", value: inProgress, tone: "blue", icon: ListTodo },
    { label: "Completed", value: completed, tone: "purple", icon: CircleCheck },
  ] as const;

  return (
    <div className="daily-task-page">
      <header className="daily-task-header">
        <div className="daily-task-heading">
          <div className="daily-task-heading-icon" aria-hidden="true">
            <ClipboardList size={23} strokeWidth={1.9} />
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
          <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
          Add Task
        </button>
      </header>

      {error && (
        <div className="task-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchTasks()}>
            <RefreshCw size={15} aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      <section className="daily-task-summary" aria-label="Task statistics">
        {summaryCards.map(({ label, value, tone, icon: Icon }) => (
          <article
            className={`daily-task-summary-card daily-task-summary-card--${tone}`}
            key={label}
          >
            <div className="daily-task-summary-info">
              <span className="daily-task-summary-label">{label}</span>
              <strong>{loading || error ? "—" : value}</strong>
            </div>
            <span className="daily-task-summary-dot" aria-hidden="true">
              <Icon size={22} strokeWidth={1.9} />
            </span>
          </article>
        ))}
      </section>

      <section className="task-progress-card" aria-label="Task completion progress">
        <div className="task-progress-copy">
          <span className="task-progress-icon" aria-hidden="true">
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
            <strong>{loading || error ? "—" : `${completionRate}%`}</strong>
          </div>
          <div
            className="task-progress-track"
            role="progressbar"
            aria-label="Tasks completed"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loading || error ? undefined : completionRate}
          >
            <div style={{ width: `${loading || error ? 0 : completionRate}%` }} />
          </div>
        </div>
      </section>

      <section className="task-table-card">
        <div className="task-table-header">
          <div>
            <h2>Task Overview</h2>
            <p>View task priorities, progress, and details.</p>
          </div>
          <div className="task-table-filters">
            <label className="task-search-field">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search tasks"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select
              aria-label="Filter tasks by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
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
                <th scope="col">Task Title</th>
                <th scope="col">Priority</th>
                <th scope="col">Created On</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading || error || filteredTasks.length === 0 ? (
                <tr className="task-message-row">
                  <td colSpan={5} className="task-table-message">
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
                      <div className="task-title-cell">{task.title}</div>
                    </td>
                    <td data-label="Priority">
                      <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                        {task.priority || "Medium"}
                      </span>
                    </td>
                    <td data-label="Created On">{formatDate(task.createdAt)}</td>
                    <td data-label="Status">
                      <span className={`task-status ${getStatusClass(task.status)}`}>
                        {task.status || "Pending"}
                      </span>
                    </td>
                    <td data-label="Action">
                      <button
                        type="button"
                        className="view-task-button"
                        onClick={() => navigate(`/daily-task/${task._id}`)}
                      >
                        View Details <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && (
          <div className="task-table-footer">
            Showing <strong>{filteredTasks.length}</strong> of <strong>{total}</strong> tasks
          </div>
        )}
      </section>
    </div>
  );
}
