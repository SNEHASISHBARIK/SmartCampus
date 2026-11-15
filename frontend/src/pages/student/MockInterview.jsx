import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";
import "./MockInterview.css";
import InterviewResults from "./InterviewResults";

/* ─── constants ─── */
const INTERVIEW_DURATION = 15 * 60; // 15 minutes
const MAX_QUESTIONS = 8;

const STAGES = {
  SELECT_JOB: "select_job",
  SETUP: "setup",
  INTERVIEW: "interview",
  RESULTS: "results",
};

/* ─── helpers ─── */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}



const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

/* ─── component ─── */
export default function MockInterview() {
  /* stage */
  const [stage, setStage] = useState(STAGES.SELECT_JOB);

  /* job selection */
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  /* media */
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [mediaError, setMediaError] = useState("");

  /* interview state */
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INTERVIEW_DURATION);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const setError = setGenError;
  const [report, setReport] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentSpeechIdRef = useRef(0);
  const isInterviewActiveRef = useRef(false);

  /* ─── preload speech synthesis voices ─── */
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
  }, []);

  /* ─── silence and stop ALL speech immediately ─── */
  const silenceAllSpeech = useCallback(() => {
    currentSpeechIdRef.current += 1;
    isInterviewActiveRef.current = false;

    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        /* ignore */
      }
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch {
        /* ignore */
      }
    }

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }

    setIsSpeaking(false);
  }, []);

  /* ─── AI interviewer voice ─── */
  const speakQuestion = useCallback((question, onEnd) => {
    const speechId = currentSpeechIdRef.current;

    if (!("speechSynthesis" in window)) {
      setError("Speech is not supported in this browser. Please use Google Chrome.");
      if (onEnd) onEnd();
      return;
    }

    // Stop previous speech
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Select an available English voice
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      if (speechId !== currentSpeechIdRef.current) {
        window.speechSynthesis.cancel();
        return;
      }
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd && speechId === currentSpeechIdRef.current) onEnd();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd && speechId === currentSpeechIdRef.current) onEnd();
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
  }, [setError]);

  /* ─── Gemini TTS speech with fast browser fallback ─── */
  const speakWithGemini = useCallback(async (text, onEnd) => {
    if (!text?.trim()) {
      if (onEnd) onEnd();
      return;
    }

    // Stop previous audio / speech
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch {
        /* ignore */
      }
    }
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }

    const speechId = ++currentSpeechIdRef.current;
    setIsSpeaking(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Strict 1.5-second timeout: If TTS doesn't return quickly, switch immediately to browser speech
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch {
        /* ignore */
      }
    }, 1500);

    try {
      const ttsUrl = (
        import.meta.env.VITE_TTS_URL ||
        (import.meta.env.DEV ? "http://127.0.0.1:8002" : "")
      ).replace(/\/+$/, "");
      if (!ttsUrl) throw new Error("Speech service is not configured.");
      const response = await fetch(`${ttsUrl}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If user closed screen while waiting, discard response immediately
      if (speechId !== currentSpeechIdRef.current) return;

      if (!response.ok) {
        throw new Error(`Speech service returned HTTP ${response.status}`);
      }

      const audioBlob = await response.blob();
      if (speechId !== currentSpeechIdRef.current) return;

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        if (onEnd && speechId === currentSpeechIdRef.current) onEnd();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        if (speechId === currentSpeechIdRef.current) {
          speakQuestion(text, onEnd);
        }
      };

      await audio.play();
    } catch {
      clearTimeout(timeoutId);
      // If user closed or left interview screen, NEVER start speaking
      if (speechId !== currentSpeechIdRef.current) {
        return;
      }
      // Instant speech fallback
      speakQuestion(text, onEnd);
    }
  }, [speakQuestion]);

  /* results */
  const [feedback, setFeedback] = useState(null);

  /* ─── fetch jobs ─── */
  useEffect(() => {
    let cancelled = false;
    async function fetchJobs() {
      setJobsLoading(true);
      try {
        const res = await api.get("/placements?limit=50");
        const payload = res.data?.data ?? res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.placements ?? payload?.jobs ?? [];
        if (!cancelled) setJobs(list.filter((j) => j.isActive !== false));
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    }
    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── media setup ─── */
  const startMedia = useCallback(async () => {
    setMediaError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setMicReady(true);
    } catch (err) {
      setMediaError(
        "Camera or microphone access denied. Please allow permissions and try again."
      );
    }
  }, []);

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setMicReady(false);
  }, []);

  /* ─── fetch past interview history for progress tracking ─── */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get("/mock-interview/history");
      if (res.data?.attempts) {
        setHistory(res.data.attempts);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* clean up on unmount */
  useEffect(() => {
    return () => {
      silenceAllSpeech();
      stopMedia();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopMedia, silenceAllSpeech]);

  /* ─── generate questions via AI ─── */
  const generateQuestions = useCallback(async () => {
    if (!selectedJob) return;
    setGenerating(true);
    setGenError("");

    const skills =
      selectedJob.requirements?.join(", ") ||
      selectedJob.skills?.join(", ") ||
      "general skills";

    try {
      const res = await api.post("/placement-practice/generate", {
        job_role: selectedJob.title,
        difficulty: "Medium",
      });

      const payload = res.data?.data ?? res.data;
      let flat = [];

      /* grouped sections */
      const sections =
        payload?.sections ??
        payload?.test?.sections ??
        payload?.attempt?.sections;
      if (Array.isArray(sections)) {
        sections.forEach((sec) => {
          (sec.questions ?? []).forEach((q) => {
            flat.push(q.question ?? q.text ?? q);
          });
        });
      }

      /* flat questions */
      if (!flat.length) {
        const qs =
          payload?.questions ??
          payload?.test?.questions ??
          payload?.attempt?.questions;
        if (Array.isArray(qs)) {
          flat = qs.map((q) => q.question ?? q.text ?? q);
        }
      }

      /* fallback: build generic questions from job info */
      if (!flat.length) {
        flat = buildFallbackQuestions(selectedJob.title, skills);
      }

      /* pick up to MAX_QUESTIONS */
      const interviewQs = flat
        .filter((q) => typeof q === "string" && q.trim().length > 10)
        .slice(0, MAX_QUESTIONS);

      if (!interviewQs.length) {
        interviewQs.push(
          ...buildFallbackQuestions(selectedJob.title, skills)
        );
      }

      setQuestions(interviewQs);
      setAnswers(new Array(interviewQs.length).fill(""));
      setCurrentQIdx(0);
      setSecondsLeft(INTERVIEW_DURATION);
    } catch (err) {
      /* Use fallback questions when AI is unavailable */
      const fallback = buildFallbackQuestions(selectedJob.title, skills);
      setQuestions(fallback);
      setAnswers(new Array(fallback.length).fill(""));
      setCurrentQIdx(0);
      setSecondsLeft(INTERVIEW_DURATION);
      setGenError(
        "AI generation failed — using standard interview questions."
      );
    } finally {
      setGenerating(false);
    }
  }, [selectedJob]);

  function buildFallbackQuestions(title, skills) {
    return [
      `Tell me about yourself and why you are interested in the ${title} role.`,
      `What relevant skills and experience do you bring to this position?`,
      `Describe a challenging project you worked on. How did you handle obstacles?`,
      `How do you stay current with new technologies, especially ${skills}?`,
      `Can you walk me through your approach to solving a complex technical problem?`,
      `Where do you see yourself in five years if you join as a ${title}?`,
      `How do you handle feedback and constructive criticism from team members?`,
      `Do you have any questions about our team or the ${title} role?`,
    ];
  }

  /* ─── interview timer ─── */
  useEffect(() => {
    if (stage !== STAGES.INTERVIEW) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* ─── speech recognition ─── */
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    let final = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim = t;
      }
      setTranscript(final + interim);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
  }, []);

  /* ─── save answer & move on ─── */
  const saveAndNext = useCallback(() => {
    stopListening();
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentQIdx] = transcript || copy[currentQIdx];
      return copy;
    });

    if (currentQIdx + 1 < questions.length) {
      const nextIdx = currentQIdx + 1;
      setCurrentQIdx(nextIdx);
      setTranscript("");
      speakWithGemini(questions[nextIdx]);
    } else {
      finishInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQIdx, transcript, questions, stopListening, speakWithGemini]);

  /* ─── finish interview & trigger comprehensive AI evaluation ─── */
  const finishInterview = useCallback(async () => {
    silenceAllSpeech();
    stopListening();
    clearInterval(timerRef.current);
    stopMedia();
    setStage(STAGES.RESULTS);
    setEvaluating(true);

    const finalAnswers = [...answers];
    if (transcript && transcript.trim()) {
      finalAnswers[currentQIdx] = transcript.trim();
    }

    const qaPayload = questions.map((q, i) => ({
      question: q,
      answer: finalAnswers[i] || "",
    }));

    try {
      const res = await api.post("/mock-interview/evaluate", {
        jobId: selectedJob?._id,
        jobTitle: selectedJob?.title || "Software Developer",
        company: selectedJob?.company || "Placement Opportunity",
        skills: selectedJob?.requirements || selectedJob?.skills || [],
        questionsAndAnswers: qaPayload,
      });

      if (res.data?.report) {
        setReport(res.data.report);
      }
      fetchHistory();
    } catch (err) {
      console.warn("Evaluation API unavailable, generating local analysis:", err);
      // Fallback analysis to ensure student ALWAYS receives their complete performance report
      const answeredCount = finalAnswers.filter((a) => a && a.trim().length > 0).length;
      const totalQ = questions.length || 1;
      const score = Math.round((answeredCount / totalQ) * 100);

      const localReport = {
        jobTitle: selectedJob?.title || "Software Developer",
        company: selectedJob?.company || "Placement Opportunity",
        overallScore: score,
        categories: {
          technical: {
            score: Math.min(100, Math.max(35, score - 5)),
            recommendation: "Focus on deepening core concepts and architectural trade-offs.",
          },
          communication: {
            score: Math.min(100, Math.max(40, score + 5)),
            recommendation: "Practise structured delivery using the STAR format.",
          },
          problemSolving: {
            score: Math.min(100, Math.max(30, score)),
            recommendation: "Practise explaining reasoning out loud before concluding solutions.",
          },
          relevance: {
            score: Math.min(100, Math.max(45, score + 2)),
            recommendation: "Keep answers aligned with primary prompt requirements.",
          },
          confidence: {
            score: Math.min(100, Math.max(35, score - 2)),
            recommendation: "Prepare 2-3 project stories to eliminate pauses.",
          },
        },
        feedback: {
          summary: `You attempted ${answeredCount} of ${totalQ} questions for ${selectedJob?.title || "this role"}.`,
          strengths: [
            `Completed ${answeredCount} questions under interview timing constraints.`,
            "Demonstrated willingness to articulate answers in real-time speech.",
          ],
          weaknesses: [
            answeredCount < totalQ ? `${totalQ - answeredCount} questions were skipped.` : "Deepen technical implementation details.",
            "Incorporate measurable outcomes and metrics into project explanations.",
          ],
        },
        skillGaps: (selectedJob?.requirements || ["Technical Skills", "Problem Solving"]).map((s) => ({
          skill: s,
          assessment: score >= 70 ? "Good" : score >= 50 ? "Moderate" : "Needs Improvement",
          recommendedAction: `Practise targeted interview problems in ${s}.`,
        })),
        learningRoadmap: [
          { day: 1, activity: "Review core technical foundations", goal: "Strengthen essential concepts" },
          { day: 2, activity: "Solve 5 coding/database problems", goal: "Solidify problem solving" },
          { day: 3, activity: "Prepare STAR project deep-dive", goal: "Structure answers under 90s" },
          { day: 4, activity: "Practise behavioral questions", goal: "Improve vocal clarity" },
          { day: 5, activity: "Mini-project implementation", goal: "Practical hands-on proof" },
          { day: 6, activity: "Retake AI Mock Interview", goal: "Measure score improvement" },
          { day: 7, activity: "Final drive readiness review", goal: "Ensure placement confidence" },
        ],
        recommendedPriorities: [
          {
            priority: 1,
            area: "Technical Knowledge Depth",
            tasks: ["Revise core concepts", "Practise explaining architecture"],
          },
          {
            priority: 2,
            area: "Structured STAR Communication",
            tasks: ["Situation, Task, Action, Result", "Target 60-90 second answers"],
          },
          {
            priority: 3,
            area: "Problem Solving",
            tasks: ["Deconstruct problems out loud", "Highlight complexity trade-offs"],
          },
        ],
        questionsAndAnswers: qaPayload.map((item) => ({
          question: item.question,
          studentAnswer: item.answer || "(No answer recorded)",
          whatToImprove: item.answer ? "Anchor response with a concrete project example." : "Question was skipped. Practise explaining fundamentals.",
          strongerAnswer: "A strong response concisely outlines the core concept, shares a practical project implementation, and discusses trade-offs.",
        })),
        submittedAt: new Date().toISOString(),
      };
      setReport(localReport);
    } finally {
      setEvaluating(false);
    }
  }, [answers, currentQIdx, fetchHistory, questions, selectedJob, silenceAllSpeech, stopListening, stopMedia, transcript]);

  /* ─── start interview flow ─── */
  const beginInterview = useCallback(() => {
    silenceAllSpeech();
    isInterviewActiveRef.current = true;
    setStage(STAGES.INTERVIEW);

    const greeting = `Welcome to your mock interview for the ${selectedJob?.title} position. I'll ask you ${questions.length} questions. Take your time. Let's begin. ${questions[0]}`;
    speakWithGemini(greeting);
  }, [selectedJob, questions, speakWithGemini, silenceAllSpeech]);

  /* ─── render: job selection ─── */
  if (stage === STAGES.SELECT_JOB) {
    return (
      <div className="mock-interview">
        <div className="mock-interview__header">
          <div className="mock-interview__icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mock-interview__header-icon">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h2>AI Mock Interview</h2>
          <p className="mock-interview__subtitle">
            Practice realistic interviews powered by AI. Select a job to begin.
          </p>
        </div>

        {jobsLoading ? (
          <div className="mock-interview__loader">
            <div className="mock-interview__spinner" />
            <span>Loading available positions…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="mock-interview__empty">
            <p>No active job positions found. Please check back later.</p>
          </div>
        ) : (
          <div className="mock-interview__job-grid">
            {jobs.map((job) => (
              <button
                key={job._id}
                type="button"
                className={`mock-interview__job-card ${
                  selectedJobId === job._id ? "mock-interview__job-card--selected" : ""
                }`}
                onClick={() => setSelectedJobId(job._id)}
              >
                <div className="mock-interview__job-card-top">
                  <h3>{job.title}</h3>
                  <span className="mock-interview__company">{job.company}</span>
                </div>
                {job.location && (
                  <span className="mock-interview__location">📍 {job.location}</span>
                )}
                {(job.requirements?.length > 0 || job.skills?.length > 0) && (
                  <div className="mock-interview__skill-tags">
                    {(job.requirements || job.skills || []).slice(0, 4).map((s) => (
                      <span key={s} className="mock-interview__skill-tag">{s}</span>
                    ))}
                  </div>
                )}
                {selectedJobId === job._id && (
                  <span className="mock-interview__selected-badge">✓ Selected</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mock-interview__actions">
          <button
            type="button"
            className="mock-interview__btn mock-interview__btn--primary"
            disabled={!selectedJobId}
            onClick={async () => {
              await generateQuestions();
              setStage(STAGES.SETUP);
            }}
          >
            {generating ? (
              <>
                <span className="mock-interview__spinner mock-interview__spinner--sm" />
                Preparing interview…
              </>
            ) : (
              "Continue to Setup →"
            )}
          </button>
          {history.length > 0 && (
            <button
              type="button"
              className="mock-interview__btn mock-interview__btn--secondary"
              onClick={async () => {
                try {
                  const latestId = history[0]._id;
                  const res = await api.get(`/mock-interview/attempt/${latestId}`);
                  if (res.data?.report) {
                    setReport(res.data.report);
                    setStage(STAGES.RESULTS);
                  }
                } catch (err) {
                  console.warn("Could not load latest report:", err);
                }
              }}
            >
              📈 View Past Reports ({history.length})
            </button>
          )}
        </div>
        {genError && <p className="mock-interview__error">{genError}</p>}
      </div>
    );
  }

  /* ─── render: camera / mic setup ─── */
  if (stage === STAGES.SETUP) {
    return (
      <div className="mock-interview">
        <div className="mock-interview__header">
          <h2>Camera &amp; Microphone Setup</h2>
          <p className="mock-interview__subtitle">
            Enable your camera and microphone, then start the interview.
          </p>
        </div>

        <div className="mock-interview__setup-grid">
          {/* video preview */}
          <div className="mock-interview__video-box">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="mock-interview__video"
            />
            {!cameraReady && (
              <div className="mock-interview__video-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <span>Camera preview</span>
              </div>
            )}
          </div>

          {/* status checks */}
          <div className="mock-interview__checklist">
            <div className={`mock-interview__check-item ${cameraReady ? "mock-interview__check-item--ok" : ""}`}>
              <span className="mock-interview__check-icon">{cameraReady ? "✅" : "📷"}</span>
              Camera {cameraReady ? "Ready" : "Not connected"}
            </div>
            <div className={`mock-interview__check-item ${micReady ? "mock-interview__check-item--ok" : ""}`}>
              <span className="mock-interview__check-icon">{micReady ? "✅" : "🎤"}</span>
              Microphone {micReady ? "Ready" : "Not connected"}
            </div>
            <div className="mock-interview__check-item mock-interview__check-item--ok">
              <span className="mock-interview__check-icon">✅</span>
              {questions.length} questions prepared
            </div>

            {mediaError && (
              <p className="mock-interview__error">{mediaError}</p>
            )}

            <div className="mock-interview__setup-actions">
              {!cameraReady ? (
                <button
                  type="button"
                  className="mock-interview__btn mock-interview__btn--secondary"
                  onClick={startMedia}
                >
                  Enable Camera &amp; Mic
                </button>
              ) : (
                <button
                  type="button"
                  className="mock-interview__btn mock-interview__btn--primary"
                  onClick={beginInterview}
                >
                  🎬 Start Interview
                </button>
              )}
              <button
                type="button"
                className="mock-interview__btn mock-interview__btn--secondary"
                onClick={() =>
                  speakWithGemini(
                    "Hello! Welcome to your SmartCampus mock interview. Please introduce yourself."
                  )
                }
              >
                🔊 Test Interviewer Voice
              </button>
              <button
                type="button"
                className="mock-interview__btn mock-interview__btn--ghost"
                onClick={() => {
                  silenceAllSpeech();
                  stopMedia();
                  setStage(STAGES.SELECT_JOB);
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* job info */}
        {selectedJob && (
          <div className="mock-interview__job-summary">
            <strong>{selectedJob.title}</strong> at {selectedJob.company}
            {selectedJob.location && <span> · {selectedJob.location}</span>}
          </div>
        )}
      </div>
    );
  }

  /* ─── render: active interview ─── */
  if (stage === STAGES.INTERVIEW) {
    const progress = ((currentQIdx + 1) / questions.length) * 100;
    const isUrgent = secondsLeft < 120;

    return (
      <div className="mock-interview mock-interview--live">
        {/* top bar */}
        <div className="mock-interview__topbar">
          <div className="mock-interview__progress-wrap">
            <span>
              Question {currentQIdx + 1} / {questions.length}
            </span>
            <div className="mock-interview__progress-bar">
              <div
                className="mock-interview__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className={`mock-interview__timer ${isUrgent ? "mock-interview__timer--urgent" : ""}`}>
            🕐 {formatTime(secondsLeft)}
          </div>
        </div>

        {/* main layout */}
        <div className="mock-interview__live-grid">
          {/* video */}
          <div className="mock-interview__video-box mock-interview__video-box--live">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="mock-interview__video"
            />
            {isListening && (
              <div className="mock-interview__recording-indicator">
                <span className="mock-interview__rec-dot" />
                Listening…
              </div>
            )}
            {isSpeaking && (
              <div className="mock-interview__speaking-indicator">
                🔊 AI Interviewer is speaking…
              </div>
            )}
          </div>

          {/* Q&A panel */}
          <div className="mock-interview__qa-panel">
            <div className="mock-interview__question-bubble">
              <span className="mock-interview__q-label">Interviewer</span>
              <p>{questions[currentQIdx]}</p>
            </div>

            <div className="mock-interview__answer-area">
              <span className="mock-interview__a-label">Your Answer</span>
              <div className="mock-interview__transcript-box">
                {transcript || (
                  <span className="mock-interview__placeholder">
                    {isListening
                      ? "Speak now…"
                      : "Click the microphone to start recording your answer."}
                  </span>
                )}
              </div>
            </div>

            <div className="mock-interview__controls">
              {!isListening ? (
                <button
                  type="button"
                  className="mock-interview__btn mock-interview__btn--mic"
                  onClick={startListening}
                  disabled={isSpeaking}
                  title="Start recording"
                >
                  🎙️ Record Answer
                </button>
              ) : (
                <button
                  type="button"
                  className="mock-interview__btn mock-interview__btn--stop"
                  onClick={stopListening}
                  title="Stop recording"
                >
                  ⏹️ Stop Recording
                </button>
              )}

              <button
                type="button"
                className="mock-interview__btn mock-interview__btn--next"
                onClick={saveAndNext}
              >
                {currentQIdx + 1 < questions.length
                  ? "Next Question →"
                  : "Finish Interview"}
              </button>

              <button
                type="button"
                className="mock-interview__btn mock-interview__btn--end"
                onClick={finishInterview}
              >
                End Early
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── render: results ─── */
  if (stage === STAGES.RESULTS) {
    if (evaluating) {
      return (
        <div className="mock-interview">
          <div className="mock-interview__header">
            <h2>Analyzing Your Mock Interview…</h2>
            <p className="mock-interview__subtitle">
              Evaluating your technical depth, communication clarity, and generating your personalized improvement roadmap.
            </p>
          </div>
          <div className="mock-interview__loader" style={{ padding: "4rem 0" }}>
            <div className="mock-interview__spinner" style={{ width: "48px", height: "48px" }} />
            <span style={{ marginTop: "1rem", fontWeight: 600 }}>
              AI Coach is building your comprehensive Performance Report…
            </span>
          </div>
        </div>
      );
    }

    if (report) {
      return (
        <InterviewResults
          report={report}
          history={history}
          onRetake={() => {
            silenceAllSpeech();
            setStage(STAGES.SELECT_JOB);
            setReport(null);
            setQuestions([]);
            setAnswers([]);
            setCurrentQIdx(0);
            setTranscript("");
            setSecondsLeft(INTERVIEW_DURATION);
            setSelectedJobId("");
          }}
          onBackToJobs={() => {
            silenceAllSpeech();
            setStage(STAGES.SELECT_JOB);
            setReport(null);
          }}
        />
      );
    }
  }

  return null;
}
