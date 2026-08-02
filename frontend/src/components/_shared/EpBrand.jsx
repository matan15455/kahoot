import "./EpBrand.css";

export function EpLogo({ size = 32 }) {
  return (
    <span
      className="ep-logo"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.6,
        borderRadius: size * 0.28,
      }}
    >
      E
    </span>
  );
}

export function EpBrandMark({ small = false }) {
  return (
    <span className="ep-brandmark" style={{ fontSize: small ? 18 : 22 }}>
      <EpLogo size={small ? 26 : 32} />
      <span>EduPlay</span>
    </span>
  );
}

/* סמלים גיאומטריים — כל אחד משויך לצבע תשובה */
export function EpShape({ kind, size = 24, color = "currentColor" }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" };
  switch (kind) {
    case "burst":
      return (
        <svg {...props}>
          <path
            d="M12 2L13.5 9.5L21 8L15.5 13L21 18L13.5 16.5L12 24L10.5 16.5L3 18L8.5 13L3 8L10.5 9.5L12 2Z"
            fill={color}
          />
        </svg>
      );
    case "hex":
      return (
        <svg {...props}>
          <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" fill={color} />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path
            d="M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z"
            fill={color}
          />
        </svg>
      );
    case "wave":
      return (
        <svg {...props}>
          <path
            d="M2 12C5 6 8 18 12 12C16 6 19 18 22 12V18C19 24 16 12 12 18C8 24 5 12 2 18V12Z"
            fill={color}
          />
        </svg>
      );
    default:
      return null;
  }
}

/* מפת מטא לכל תשובה */
export const ANSWER_META = [
  { letter: "א", color: "var(--ep-ans-1)", inkColor: "var(--ep-ans-1-ink)", shape: "burst", textOn: "#fff" },
  { letter: "ב", color: "var(--ep-ans-2)", inkColor: "var(--ep-ans-2-ink)", shape: "hex",   textOn: "#fff" },
  { letter: "ג", color: "var(--ep-ans-3)", inkColor: "var(--ep-ans-3-ink)", shape: "plus",  textOn: "var(--ep-ink)" },
  { letter: "ד", color: "var(--ep-ans-4)", inkColor: "var(--ep-ans-4-ink)", shape: "wave",  textOn: "#0c2a2c" },
  { letter: "ה", color: "#9B59B6",         inkColor: "#6C3483",             shape: "burst", textOn: "#fff" },
  { letter: "ו", color: "#E67E22",         inkColor: "#A04000",             shape: "hex",   textOn: "#fff" },
  { letter: "ז", color: "#1ABC9C",         inkColor: "#0E6655",             shape: "plus",  textOn: "#fff" },
  { letter: "ח", color: "#E74C3C",         inkColor: "#922B21",             shape: "wave",  textOn: "#fff" },
];
