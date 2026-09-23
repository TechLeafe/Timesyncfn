import {
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


function TaskDetails() {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [task, setTask] =
    useState<DailyTaskItem | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState<TaskStatus>("Pending");

  const [comment, setComment] =
    useState("");

  const [statusLoading, setStatusLoading] =
    useState(false);

  const [commentLoading, setCommentLoading] =
    useState(false);


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  /* =========================================================
     LOAD TASK
  ========================================================= */

  const loadTask =
    async () => {
      if (!id) {
        setError(
          "Task ID not found."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        const response =
          await getTaskById(id);

        console.log(
          "Task Details Response:",
          response
        );

        const taskData =
          response.data?.data;

        if (!taskData) {
          setError(
            "Task not found."
          );

          return;
        }

        setTask(taskData);

        setStatus(
          taskData.status ||
            "Pending"
        );

      } catch (err: any) {
        console.error(
          "Task details error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load task details."
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadTask();
  }, [id]);


  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const handleStatusUpdate =
    async () => {
      if (!id) {
        return;
      }

      try {
        setStatusLoading(true);

        await changeTaskStatus(
          id,
          status
        );

        setTask((previous) =>
          previous
            ? {
                ...previous,
                status,
              }
            : previous
        );

      } catch (err: any) {
        console.error(
          "Status update error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to update status."
        );

      } finally {
        setStatusLoading(false);
      }
    };


  /* =========================================================
     ADD COMMENT
  ========================================================= */

  const handleAddComment =
    async () => {
      if (!id) {
        return;
      }

      if (!comment.trim()) {
        return;
      }

      try {
        setCommentLoading(true);

        const response =
          await addTaskComment(
            id,
            comment.trim()
          );

        console.log(
          "Comment Response:",
          response.data
        );

        setComment("");

        await loadTask();

      } catch (err: any) {
        console.error(
          "Comment error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to add comment."
        );

      } finally {
        setCommentLoading(false);
      }
    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="task-details-page">
        Loading task details...
      </div>
    );
  }


  /* =========================================================
     ERROR / NOT FOUND
  ========================================================= */

  if (!task) {
    return (
      <div className="task-details-page">

        <div className="task-details-header">

          <h1>Task Details</h1>

          <button
            type="button"
            className="task-details-back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Back
          </button>

        </div>

        <div className="task-details-error">
          {error ||
            "Task not found."}
        </div>

      </div>
    );
  }


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="task-details-page">

      {/* HEADER */}

      <div className="task-details-header">

        <div>
          <h1>
            Task Details
          </h1>

          <p>
            View and manage task information.
          </p>
        </div>

        <button
          type="button"
          className="task-details-back-button"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Back
        </button>

      </div>


      {error && (
        <div className="task-details-error">
          {error}
        </div>
      )}


      {/* TASK INFORMATION */}

      <div className="task-details-card">

        <div className="task-details-title-row">

          <div>
            <span className="task-small-label">
              Task Title
            </span>

            <h2>
              {task.title}
            </h2>
          </div>

          <div className="task-current-status">

            <span
              className={`details-status-dot ${
                task.status
                  ?.toLowerCase()
                  .replace(
                    " ",
                    "-"
                  ) ||
                "pending"
              }`}
            />

            {task.status ||
              "Pending"}

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

          <div>
            <span>
              Priority
            </span>

            <strong>
              {task.priority}
            </strong>
          </div>

          <div>
            <span>
              Business Year
            </span>

            <strong>
              {task.businessYear ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              From Date
            </span>

            <strong>
              {formatDate(
                task.fromDate
              )}
            </strong>
          </div>

          <div>
            <span>
              To Date
            </span>

            <strong>
              {formatDate(
                task.toDate
              )}
            </strong>
          </div>

          <div>
            <span>
              Created On
            </span>

            <strong>
              {formatDate(
                task.createdAt
              )}
            </strong>
          </div>

          <div>
            <span>
              Completed Date
            </span>

            <strong>
              {formatDate(
                task.completedDate
              )}
            </strong>
          </div>

        </div>

      </div>


      {/* UPDATE STATUS */}

      <div className="task-status-section">

        <h2>
          Update Status
        </h2>

        <div className="task-status-options">

          {(
            [
              "Pending",
              "In Progress",
              "Completed",
            ] as TaskStatus[]
          ).map(
            (item) => (
              <label
                key={item}
                className="task-status-option"
              >
                <input
                  type="radio"
                  name="task-status"
                  value={item}
                  checked={
                    status === item
                  }
                  onChange={() =>
                    setStatus(item)
                  }
                />

                {item}
              </label>
            )
          )}

        </div>

        <button
          type="button"
          className="update-status-button"
          onClick={
            handleStatusUpdate
          }
          disabled={
            statusLoading
          }
        >
          {statusLoading
            ? "Updating..."
            : "Update Status"}
        </button>

      </div>


      {/* COMMENTS */}

      <div className="task-comments-section">

        <h2>
          Comments
        </h2>

        <textarea
          value={comment}
          onChange={(event) =>
            setComment(
              event.target.value
            )
          }
          placeholder="Write a comment..."
          rows={4}
        />

        <button
          type="button"
          className="comment-submit-button"
          onClick={
            handleAddComment
          }
          disabled={
            commentLoading
          }
        >
          {commentLoading
            ? "Submitting..."
            : "Submit Comment"}
        </button>


        <div className="task-comment-list">

          {!task.comments ||
          task.comments.length === 0 ? (

            <p className="no-comments">
              No comments yet.
            </p>

          ) : (

            task.comments.map(
              (
                item,
                index
              ) => (
                <div
                  className="task-comment"
                  key={
                    item._id ||
                    index
                  }
                >

                  <div className="task-comment-header">

                    <strong>
                      {item.updatedBy ||
                        "User"}
                    </strong>

                    <span>
                      {formatDate(
                        item.commentDate
                      )}
                    </span>

                  </div>

                  <p>
                    {item.text}
                  </p>

                </div>
              )
            )

          )}

        </div>

      </div>

    </div>
  );
}

export default TaskDetails;