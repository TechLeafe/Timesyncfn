
import "./ClassicSpinner.css";

function ClassicSpinner() {
  return (
    <span
      className="classic-spinner"
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="classic-spinner-spoke"
          style={{
            transform: `rotate(${index * 30}deg) translate(146%)`,
            animationDelay: `${-((12 - index) * 1.2) / 12}s`,
          }}
        />
      ))}
    </span>
  );
}

export default ClassicSpinner;
