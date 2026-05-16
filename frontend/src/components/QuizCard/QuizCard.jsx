import { useNavigate } from "react-router-dom";
import { EpShape, ANSWER_META } from "../_shared/EpBrand";
import "./QuizCard.css";

export default function QuizCard({ quiz, colorIndex = 0 }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/create-room?quizId=${quiz._id}`);
  };

  // צבע/צורה דטרמיניסטיים — כל חידון מקבל זהות ויזואלית עקבית
  const meta = ANSWER_META[colorIndex % ANSWER_META.length];
  const questionCount = quiz.questions?.length || 0;

  return (
    <article
      className={"ep-qcard ep-qcard--" + (colorIndex % ANSWER_META.length)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* פס צבע עליון עם צורה גיאומטרית — מזהה ויזואלי */}
      <div
        className="ep-qcard__band"
        style={{
          background: meta.color,
          color: meta.textOn,
        }}
      >
        <span className="ep-qcard__band-tag">
          {questionCount} {questionCount === 1 ? "שאלה" : "שאלות"}
        </span>
        <span className="ep-qcard__band-glyph" aria-hidden="true">
          <EpShape kind={meta.shape} size={26} />
        </span>
        <span className="ep-qcard__band-bg" aria-hidden="true">
          <EpShape kind={meta.shape} size={180} />
        </span>
      </div>

      {/* גוף הכרטיס */}
      <div className="ep-qcard__body">
        <h3 className="ep-qcard__title">{quiz.title}</h3>
        <p className="ep-qcard__desc">
          {quiz.description ? quiz.description : "ללא תיאור"}
        </p>

        <div className="ep-qcard__foot">
          <span className="ep-qcard__action">
            <span>הפעל חדר</span>
            <span className="ep-qcard__arrow" aria-hidden="true">←</span>
          </span>
        </div>
      </div>
    </article>
  );
}
