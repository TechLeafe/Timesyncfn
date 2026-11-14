
import { Star } from "lucide-react";

export type AchievementEmployee = {
  user_id: string;
  employeeId: string;
  name: string;
  designation?: string;
  photo?: string | null;
};

export type MonthlyAchievement = {
  _id: string;
  employee: AchievementEmployee | null;
  month: number;
  year: number;
  achievement: string;
  selectedBy: string;
};

type Props = {
  achievement: MonthlyAchievement;
};

export default function MonthlyAchievementCard({
  achievement,
}: Props) {
  const employee = achievement.employee;
  const initials = (employee?.name || "E")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const monthName = new Date(
    achievement.year,
    achievement.month - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <article className="ma-award-card">
      <div className="ma-award-scene">
        <span className="ma-spark ma-spark-left">✦</span>
        <span className="ma-spark ma-spark-right">✦</span>

        <div className="ma-portrait">
          {employee?.photo ? (
            <img src={employee.photo} alt={employee.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>

      <div className="ma-employee-summary">
        <div className="ma-month-summary-ribbon">
          {monthName}
        </div>
        <span className="ma-designation">
          {employee?.designation || "Employee"}
        </span>
        <Star
          className="ma-employee-star"
          size={15}
          fill="currentColor"
          aria-hidden="true"
        />
      </div>

      <div className="ma-reason">
        <span>“{achievement.achievement}”</span>
      </div>
    </article>
  );
}
