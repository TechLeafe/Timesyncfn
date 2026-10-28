import { useState, type CSSProperties } from "react";

import {
  AutoAwesomeRounded,
  CakeRounded,
  CloseRounded,
} from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";

import birthdayPost from "../../assets/brithdaypost.png";

import "./BirthdayFooter.css";

interface StoredUser {
  name?: string;
  fullName?: string;
  employeeName?: string;
  firstName?: string;
}

const getEmployeeName = (): string => {
  try {
    const storedUser = localStorage.getItem("loggedInUser");
    if (!storedUser) return "Employee";

    const user = JSON.parse(storedUser) as StoredUser;
    return (
      user.name ||
      user.fullName ||
      user.employeeName ||
      user.firstName ||
      "Employee"
    );
  } catch {
    return "Employee";
  }
};

function BirthdayFooter() {
  const [posterOpen, setPosterOpen] = useState(false);
  const employeeName = getEmployeeName();
  const confettiPieces = [
    { x: -250, y: -170, rotate: 240 },
    { x: -190, y: 120, rotate: 420 },
    { x: -120, y: -230, rotate: 300 },
    { x: -50, y: 180, rotate: 510 },
    { x: 40, y: -190, rotate: 360 },
    { x: 100, y: 210, rotate: 480 },
    { x: 180, y: -140, rotate: 300 },
    { x: 250, y: 150, rotate: 540 },
    { x: -290, y: 10, rotate: 330 },
    { x: 290, y: -20, rotate: 450 },
    { x: -210, y: -100, rotate: 510 },
    { x: 210, y: 100, rotate: 390 },
    { x: -140, y: 200, rotate: 300 },
    { x: 145, y: -210, rotate: 480 },
    { x: -40, y: -250, rotate: 420 },
    { x: 45, y: 250, rotate: 540 },
    { x: -270, y: 175, rotate: 360 },
    { x: 270, y: -175, rotate: 510 },
    { x: -100, y: 70, rotate: 300 },
    { x: 110, y: -80, rotate: 450 },
  ];

  return (
    <footer
      className="birthday-footer"
      aria-label="Birthday wishes"
      onClick={(event) => {
        if (!event.currentTarget.contains(event.target as Node)) return;
        setPosterOpen(true);
      }}
    >
      <img
        className="birthday-footer-image"
        src={birthdayPost}
        alt="Birthday poster for Jerlin Renisa J, Application Developer"
      />

      <div className="birthday-footer-title">
        <span>Make today special</span>
        <strong>Happy Birthday!</strong>
      </div>

      <div className="birthday-footer-person">
        <strong>{employeeName}</strong>
        <span>Wishing you a wonderful year</span>
      </div>

      <div className="birthday-footer-message">
        Wishing you a day filled with happiness, success, and good health!
      </div>

      <div className="birthday-footer-sparkles" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <AutoAwesomeRounded key={index} />
        ))}
      </div>

      <button
        className="birthday-footer-button"
        type="button"
        aria-label="Open the birthday poster"
        onClick={(event) => {
          event.stopPropagation();
          setPosterOpen(true);
        }}
      >
        <span className="birthday-footer-mascot" aria-hidden="true">
          <span className="birthday-footer-mascot-arm" />
          <span className="birthday-footer-mascot-body" />
          <img src={birthdayPost} alt="" />
          <span className="birthday-footer-mascot-cake">
            <CakeRounded />
          </span>
        </span>
        <span className="birthday-footer-button-label">Open Birthday</span>
      </button>

      <CakeRounded
        className="birthday-footer-cake"
        aria-hidden="true"
      />

      <Dialog
        open={posterOpen}
        onClose={() => setPosterOpen(false)}
        className="birthday-poster-dialog"
        aria-label="Birthday poster"
        maxWidth={false}
      >
        <DialogContent className="birthday-poster-content">
          <IconButton
            className="birthday-poster-close"
            aria-label="Close birthday poster"
            onClick={() => setPosterOpen(false)}
          >
            <CloseRounded />
          </IconButton>
          <img
            className="birthday-poster-full-image"
            src={birthdayPost}
            alt="Happy birthday poster for Jerlin Renisa J, Application Developer"
          />
          <div className="birthday-poster-confetti" aria-hidden="true">
            {confettiPieces.map((piece, index) => (
              <span
                key={index}
                style={
                  {
                    "--burst-x": `${piece.x}px`,
                    "--burst-y": `${piece.y}px`,
                    "--burst-rotation": `${piece.rotate}deg`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}

export default BirthdayFooter;
