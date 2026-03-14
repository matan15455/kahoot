import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./AICreateQuiz.css";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

export default function AICreateQuiz() {

  const { token } = useAuth();

  const [topic,setTopic] = useState("");
  const [difficulty,setDifficulty] = useState("medium");
  const [numQuestions,setNumQuestions] = useState(5);
  const [saving,setSaving] = useState(false);

  const [quiz,setQuiz] = useState(null);
  const [questions,setQuestions] = useState([]);
  const [loading,setLoading] = useState(false);
  const [success,setSuccess] = useState(false);

  const generateQuiz = async () => {

    if(loading) 
      return;

    if(!topic.trim())
      return alert("יש להזין נושא");

    try{

      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/ai/generate-quiz",
        { topic,difficulty,numQuestions }
      );

      setQuiz({
        title: res.data.title || topic,
        description: res.data.description || "AI quiz"
      });

      const generated = res.data.questions.map(q => ({
        text: q.text,
        type: "multiple-choice",
        time: 30,
        points: 1,
        answers: q.options.map((opt,i)=>({
          text: opt,
          isCorrect: i === q.correctIndex
        }))
      }));

      setQuestions(generated);

    }catch(err){
      console.error(err);
      alert("בעיה ביצירת החידון");
    }

    setLoading(false);
  };


  const updateQuestionField = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = field === "text" ? value : Number(value);
    setQuestions(updated);
  };


  const updateAnswer = (qIndex,aIndex,value)=>{
    const updated=[...questions];
    updated[qIndex].answers[aIndex].text=value;
    setQuestions(updated);
  };


  const updateCorrectAnswer = (qIndex,aIndex)=>{
    const updated=[...questions];

    updated[qIndex].answers =
      updated[qIndex].answers.map((a,i)=>({
        ...a,
        isCorrect:i===aIndex
      }));

    setQuestions(updated);
  };


  const handleSubmit = async () => {

    if(!quiz) return alert("חסר חידון");
    if(questions.length===0) return alert("אין שאלות");

    try{

      setSaving(true);

      await axios.post(
        "http://localhost:5000/quizzes",
        {
          ...quiz,
          questions
        },
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );

      
      setSuccess(true);
      setTimeout(()=>setSuccess(false),1000);

      setQuiz(null);
      setQuestions([]);

    }catch(err){
      console.error(err);
      alert("שגיאה בשמירה");
    }

    setSaving(false);

  };


  return (

    <div className="ai-page">

      <div className="ai-container">

        {success && (
          <Alert variant="outlined" severity="success">
             החידון נשמר בהצלחה
          </Alert>
        )}

        {!quiz ? (

          <div className="quiz-form-card">

            <h2>יצירת חידון עם AI</h2>

            <input
              className="quiz-input"
              placeholder="נושא החידון"
              value={topic}
              onChange={(e)=>setTopic(e.target.value)}
            />

            <div className="ai-row">

              <select
                className="quiz-input"
                value={difficulty}
                onChange={(e)=>setDifficulty(e.target.value)}
              >
                <option value="easy">קל</option>
                <option value="medium">בינוני</option>
                <option value="hard">קשה</option>
              </select>

              <input
                type="number"
                min="1"
                max="50"
                className="quiz-input"
                value={numQuestions}
                onChange={(e)=>setNumQuestions(Number(e.target.value))}
                placeholder="מספר שאלות"
              />

            </div>

            <button
              className="quiz-submit-btn"
              onClick={generateQuiz}
            >
              {loading ? "מייצר..." : "✨ צור חידון"}
            </button>

          </div>

        ) : (

          <>

            <h2 className="quiz-title">{quiz.title}</h2>

            <div className="questions-list">

              {questions.map((q,i)=>(

                <div className="question-card" key={i}>

                  <h3>שאלה {i+1}</h3>

                  <textarea
                    className="quiz-textarea"
                    value={q.text}
                    onChange={(e)=>updateQuestionField(i,"text",e.target.value)}
                  />

                  <div className="question-meta">

                  <div className="meta-item">
                    <label>שניות</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      className="quiz-input"
                      value={q.time}
                      onChange={(e)=>updateQuestionField(i,"time",e.target.value)}
                    />
                  </div>

                  <div className="meta-item">
                    <label>נקודות</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      className="quiz-input"
                      value={q.points}
                      onChange={(e)=>updateQuestionField(i,"points",e.target.value)}
                    />
                  </div>

                </div>

                  <div className="answers-list">

                    {q.answers.map((a,aIndex)=>(

                      <div key={aIndex} className="answer-row">

                        <input
                          className="quiz-input"
                          value={a.text}
                          onChange={(e)=>updateAnswer(i,aIndex,e.target.value)}
                        />

                        <input
                          type="radio"
                          name={`correct-${i}`}
                          checked={a.isCorrect}
                          onChange={()=>updateCorrectAnswer(i,aIndex)}
                        />

                      </div>

                    ))}

                  </div>

                </div>

              ))}

            </div>

            <button
              className="quiz-submit-btn"
              onClick={handleSubmit}
              disabled={saving}
            >

              {saving ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "שמור חידון"
              )}

            </button>

          </>

        )}

      </div>

    </div>

  );

}