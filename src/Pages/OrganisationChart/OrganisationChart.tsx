
import React from "react";
import "./OrganisationChart.css";

interface Employee {
  name: string;
  designation: string;
}

interface Team {
  name: string;
  members: Employee[];
  variant: string;
}

const leadership: Employee[] = [
  { name: "P. S. Vigneshwaran", designation: "Chief Executive Officer (CEO)" },
  { name: "T. Mari", designation: "Chief Operating Officer (COO)" },
];

const hr: Employee = {
  name: "Dhamini A",
  designation: "HR",
};

const teamLeader: Employee = {
  name: "Krishna Kanth",
  designation: "Team Leader",
};

const teams: Team[] = [
  {
    name: "IMPL Team",
    variant: "impl-team",
    members: [
      { name: "Aruthathi", designation: "Web Developer" },
      { name: "Arthi", designation: "Web Developer" },
      { name: "Mohan Aditiyan", designation: "Software Engineer" },
      { name: "Swarna Lakshmi", designation: "Full Stack Developer" },
      { name: "Arul", designation: "Senior Web Developer" },
      { name: "Sowjanya", designation: "Full Stack Developer Intern" },
      { name: "Jeeva", designation: "Software Developer" },
      
    ],
  },
  {
    name: "CoinStep Team",
    variant: "coinstep-team",
    members: [
      { name: "Monisha Begam", designation: "Web Developer" },
      { name: "Harinipriya", designation: "Full Stack Developer" },
      { name: "Raja", designation: "Web Developer" },
      { name: "Harshita Sharma", designation: "Full Stack AI Engineer" },
      { name: "Sowmiya", designation: "Web Developer" },
    ],
  },
  {
    name: "IMPL Website Team",
    variant: "impl_website-team",
    members: [
      { name: "Jerlin Renisa", designation: "App Developer" },
      { name: "Kabil Kumaran", designation: "UI/UX Designer" }
    ],
  },
  {
    name: "UI/UX Designer Team",
    variant: "designer-team",
    members: [
      { name: "Avinesha", designation: "UI/UX Designer" },
      { name: "Kabil Kumaran", designation: "UI/UX Designer" },
      { name: "Vijay", designation: "UI/UX Designer Intern" },
    ],
  },
  {
    name: "HRMS Team",
    variant: "hrms-team",
    members: [
      { name: "Jerlin Renisa", designation: "App Developer" },
      { name: "Maria Francinna", designation: "Full Stack Developer Intern" },
      { name: "Punitha", designation: "Full Stack Developer Intern" },
    ],
  },
  
];

const EmployeeCard: React.FC<{
  employee: Employee;
  variant: string;
}> = ({ employee, variant }) => {
  return (
    <div className={`org-employee-card ${variant}`}>
      <div className="org-profile-placeholder">
        {employee.name.charAt(0).toUpperCase()}
      </div>

      <div className="org-employee-details">
        <p className="org-employee-name">{employee.name}</p>
        <p className="org-employee-designation">
          {employee.designation}
        </p>
      </div>
    </div>
  );
};

const OrganisationChart: React.FC = () => {
  return (
    <div className="organisation-chart-page">
      <div className="organisation-chart-header">
        <div>
          <h1>Organisation Chart</h1>
          <p>View the company's reporting structure and teams.</p>
        </div>
      </div>

      <div className="organisation-chart-content">

        {/* Directors */}
        <div className="org-leadership">
          {leadership.map((employee) => (
            <EmployeeCard
              key={employee.name}
              employee={employee}
              variant="leadership-card"
            />
          ))}
        </div>

        {/* Directors report to HR */}
        <div className="org-leadership-connector">
          <span className="org-leadership-horizontal" />
          <span className="org-leadership-vertical" />
        </div>

        {/* HR */}
        <EmployeeCard employee={hr} variant="hr-card" />

        <div className="org-connector org-connector-hr" />

        {/* Team Leader */}
        <EmployeeCard employee={teamLeader} variant="tl-card" />

        {/* Four teams reporting to Team Leader */}
        <div className="org-team-branches">

          <div className="org-team-horizontal-connector" />

          <div className="org-regular-teams">
            {teams.map((team) => (
              <div
                className={`org-team-card ${team.variant}`}
                key={team.name}
              >
                <div className="org-team-vertical-connector" />

                <h3>{team.name}</h3>

                <div className="org-team-members">
                  {team.members.map((employee) => (
                    <EmployeeCard
                      key={employee.name}
                      employee={employee}
                      variant={
                        team.variant === "intern-team"
                          ? "intern-card"
                          : "team-member-card"
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrganisationChart;
