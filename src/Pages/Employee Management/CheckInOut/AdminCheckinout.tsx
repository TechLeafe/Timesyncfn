import { useEffect, useState } from "react";

import {
  Box,
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

import api from "../../../api/axiosInstance";

import "./AdminCheckinout.css";

/* =========================================
   TYPES
========================================= */

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

   HR / Admin only — lists every employee's
   check-in / check-out records for the day.
   Access to this page itself is gated by the
   route (ProtectedRoute allowedRoles=[HR, ADMIN]),
   so this component just renders the data.
========================================= */

const AdminCheckinout = () => {
  const [allRecords, setAllRecords] = useState<CheckInOutRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================
     FETCH ALL RECORDS
     GET /checkinout
  ========================================= */

  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/checkinout");

        console.log("All Check In/Out:", response.data);

        const data = response.data?.data ?? response.data;

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setAllRecords(records);
      } catch (err: any) {
        console.error("Check In/Out error:", err);

        setError(err.response?.data?.message || "Unable to load check-in/out data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllRecords();
  }, []);

  /* =========================================
     FORMAT DATE/TIME
  ========================================= */

  const formatDateTime = (value?: string) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  /* =========================================
     VIEW
  ========================================= */

  return (
    <Box sx={{ width: "100%", fontFamily: "var(--font-family)" }}>
      {/* PAGE TITLE */}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            backgroundColor: "#E8F5E9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1B6B33",
          }}
        >
          <AccessTimeOutlinedIcon />
        </Box>

        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1B6B33" }}>
            Employee Check In / Out
          </Typography>

          <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
            View employee check-in and check-out records.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Typography sx={{ mb: 2, color: "#D42B2B", fontSize: 13 }}>
          {error}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "14px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
              <TableCell>Employee</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Working Hours</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : allRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No check-in/out records found.
                </TableCell>
              </TableRow>
            ) : (
              allRecords.map((record, index) => (
                <TableRow key={record._id ?? `${record.employeeId}-${index}`} hover>
                  <TableCell>{record.name ?? record.employeeName ?? "-"}</TableCell>
                  <TableCell>{record.employeeId}</TableCell>
                  <TableCell>
                    {record.date ? new Date(record.date).toLocaleDateString("en-IN") : "-"}
                  </TableCell>
                  <TableCell>{formatDateTime(record.checkInTime ?? record.checkIn)}</TableCell>
                  <TableCell>{formatDateTime(record.checkOutTime ?? record.checkOut)}</TableCell>
                  <TableCell>{record.workingHours ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminCheckinout;
