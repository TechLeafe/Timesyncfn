import {
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

import api from "../../api/axiosInstance";

import {
  HR,
  ADMIN,
  EMPLOYEE,
} from "../../data/permissions";

import "./EmployeeCheckInOut.css";

import employeeImage from "../../assets/CheckInOut/User_icon.png";
import leafImage from "../../assets/StatCards/Leafe.png";


/* =========================================
   TYPES
========================================= */

interface Employee {
  name: string;
  designation: string;
  employeeId: string;
  department: string;
  email: string;
  reportingManager: string;
  location: string;
}

interface CheckInOutRecord {
  _id?: string;

  employeeId: string;

  name?: string;

  employeeName?: string;

  checkIn?: string;

  checkOut?: string;

  checkInTime?: string;

  checkOutTime?: string;

  workingHours?: string;

  date?: string;
}


/* =========================================
   COMPONENT
========================================= */

const EmployeeCheckInOut = () => {
  /* =========================================
     GET LOGGED IN USER
  ========================================= */

  const storedUser =
    localStorage.getItem("loggedInUser");

  let loggedInUser: any = null;

  if (storedUser) {
    try {
      loggedInUser =
        JSON.parse(storedUser);
    } catch {
      loggedInUser = null;
    }
  }


  const userType = Number(
    loggedInUser?.userType
  );


  /* =========================================
     ROLE CHECK
  ========================================= */

  const isEmployee =
    userType === EMPLOYEE;

  const isHR =
    userType === HR;

  const isAdmin =
    userType === ADMIN;

  const canViewAll =
    isHR || isAdmin;


  /* =========================================
     STATES
  ========================================= */

  const [employee, setEmployee] =
    useState<Employee>({
      name:
        loggedInUser?.name ??
        "Employee",

      designation:
        loggedInUser?.designation ??
        "-",

      employeeId:
        loggedInUser?.employeeId ??
        loggedInUser?.userId ??
        "-",

      department:
        loggedInUser?.department ??
        "-",

      email:
        loggedInUser?.email ??
        "-",

      reportingManager:
        loggedInUser?.reportingManager ??
        "-",

      location:
        loggedInUser?.location ??
        "Office - TechLeafe",
    });


  const [
    allRecords,
    setAllRecords,
  ] = useState<
    CheckInOutRecord[]
  >([]);


  const [
    isCheckedIn,
    setIsCheckedIn,
  ] = useState(false);


  const [
    checkInTime,
    setCheckInTime,
  ] = useState<Date | null>(
    null
  );


  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  /* =========================================
     FETCH CHECK IN / OUT DATA

     Employee:
     GET /checkinout/me

     HR/Admin:
     GET /checkinout
  ========================================= */

  useEffect(() => {
    const fetchCheckInOut =
      async () => {
        try {
          setLoading(true);
          setError("");


          /* ===============================
             EMPLOYEE - OWN DATA
          =============================== */

          if (isEmployee) {
            const response =
              await api.get(
                "/checkinout/me"
              );

            console.log(
              "Own Check In/Out:",
              response.data
            );


            const data =
              response.data?.data ??
              response.data;


            /*
              Expected example:

              data: {
                employee: {...},
                isCheckedIn: true,
                checkInTime: "..."
              }
            */


            if (data?.employee) {
              setEmployee({
                name:
                  data.employee.name ??
                  loggedInUser?.name ??
                  "Employee",

                designation:
                  data.employee
                    .designation ??
                  "-",

                employeeId:
                  data.employee
                    .employeeId ??
                  loggedInUser
                    ?.employeeId ??
                  "-",

                department:
                  data.employee
                    .department ??
                  "-",

                email:
                  data.employee.email ??
                  loggedInUser?.email ??
                  "-",

                reportingManager:
                  data.employee
                    .reportingManager ??
                  "-",

                location:
                  data.employee.location ??
                  "Office - TechLeafe",
              });
            }


            if (
              data?.isCheckedIn
            ) {
              setIsCheckedIn(true);
            }


            if (
              data?.checkInTime
            ) {
              setCheckInTime(
                new Date(
                  data.checkInTime
                )
              );
            }

            return;
          }


          /* ===============================
             HR / ADMIN - ALL RECORDS
          =============================== */

          if (canViewAll) {
            const response =
              await api.get(
                "/checkinout"
              );

            console.log(
              "All Check In/Out:",
              response.data
            );


            const data =
              response.data?.data ??
              response.data;


            const records =
              Array.isArray(data)
                ? data
                : Array.isArray(
                    data?.records
                  )
                ? data.records
                : [];


            setAllRecords(records);
          }
        } catch (err: any) {
          console.error(
            "Check In/Out error:",
            err
          );


          setError(
            err.response?.data
              ?.message ||
              "Unable to load check-in/out data."
          );
        } finally {
          setLoading(false);
        }
      };


    fetchCheckInOut();
  }, [
    isEmployee,
    canViewAll,
  ]);


  /* =========================================
     TIMER
  ========================================= */

  useEffect(() => {
    if (!checkInTime) {
      return;
    }


    const updateTimer =
      () => {
        const difference =
          Math.floor(
            (
              Date.now() -
              checkInTime.getTime()
            ) / 1000
          );


        setElapsedSeconds(
          Math.max(
            0,
            difference
          )
        );
      };


    updateTimer();


    const interval =
      setInterval(
        updateTimer,
        1000
      );


    return () =>
      clearInterval(
        interval
      );
  }, [checkInTime]);


  /* =========================================
     CHECK IN
     EMPLOYEE ONLY
  ========================================= */

  const handleCheckIn =
    async () => {
      if (!isEmployee) {
        return;
      }


      try {
        setError("");


        const response =
          await api.post(
            "/checkinout/check-in"
          );


        console.log(
          "Check In:",
          response.data
        );


        const data =
          response.data?.data ??
          response.data;


        const time =
          data?.checkInTime
            ? new Date(
                data.checkInTime
              )
            : new Date();


        setCheckInTime(time);

        setIsCheckedIn(true);

        setElapsedSeconds(0);
      } catch (err: any) {
        console.error(
          "Check In error:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Unable to check in."
        );
      }
    };


  /* =========================================
     CHECK OUT
     EMPLOYEE ONLY
  ========================================= */

  const handleCheckOut =
    async () => {
      if (!isEmployee) {
        return;
      }


      try {
        setError("");


        const response =
          await api.post(
            "/checkinout/check-out"
          );


        console.log(
          "Check Out:",
          response.data
        );


        setIsCheckedIn(false);

        setCheckInTime(null);

        setElapsedSeconds(0);
      } catch (err: any) {
        console.error(
          "Check Out error:",
          err
        );


        setError(
          err.response?.data
            ?.message ||
            "Unable to check out."
        );
      }
    };


  /* =========================================
     FORMAT TIMER
  ========================================= */

  const formatTime = (
    totalSeconds: number
  ) => {
    const hours =
      Math.floor(
        totalSeconds /
          3600
      );


    const minutes =
      Math.floor(
        (
          totalSeconds %
          3600
        ) / 60
      );


    const seconds =
      totalSeconds % 60;


    return `${String(
      hours
    ).padStart(
      2,
      "0"
    )}:${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      seconds
    ).padStart(
      2,
      "0"
    )}`;
  };


  /* =========================================
     FORMAT DATE/TIME
  ========================================= */

  const formatDateTime = (
    value?: string
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


    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };


  /* =========================================
     HR / ADMIN VIEW
  ========================================= */

  if (canViewAll) {
    return (
      <Box
        sx={{
          width: "100%",
          fontFamily:
            "var(--font-family)",
        }}
      >
        {/* PAGE TITLE */}

        <Box
          sx={{
            display: "flex",
            alignItems:
              "center",
            gap: 1.5,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius:
                "12px",
              backgroundColor:
                "#E8F5E9",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              color:
                "#1B6B33",
            }}
          >
            <AccessTimeOutlinedIcon />
          </Box>


          <Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color:
                  "#1B6B33",
              }}
            >
              Employee Check In /
              Out
            </Typography>


            <Typography
              sx={{
                fontSize: 13,
                color:
                  "#6B7280",
              }}
            >
              View employee
              check-in and
              check-out records.
            </Typography>
          </Box>
        </Box>


        {error && (
          <Typography
            sx={{
              mb: 2,
              color:
                "#D42B2B",
              fontSize: 13,
            }}
          >
            {error}
          </Typography>
        )}


        <TableContainer
          component={Paper}
          sx={{
            borderRadius:
              "14px",
            border:
              "1px solid #E5E7EB",
            boxShadow:
              "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Table>

            <TableHead>
              <TableRow
                sx={{
                  backgroundColor:
                    "#F8FAFC",
                }}
              >

                <TableCell>
                  Employee
                </TableCell>

                <TableCell>
                  Employee ID
                </TableCell>

                <TableCell>
                  Date
                </TableCell>

                <TableCell>
                  Check In
                </TableCell>

                <TableCell>
                  Check Out
                </TableCell>

                <TableCell>
                  Working Hours
                </TableCell>

              </TableRow>
            </TableHead>


            <TableBody>

              {loading ? (
                <TableRow>

                  <TableCell
                    colSpan={6}
                    align="center"
                  >
                    Loading...
                  </TableCell>

                </TableRow>
              ) : allRecords.length ===
                0 ? (
                <TableRow>

                  <TableCell
                    colSpan={6}
                    align="center"
                  >
                    No check-in/out
                    records found.
                  </TableCell>

                </TableRow>
              ) : (
                allRecords.map(
                  (
                    record,
                    index
                  ) => (
                    <TableRow
                      key={
                        record._id ??
                        `${record.employeeId}-${index}`
                      }
                      hover
                    >

                      <TableCell>
                        {record.name ??
                          record.employeeName ??
                          "-"}
                      </TableCell>


                      <TableCell>
                        {
                          record.employeeId
                        }
                      </TableCell>


                      <TableCell>
                        {record.date
                          ? new Date(
                              record.date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </TableCell>


                      <TableCell>
                        {formatDateTime(
                          record.checkInTime ??
                            record.checkIn
                        )}
                      </TableCell>


                      <TableCell>
                        {formatDateTime(
                          record.checkOutTime ??
                            record.checkOut
                        )}
                      </TableCell>


                      <TableCell>
                        {record.workingHours ??
                          "-"}
                      </TableCell>

                    </TableRow>
                  )
                )
              )}

            </TableBody>

          </Table>
        </TableContainer>
      </Box>
    );
  }


  /* =========================================
     EMPLOYEE VIEW
  ========================================= */

  return (
    <Box className="employee-attendance-page">

      {error && (
        <Typography
          sx={{
            mb: 2,
            color:
              "#D42B2B",
            fontSize: 13,
          }}
        >
          {error}
        </Typography>
      )}


      <Box className="employee-attendance-container">

        {/* LEFT EMPLOYEE CARD */}

        <Card className="employee-profile-card">

          <img
            src={leafImage}
            alt=""
            className="employee-leaf employee-leaf-left"
          />


          <img
            src={leafImage}
            alt=""
            className="employee-leaf employee-leaf-bottom"
          />


          <CardContent className="employee-profile-content">

            {/* EMPLOYEE IMAGE */}

            <Box className="employee-image-wrapper">

              <img
                src={employeeImage}
                alt={employee.name}
                className="employee-image"
              />

            </Box>


            {/* NAME */}

            <Typography className="employee-name">
              {employee.name}
            </Typography>


            <Typography className="employee-designation">
              {
                employee.designation
              }
            </Typography>


            {/* CHECK IN / CHECK OUT
                EMPLOYEE ONLY */}

            {isEmployee && (
              <Box className="attendance-actions">

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={
                    <AccessTimeOutlinedIcon />
                  }
                  className="check-in-button"
                  onClick={
                    isCheckedIn
                      ? handleCheckOut
                      : handleCheckIn
                  }
                >
                  {isCheckedIn
                    ? "Check Out"
                    : "Check In"}
                </Button>

              </Box>
            )}

          </CardContent>

        </Card>


        {/* RIGHT SIDE */}

        <Box className="attendance-right-section">


          {/* TIMER CARD */}

          <Card className="timer-card">

            <CardContent className="timer-card-content">

              <Box className="timer-left">

                <Box className="timer-heading">

                  <AccessTimeOutlinedIcon />

                  <Typography>
                    Time Since Check In
                  </Typography>

                </Box>


                <Typography className="timer-value">

                  {formatTime(
                    elapsedSeconds
                  )}

                </Typography>


                <Box className="timer-labels">

                  <Typography>
                    Hours
                  </Typography>

                  <Typography>
                    Minutes
                  </Typography>

                  <Typography>
                    Seconds
                  </Typography>

                </Box>

              </Box>


              <Box className="timer-message">

                <img
                  src={leafImage}
                  alt=""
                  className="timer-leaf"
                />


                <Typography className="timer-message-title">

                  {isCheckedIn
                    ? "Keep going!"
                    : "Ready to start?"}

                </Typography>


                <Typography className="timer-message-subtitle">

                  {isCheckedIn
                    ? "You're doing great!"
                    : "Check in to start your timer"}

                </Typography>

              </Box>

            </CardContent>

          </Card>


          {/* EMPLOYEE DETAILS */}

          <Card className="employee-details-card">

            <CardContent className="employee-details-content">

              <Box className="details-title">

                <PersonOutlineOutlinedIcon />

                <Typography>
                  Employee Details
                </Typography>

              </Box>


              <Box className="details-grid">

                {/* LEFT */}

                <Box className="details-column">

                  <DetailItem
                    icon={
                      <PersonOutlineOutlinedIcon />
                    }
                    label="Name"
                    value={
                      employee.name
                    }
                  />


                  <DetailItem
                    icon={
                      <BadgeOutlinedIcon />
                    }
                    label="Employee ID"
                    value={
                      employee.employeeId
                    }
                  />


                  <DetailItem
                    icon={
                      <BusinessCenterOutlinedIcon />
                    }
                    label="Department"
                    value={
                      employee.department
                    }
                  />

                </Box>


                <Divider
                  orientation="vertical"
                  flexItem
                  className="details-divider"
                />


                {/* RIGHT */}

                <Box className="details-column">

                  <DetailItem
                    icon={
                      <PersonOutlineOutlinedIcon />
                    }
                    label="Designation"
                    value={
                      employee.designation
                    }
                  />


                  <DetailItem
                    icon={
                      <EmailOutlinedIcon />
                    }
                    label="Email"
                    value={
                      employee.email
                    }
                  />


                  <DetailItem
                    icon={
                      <GroupsOutlinedIcon />
                    }
                    label="Reporting Manager"
                    value={
                      employee.reportingManager
                    }
                  />

                </Box>

              </Box>

            </CardContent>

          </Card>

        </Box>

      </Box>

    </Box>
  );
};


/* =========================================
   DETAIL ITEM
========================================= */

interface DetailItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}


const DetailItem = ({
  icon,
  label,
  value,
}: DetailItemProps) => {
  return (
    <Box className="detail-item">

      <Box className="detail-icon">
        {icon}
      </Box>


      <Box className="detail-text">

        <Typography className="detail-label">
          {label}
        </Typography>


        <Typography className="detail-value">
          {value}
        </Typography>

      </Box>

    </Box>
  );
};


export default EmployeeCheckInOut;