
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  createTask,
  type TaskPriority,
} from "../../services/dailyTaskApi";
import { getBusinessYear } from "../../utils/businessYear";

import "./AddTask.css";

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

  return "Unable to create task.";
};

function AddTask() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<TaskPriority>("Medium");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const goBack = () => navigate("/daily-task");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (fromDate && toDate && toDate < fromDate) {
      setError("To Date cannot be earlier than From Date.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        businessYear: getBusinessYear(),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      };

      const response = await createTask(payload);

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Unable to create task."
        );
      }

      navigate("/daily-task", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-task-page">

      <header className="add-task-header">
        <div className="add-task-heading">
          <div className="add-task-heading-icon">
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
            <h1>Add New Task</h1>
            <p>Create a task and set its priority and dates.</p>
          </div>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={goBack}
          disabled={loading}
        >
          ← Back to Tasks
        </button>
      </header>

      <form
        className="add-task-card"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="add-task-form-header">
          <h2>Task Information</h2>
          <p>Fill in the details below to create a new task.</p>
        </div>

        {error && (
          <div className="add-task-error" role="alert">
            {error}
          </div>
        )}

        <div className="task-form-group task-form-full">
          <label htmlFor="new-task-title">
            Task Title <span>*</span>
          </label>

          <input
            id="new-task-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Enter task title"
            required
            disabled={loading}
          />
        </div>

        <div className="task-form-group task-form-full">
          <label htmlFor="new-task-description">
            Description <span>*</span>
          </label>

          <textarea
            id="new-task-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe the task and expected outcome"
            rows={5}
            required
            disabled={loading}
          />
        </div>

        <div className="task-form-group">
          <label htmlFor="new-task-priority">
            Priority <span>*</span>
          </label>

          <select
            id="new-task-priority"
            value={priority}
            disabled={loading}
            onChange={(event) =>
              setPriority(event.target.value as TaskPriority)
            }
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="task-form-group">
          <label htmlFor="new-task-business-year">
            Business Year
          </label>

          <input
            id="new-task-business-year"
            value={getBusinessYear()}
            readOnly
            aria-readonly="true"
          />
        </div>

        <div className="task-form-group">
          <label htmlFor="new-task-from">
            From Date <small>Optional</small>
          </label>

          <input
            id="new-task-from"
            type="date"
            value={fromDate}
            disabled={loading}
            max={toDate || undefined}
            onChange={(event) =>
              setFromDate(event.target.value)
            }
          />
        </div>

        <div className="task-form-group">
          <label htmlFor="new-task-to">
            To Date <small>Optional</small>
          </label>

          <input
            id="new-task-to"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            disabled={loading}
            onChange={(event) =>
              setToDate(event.target.value)
            }
          />
        </div>

        <div className="task-form-actions">
          <button
            type="button"
            className="cancel-task-button"
            onClick={goBack}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="create-task-button"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTask;
