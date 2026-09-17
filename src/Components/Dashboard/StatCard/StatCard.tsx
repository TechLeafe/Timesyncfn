import { Box, Typography } from "@mui/material";
import "./StatCard.css";
import leafImage from "../../../assets/StatCards/Leafe.png";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}

const StatCard = ({
  label,
  value,
  // icon,
  // trend,
  // trendDirection = "neutral",
}: StatCardProps) => {
  return (
    <Box className="stat-card">
      <Box className="stat-card__illustration" aria-hidden="true">
        <img
          src={leafImage}
          alt=""
          className="stat-card__leaves"
        />
      </Box>

      <Box className="stat-card__top">
        <Typography className="stat-card__label">{label}</Typography>

        {/* {icon && <Box className="stat-card__icon">{icon}</Box>} */}
      </Box>

      <Typography className="stat-card__value">{value}</Typography>

      {/* {trend && (
        <Typography
          className={`stat-card__trend stat-card__trend--${trendDirection}`}
        >
          {trend}
        </Typography>
      )} */}
    </Box>
  );
};

export default StatCard;
