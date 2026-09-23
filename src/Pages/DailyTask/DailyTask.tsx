import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getAllTasks,
  type DailyTaskItem,
} from "../../services/dailyTaskApi";

import "./DailyTask.css";


function DailyTask() {
  const navigate = useNavigate();

  const [tasks, setTasks] =
    useState<DailyTaskItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (
    date?: string | null
  ) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  /* =========================================================
     FETCH TASKS
  ========================================================= */

  const fetchTasks =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await getAllTasks();

        console.log(
          "Daily Task API Response:",
          response.data
        );

        const taskList:
          DailyTaskItem[] =
          Array.isArray(
            response.data?.data
          )
            ? response.data.data
            : [];

        setTasks(taskList);

      } catch (err: any) {
        console.error(
          "Get Tasks Error:",
          err
        );

        console.error(
          "Backend Response:",
          err.response?.data
        );

        setError(
          err.response?.data?.message ||
            "Unable to load tasks."
        );

      } finally {
        setLoading(false);
      }
    }, []);


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);


  /* =========================================================
     STATUS CLASS
  ========================================================= */

  const getStatusClass = (
    status?: string
  ) => {
    const value =
      status?.toLowerCase();

    if (value === "completed") {
      return "task-status completed";
    }

    if (
      value === "in progress" ||
      value === "in-progress"
    ) {
      return "task-status progress";
    }

    return "task-status pending";
  };


  /* =========================================================
     PRIORITY CLASS
  ========================================================= */

  const getPriorityClass = (
    priority?: string
  ) => {
    const value =
      priority?.toLowerCase();

    if (value === "high") {
      return "task-priority highest";
    }

    if (value === "low") {
      return "task-priority lowest";
    }

    return "task-priority medium";
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="daily-task-page">

      {/* HEADER */}

      <div className="daily-task-header">

        <div>
          <h1>Daily Tasks</h1>

          <p>
            Create, manage and track
            daily employee tasks.
          </p>
        </div>

        <button
          type="button"
          className="add-task-button"
          onClick={() =>
            navigate(
              "/daily-task/add"
            )
          }
        >
          + Add Task
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="task-error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={fetchTasks}
          >
            Retry
          </button>

        </div>
      )}


      {/* TASK TABLE */}

      <div className="task-table-card">

        <div className="task-table-wrapper">

          <table className="task-table">

            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Created On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={5}
                    className="task-table-message"
                  >
                    Loading tasks...
                  </td>
                </tr>

              ) : tasks.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="task-table-message"
                  >
                    No tasks found.
                  </td>
                </tr>

              ) : (

                tasks.map((task) => (

                  <tr key={task._id}>

                    {/* TITLE */}

                    <td>
                      <div className="task-title-cell">
                        {task.title}
                      </div>
                    </td>


                    {/* PRIORITY */}

                    <td>
                      <span
                        className={
                          getPriorityClass(
                            task.priority
                          )
                        }
                      >
                        {task.priority}
                      </span>
                    </td>


                    {/* CREATED DATE */}

                    <td>
                      {formatDate(
                        task.createdAt
                      )}
                    </td>


                    {/* STATUS */}

                    <td>
                      <span
                        className={
                          getStatusClass(
                            task.status
                          )
                        }
                      >
                        {task.status || "Pending"}
                      </span>
                    </td>


                    {/* VIEW */}

                    <td>
                      <button
                        type="button"
                        className="view-task-button"
                        onClick={() =>
                          navigate(
                            `/daily-task/${task._id}`
                          )
                        }
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default DailyTask;