import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createTask, type TaskPriority } from "../../services/dailyTaskApi";
import { getBusinessYear } from "../../utils/businessYear";
import "./AddTask.css";

const priorities: TaskPriority[] = ["Low", "Medium", "High"];
const paths = { task: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 15l3 3 5-5", title: "M4 5h16 M12 5v15 M8 20h8", description: "M5 3h10l4 4v14H5z M9 11h6 M9 15h6", priority: "M12 3l9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5", calendar: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16", check: "M5 12l4 4L19 6" };
function Icon({ name }: { name: keyof typeof paths }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function TaskArt() {
  return <svg className="task-art" viewBox="0 0 220 245" aria-hidden="true">
    <defs><linearGradient id="task-board" x2="1" y2="1"><stop stopColor="#a9ed79"/><stop offset="1" stopColor="#087b4d"/></linearGradient></defs>
    <ellipse cx="110" cy="222" rx="94" ry="14" fill="#003d2c" opacity=".25"/>
    <path d="M45 160Q0 130 12 85Q65 103 65 164M170 164Q215 130 207 85Q160 105 155 170" fill="#a4e77d"/>
    <g transform="rotate(7 105 120)"><rect x="38" y="35" width="132" height="176" rx="17" fill="url(#task-board)"/><rect x="48" y="46" width="112" height="151" rx="10" fill="#fff"/><rect x="77" y="23" width="55" height="30" rx="9" fill="#91d94b"/><circle cx="104" cy="27" r="7" fill="#d8f8ba"/>
    {[75,113,151].map(y=><g key={y}><rect x="61" y={y} width="22" height="22" rx="5" fill="#26a65b"/><path d={`M66 ${y+11}l5 5 8-10`} stroke="white" strokeWidth="3" fill="none"/><rect x="91" y={y+3} width="55" height="5" rx="2.5" fill="#9bcbb7"/><rect x="91" y={y+13} width="37" height="5" rx="2.5" fill="#d4e9df"/></g>)}</g>
    <g transform="rotate(9 165 190)"><rect x="132" y="159" width="72" height="65" rx="9" fill="#fff" stroke="#85cba3" strokeWidth="3"/><path d="M134 177h68" stroke="#1c9b59" strokeWidth="8"/><path d="M147 153v15 M189 153v15" stroke="#b4e77c" strokeWidth="7" strokeLinecap="round"/>{[0,1,2,3,4,5].map(i=><rect key={i} x={143+(i%3)*18} y={187+Math.floor(i/3)*16} width="11" height="10" rx="2" fill="#79c39b"/>)}</g>
  </svg>;
}
const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Unable to create task.";
};
function AddTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const goBack = () => navigate("/daily-task");
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!title.trim()) { setError("Task title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (fromDate && toDate && toDate < fromDate) { setError("To Date cannot be earlier than From Date."); return; }
    setLoading(true);
    try {
      const response = await createTask({ title: title.trim(), description: description.trim(), priority, businessYear: getBusinessYear(), ...(fromDate ? { fromDate } : {}), ...(toDate ? { toDate } : {}) });
      if (response.data?.success === false) throw new Error(response.data.message || "Unable to create task.");
      navigate("/daily-task", { replace: true });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };
  return <div className="add-task-page">
    <header className="add-task-header"><div><h1>Add New Task</h1><p>Create a task and set its priority and dates.</p></div><button type="button" className="back-button" onClick={goBack} disabled={loading}>← Back to Tasks</button></header>
    <div className="task-shell">
      <aside className="task-side"><h2>New Task</h2><p>Assign, track and manage your work efficiently.</p><div className="task-accent"/><TaskArt/></aside>
      <form className="add-task-card" onSubmit={handleSubmit}>
        <div className="add-task-form-header"><div className="task-heading-icon"><Icon name="task"/></div><div><h2>Task Information</h2><p>Fill in the details below to create a new task.</p></div></div>
        {error && <div className="add-task-error" role="alert">{error}</div>}
        <div className="task-form-group task-form-full"><label htmlFor="new-task-title"><Icon name="title"/>Task Title <span>*</span></label><input id="new-task-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Enter task title" required disabled={loading}/></div>
        <div className="task-form-group task-form-full"><label htmlFor="new-task-description"><Icon name="description"/>Description <span>*</span></label><textarea id="new-task-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the task and expected outcome..." rows={3} required disabled={loading}/></div>
        <fieldset className="task-form-group task-priority-field"><legend><Icon name="priority"/>Priority <span>*</span></legend><div className="task-priorities">{priorities.map(item=><label key={item} className={`priority-option priority-${item.toLowerCase()} ${priority===item ? "selected" : ""}`}><input type="radio" name="priority" value={item} checked={priority===item} onChange={()=>setPriority(item)} disabled={loading}/>{item}</label>)}</div></fieldset>
        <div className="task-form-group"><label htmlFor="new-task-business-year"><Icon name="calendar"/>Business Year</label><input id="new-task-business-year" value={getBusinessYear()} readOnly/></div>
        <div className="task-form-group"><label htmlFor="new-task-from"><Icon name="calendar"/>From Date <small>Optional</small></label><input id="new-task-from" type="date" value={fromDate} disabled={loading} max={toDate || undefined} onChange={e=>setFromDate(e.target.value)}/></div>
        <div className="task-form-group"><label htmlFor="new-task-to"><Icon name="calendar"/>To Date <small>Optional</small></label><input id="new-task-to" type="date" value={toDate} disabled={loading} min={fromDate || undefined} onChange={e=>setToDate(e.target.value)}/></div>
        <div className="task-form-actions"><button type="button" className="cancel-task-button" onClick={goBack} disabled={loading}>Cancel</button><button type="submit" className="create-task-button" disabled={loading}><Icon name="check"/>{loading ? "Creating..." : "Create Task"}</button></div>
      </form>
    </div>
  </div>;
}
export default AddTask;
