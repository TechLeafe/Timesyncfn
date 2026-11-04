import { useState, type CSSProperties } from "react";

import {
  AutoAwesomeRounded,
  CloseRounded,
  LocalFireDepartmentRounded,
} from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";

import "./BirthdayFooter.css";

function BirthdayFooter() {
  const [posterOpen, setPosterOpen] = useState(false);
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
      aria-label="Diwali celebration"
      onClick={(event) => {
        if (!event.currentTarget.contains(event.target as Node)) return;
        setPosterOpen(true);
      }}
    >
      <img
        className="birthday-footer-image"
        src="/calendar-icons/deepavali.png"
        alt="Diwali illustration with fireworks and traditional lamps"
      />

      <div className="birthday-footer-title">
        <span>Celebrate the Festival of Lights</span>
        <strong>Happy Diwali!</strong>
      </div>

      <div className="birthday-footer-person">
        <strong>Wishing you joy and prosperity</strong>
        <span>May your days shine bright</span>
      </div>

      <div className="birthday-footer-message">
        May this Diwali fill your home with happiness, light, and prosperity. Wishing you and your loved ones a joyful celebration!
      </div>

      <div className="birthday-footer-sparkles" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <AutoAwesomeRounded key={index} />
        ))}
      </div>

      <button
        className="birthday-footer-button"
        type="button"
        aria-label="Open the Diwali celebration"
        onClick={(event) => {
          event.stopPropagation();
          setPosterOpen(true);
        }}
      >
        <span className="birthday-footer-mascot" aria-hidden="true">
          <span className="birthday-footer-diya">
            <LocalFireDepartmentRounded />
          </span>
        </span>
        <span className="birthday-footer-button-label">Celebrate Diwali</span>
      </button>

      <LocalFireDepartmentRounded
        className="birthday-footer-cake"
        aria-hidden="true"
      />

      <Dialog
        open={posterOpen}
        onClose={() => setPosterOpen(false)}
        className="birthday-poster-dialog"
        aria-label="Diwali celebration"
        maxWidth={false}
      >
        <DialogContent className="birthday-poster-content">
          <IconButton
            className="birthday-poster-close"
            aria-label="Close Diwali celebration"
            onClick={() => setPosterOpen(false)}
          >
            <CloseRounded />
          </IconButton>
          <img
            className="birthday-poster-full-image"
            src="/calendar-icons/deepavali.png"
            alt="Diwali illustration with families, fireworks, and traditional lamps"
          />
          <div className="diwali-popup-message">
            <strong lang="ta">தீபாவளிப் பரிசு காத்திருக்கிறது!!!</strong>
            <p>
              Tomorrow, we are celebrating Diwali at our office! 🎁 Exciting
              gifts and surprises are waiting for everyone. Get ready for a
              joyful celebration!
            </p>
          </div>
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
