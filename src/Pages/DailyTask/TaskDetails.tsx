
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getTaskById,
  changeTaskStatus,
  addTaskComment,
  type DailyTaskItem,
  type TaskStatus,
} from "../../services/dailyTaskApi";

import "./TaskDetails.css";

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = datePart
    ? new Date(`${datePart}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
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

  return error instanceof Error ? error.message : fallback;
};

const getStatusClass = (value?: string) => {
  const status = value?.toLowerCase().replace(/[\s_]+/g, "-");

  if (status === "completed") return "completed";
  if (status === "in-progress") return "in-progress";

  return "pending";
};

function TaskDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [task, setTask] =
    useState<DailyTaskItem | null>(null);

  const [status, setStatus] =
    useState<TaskStatus>("Pending");

  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTask = useCallback(async () => {
    if (!id) {
      setTask(null);
      setError("Task ID not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getTaskById(id);
      const taskData = response.data?.data;

      if (!taskData) {
        throw new Error("Task not found.");
      }

      setTask(taskData);
      setStatus(taskData.status || "Pending");
    } catch (err) {
      setTask(null);
      setError(
        getErrorMessage(err, "Unable to load task details.")
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const handleStatusUpdate = async () => {
    if (
      !id ||
      !task ||
      statusLoading ||
      status === (task.status || "Pending")
    ) {
      return;
    }

    setStatusLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await changeTaskStatus(id, status);

      if (response.data?.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to update task status."
        );
      }

      setTask((previous) =>
        previous ? { ...previous, status } : previous
      );

      setSuccess("Task status updated successfully.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to update task status.")
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || commentLoading) return;

    if (!comment.trim()) {
      setError("Please enter a comment.");
      return;
    }

    setCommentLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await addTaskComment(
        id,
        comment.trim()
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to add comment."
        );
      }

      setComment("");
      await loadTask();
      setSuccess("Comment added successfully.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to add comment.")
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const backToTasks = () =>
    navigate("/daily-task");

  return (
    <div className="task-details-page">
      <header className="task-details-header">
        <div className="task-details-heading">
          <div className="task-details-heading-icon">
            <svg
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 9h8M8 14h8" />
            </svg>
          </div>

          <div>
            <h1>Task Details</h1>
            <p>View task information, progress, and comments.</p>
          </div>
        </div>

        <button
          type="button"
          className="task-details-back-button"
          onClick={backToTasks}
        >
          ← Back to Tasks
        </button>
      </header>

      {error && (
        <div className="task-details-error" role="alert">
          <span>{error}</span>

          {!task && (
            <button
              type="button"
              onClick={() => void loadTask()}
              disabled={loading}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="task-details-success" role="status">
          {success}
        </div>
      )}

      {loading && !task ? (
        <div className="task-details-card task-details-message">
          Loading task details...
        </div>
      ) : !task ? (
        <div className="task-details-card task-details-message">
          Task details are unavailable.
        </div>
      ) : (
        <>
          <section className="task-details-card">
            <div className="task-details-title-row">
              <div>
                <span className="task-small-label">Task Title</span>
                <h2>{task.title}</h2>
              </div>

              <div
                className={`task-current-status task-current-status--${getStatusClass(
                  task.status
                )}`}
              >
                <span
                  className={`details-status-dot ${getStatusClass(
                    task.status
                  )}`}
                />

                {task.status || "Pending"}
              </div>
            </div>

            <div className="task-description">
              <span className="task-small-label">
                Description
              </span>

              <p>
                {task.description ||
                  "No description available."}
              </p>
            </div>

            <div className="task-details-info-grid">
              {[
                {
                  label: "Priority",
                  value: task.priority || "Medium",
                },
                {
                  label: "Business Year",
                  value: task.businessYear || "-",
                },
                {
                  label: "From Date",
                  value: formatDate(task.fromDate),
                },
                {
                  label: "To Date",
                  value: formatDate(task.toDate),
                },
                {
                  label: "Created On",
                  value: formatDate(task.createdAt),
                },
                {
                  label: "Completed Date",
                  value: formatDate(task.completedDate),
                },
              ].map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="task-status-section">
            <div className="task-section-heading">
              <h2>Update Task Status</h2>
              <p>Choose the current progress of this task.</p>
            </div>

            <div className="task-status-options">
              {(
                [
                  "Pending",
                  "In Progress",
                  "Completed",
                ] as TaskStatus[]
              ).map((item) => (
                <label
                  key={item}
                  className={`task-status-option ${
                    status === item ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="task-status"
                    value={item}
                    checked={status === item}
                    onChange={() => setStatus(item)}
                    disabled={statusLoading}
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="task-section-actions">
              <button
                type="button"
                className="update-status-button"
                onClick={() => void handleStatusUpdate()}
                disabled={
                  statusLoading ||
                  status === (task.status || "Pending")
                }
              >
                {statusLoading
                  ? "Updating..."
                  : "Update Status"}
              </button>
            </div>
          </section>

          <section className="task-comments-section">
            <div className="task-section-heading">
              <h2>Comments</h2>
              <p>Share updates and review task discussions.</p>
            </div>

            <textarea
              aria-label="Write a task comment"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              placeholder="Write a comment..."
              rows={4}
              disabled={commentLoading}
            />

            <button
              type="button"
              className="comment-submit-button"
              onClick={() => void handleAddComment()}
              disabled={
                commentLoading || !comment.trim()
              }
            >
              {commentLoading
                ? "Submitting..."
                : "Submit Comment"}
            </button>

            <div className="task-comment-list">
              {!task.comments || task.comments.length === 0 ? (
                <p className="no-comments">
                  No comments yet.
                </p>
              ) : (
                task.comments.map((item, index) => (
                  <article
                    className="task-comment"
                    key={item._id || index}
                  >
                    <div className="task-comment-header">
                      <strong>
                        {item.updatedBy || "User"}
                      </strong>

                      <span>
                        {formatDate(item.commentDate)}
                      </span>
                    </div>

                    <p>{item.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default TaskDetails;
