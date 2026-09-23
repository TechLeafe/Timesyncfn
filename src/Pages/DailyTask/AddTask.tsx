import {
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  createTask,
  type TaskPriority,
} from "../../services/dailyTaskApi";

import "./AddTask.css";


function AddTask() {
  const navigate = useNavigate();


  /* =========================================================
     FORM STATES
  ========================================================= */

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState<TaskPriority>("Medium");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");


    /* =========================
       TITLE VALIDATION
    ========================= */

    if (!title.trim()) {
      setError(
        "Task title is required."
      );

      return;
    }


    /* =========================
       DESCRIPTION VALIDATION
    ========================= */

    if (!description.trim()) {
      setError(
        "Description is required."
      );

      return;
    }


    /* =========================
       DATE VALIDATION
    ========================= */

    if (
      fromDate &&
      toDate &&
      new Date(toDate) <
        new Date(fromDate)
    ) {
      setError(
        "To Date cannot be earlier than From Date."
      );

      return;
    }


    /* =========================
       CREATE TASK
    ========================= */

    try {
      setLoading(true);


      /* =========================
         REQUEST PAYLOAD
      ========================= */

      const payload = {
        title: title.trim(),

        description:
          description.trim(),

        priority,

        ...(fromDate
          ? { fromDate }
          : {}),

        ...(toDate
          ? { toDate }
          : {}),
      };


      /* =========================
         DEBUG PAYLOAD
      ========================= */

      console.log(
        "Create Task Payload:",
        payload
      );


      /* =========================
         API CALL
      ========================= */

      const response =
        await createTask(payload);


      console.log(
        "Create Task Response:",
        response.data
      );


      /* =========================
         SUCCESS → TASK LIST
      ========================= */

      navigate(
        "/daily-task",
        {
          replace: true,
        }
      );

    } catch (err: any) {

      console.error(
        "Create Task Error:",
        err
      );

      console.error(
        "Status:",
        err.response?.status
      );

      console.error(
        "Backend Response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Unable to create task."
      );

    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="add-task-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="add-task-header">

        <div>
          <h1>Add Task</h1>

          <p>
            Create a new daily task.
          </p>
        </div>


        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(
              "/daily-task"
            )
          }
        >
          Back
        </button>

      </div>


      {/* =========================
          FORM
      ========================= */}

      <form
        className="add-task-card"
        onSubmit={handleSubmit}
      >

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="add-task-error">
            {error}
          </div>
        )}


        {/* =========================
            TITLE
        ========================= */}

        <div className="task-form-group task-form-full">

          <label>
            Title
            <span>*</span>
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="Enter task title"
          />

        </div>


        {/* =========================
            DESCRIPTION
        ========================= */}

        <div className="task-form-group task-form-full">

          <label>
            Description
            <span>*</span>
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Enter task description"
            rows={5}
          />

        </div>


        {/* =========================
            PRIORITY
        ========================= */}

        <div className="task-form-group">

          <label>
            Priority
            <span>*</span>
          </label>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target
                  .value as TaskPriority
              )
            }
          >

            <option value="High">
              High
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Low">
              Low
            </option>

          </select>

        </div>


        {/* =========================
            FROM DATE
        ========================= */}

        <div className="task-form-group">

          <label>
            From Date

            <small>
              Optional
            </small>
          </label>

          <input
            type="date"
            value={fromDate}
            onChange={(event) =>
              setFromDate(
                event.target.value
              )
            }
          />

        </div>


        {/* =========================
            TO DATE
        ========================= */}

        <div className="task-form-group">

          <label>
            To Date

            <small>
              Optional
            </small>
          </label>

          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) =>
              setToDate(
                event.target.value
              )
            }
          />

        </div>


        {/* =========================
            ACTION BUTTONS
        ========================= */}

        <div className="task-form-actions">

          <button
            type="button"
            className="cancel-task-button"
            onClick={() =>
              navigate(
                "/daily-task"
              )
            }
          >
            Cancel
          </button>


          <button
            type="submit"
            className="create-task-button"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Task"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default AddTask;