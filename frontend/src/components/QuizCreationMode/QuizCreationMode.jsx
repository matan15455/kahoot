import { useNavigate } from "react-router-dom";
import { EpShape } from "../_shared/EpBrand";
import "./QuizCreationMode.css";

export default function QuizCreationMode() {
  const navigate = useNavigate();

  return (
    <div className="ep-qcm">
      <div className="ep-qcm__inner">

        <header className="ep-qcm__head">
          <p className="ep-qcm__kicker">יצירת חידון</p>
          <h1 className="ep-qcm__title">
          בחר את מה שמתאים לך
          </h1>
          <p className="ep-qcm__sub">
        אפשר להתחיל ידני, או לתת לAI להציע
            לכם שאלות לנושא שאתם בוחרים.
          </p>
        </header>

        <div className="ep-qcm__cards">

          {/* ── ידני ── */}
          <article
            className="ep-qcm__card ep-qcm__card--manual"
            onClick={() => navigate("/create-manual")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/create-manual");
              }
            }}
          >
            <div className="ep-qcm__card-art" aria-hidden="true">
              <span className="ep-qcm__card-glyph">
                <EpShape kind="hex" size={56} color="var(--ep-ans-2)" />
              </span>
              <span className="ep-qcm__card-shadow"></span>
            </div>

            <div className="ep-qcm__card-body">
              <h2 className="ep-qcm__card-title">יצירה ידנית</h2>
              <p className="ep-qcm__card-desc">
                בנה את החידון שלך שאלה שאלה. שליטה מלאה בטקסט,
                בתשובות, בזמן ובניקוד של כל שאלה.
              </p>
            </div>

            <button
              className="ep-qcm__card-btn"
              tabIndex={-1}
              type="button"
            >
              <span>צור ידנית</span>
            </button>
          </article>

          {/*  AI  */}
          <article
            className="ep-qcm__card ep-qcm__card--ai"
            onClick={() => navigate("/create-ai")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/create-ai");
              }
            }}
          >

            <div className="ep-qcm__card-art" aria-hidden="true">
              <span className="ep-qcm__card-glyph">
                <EpShape kind="burst" size={56} color="var(--ep-ans-1)" />
              </span>
              <span className="ep-qcm__card-shadow ep-qcm__card-shadow--ai"></span>
            </div>

            <div className="ep-qcm__card-body">
              <h2 className="ep-qcm__card-title">יצירה עם AI</h2>
              <p className="ep-qcm__card-desc">
               בחר נושא והנחיות וה-AI ייצור בשבילך את השאלות
              </p>

              <ul className="ep-qcm__card-list">
                <li><span className="ep-qcm__check">✓</span> חיסכון משמעותי בזמן</li>
                <li><span className="ep-qcm__check">✓</span> ניסוח מקצועי</li>
                <li><span className="ep-qcm__check">✓</span> ניתן לערוך הכול</li>
              </ul>
            </div>

            <button
              className="ep-qcm__card-btn ep-qcm__card-btn--primary"
              tabIndex={-1}
              type="button"
            >
              <span>צור עם AI</span>
            </button>
          </article>
        </div>

      </div>
    </div>
  );
}
