import axiosInstance from "../api/axiosInstance";


/* =========================================================
   TYPES
========================================================= */

export type TaskPriority =
  | "High"
  | "Medium"
  | "Low";

export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Completed";


export interface TaskComment {
  _id?: string;
  commentDate?: string;
  text: string;
  updatedBy?: string;
}


export interface DailyTaskItem {
  _id: string;

  title: string;
  description?: string;

  priority: TaskPriority;
  status: TaskStatus;

  fromDate?: string | null;
  toDate?: string | null;

  completedDate?: string | null;

  comments?: TaskComment[];


  businessYear?: string;

  createdAt?: string;
  updatedAt?: string;
}


export interface CreateTaskPayload {
  title: string;
  description: string;

  priority: TaskPriority;

  fromDate?: string;
  toDate?: string;

  businessYear: string;

}


export interface TaskListFilter {
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  businessYear?: string;
}


/* =========================================================
   API ENDPOINTS
========================================================= */

const ENDPOINTS = {
  create: "/daily-tasks/create",

  list: "/daily-tasks/list",

  changeStatus:
    "/daily-tasks/change-status",

  addComment:
    "/daily-tasks/add-comment",

  update:
    "/daily-tasks/update",

  delete:
    "/daily-tasks/delete",
};


/* =========================================================
   CREATE TASK
========================================================= */

export const createTask = (
  data: CreateTaskPayload
) => {
  return axiosInstance.post(
    ENDPOINTS.create,
    data
  );
};


/* =========================================================
   GET ALL TASKS

   Backend uses POST for listing.
========================================================= */

export const getAllTasks = (
  filters: TaskListFilter = {
    status: "",
    priority: "",
    businessYear: "",
  }
) => {
  return axiosInstance.post(
    ENDPOINTS.list,
    {
      status: filters.status ?? "",
      priority:
        filters.priority ?? "",
      businessYear:
        filters.businessYear ?? "",
    }
  );
};


/* =========================================================
   GET TASK BY ID

   Backend currently did not provide a separate
   "get by id" API.

   So we fetch the list and find the task by _id.
========================================================= */

export const getTaskById = async (
  id: string
) => {
  const response =
    await getAllTasks();

  const tasks: DailyTaskItem[] =
    response.data?.data || [];

  const task = tasks.find(
    (item) => item._id === id
  );

  return {
    data: {
      success: Boolean(task),
      data: task || null,
    },
  };
};


/* =========================================================
   CHANGE TASK STATUS
========================================================= */

export const changeTaskStatus = (
  id: string,
  status: TaskStatus
) => {
  return axiosInstance.post(
    ENDPOINTS.changeStatus,
    {
      _id: id,
      status,
    }
  );
};


/* =========================================================
   ADD COMMENT
========================================================= */

export const addTaskComment = (
  taskId: string,
  comment: string
) => {
  return axiosInstance.post(
    ENDPOINTS.addComment,
    {
      _id: taskId,
      text: comment,
    }
  );
};


/* =========================================================
   GET COMMENTS

   Comments are already available inside each task.
   No separate comments API was provided.
========================================================= */

export const getTaskComments =
  async (taskId: string) => {
    const response =
      await getAllTasks();

    const tasks: DailyTaskItem[] =
      response.data?.data || [];

    const task = tasks.find(
      (item) =>
        item._id === taskId
    );

    return {
      data: {
        success: Boolean(task),
        data: task?.comments || [],
      },
    };
  };


/* =========================================================
   UPDATE TASK
========================================================= */

export interface UpdateTaskPayload {
  _id: string;

  title: string;
  description: string;

  priority: TaskPriority;

  fromDate?: string;
  toDate?: string;
}


export const updateTask = (
  data: UpdateTaskPayload
) => {
  return axiosInstance.post(
    ENDPOINTS.update,
    data
  );
};


/* =========================================================
   DELETE TASK
========================================================= */

export const deleteTask = (
  id: string
) => {
  return axiosInstance.post(
    ENDPOINTS.delete,
    {
      _id: id,
    }
  );
};