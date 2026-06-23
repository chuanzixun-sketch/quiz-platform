'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Question, Library, QuizMode } from '@/types';
import { ArrowLeft, Check, X, ChevronLeft, ChevronRight, Send, RotateCcw, Clock } from 'lucide-react';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const id = params?.id as string;

  const [library, setLibrary] = useState<Library | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [quizMode, setQuizMode] = useState<QuizMode>('sequential');
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user && id) fetchData();
  }, [user, id]);

  useEffect(() => {
    if (timeLimit > 0 && timeRemaining > 0 && !showModeSelector && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current!); handleFinish(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLimit, timeRemaining, showModeSelector, isFinished]);

  const fetchData = async () => {
    try {
      const [libRes, qsRes] = await Promise.all([
        apiFetch<Library>(`/api/libraries?id=${id}`),
        apiFetch<Question[]>(`/api/libraries/${id}/questions`),
      ]);
      if (libRes.data) setLibrary(libRes.data);
      if (qsRes.data) setQuestions(qsRes.data);
    } catch (err) {
      console.error('Error fetching quiz data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const startQuiz = useCallback(() => {
    let processedQuestions = [...questions];
    if (quizMode === 'random') processedQuestions = processedQuestions.sort(() => Math.random() - 0.5);
    else if (quizMode === 'timed' && timeLimit > 0) setTimeRemaining(timeLimit * 60);
    setQuestions(processedQuestions);
    setShowModeSelector(false);
    setCurrentIndex(0);
    setAnswers({});
    setIsFinished(false);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
  }, [questions, quizMode, timeLimit]);

  const handleAnswer = (answer: string | string[]) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: answer }));
  };

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    let correct = 0;
    const total = questions.length;
    questions.forEach((q) => {
      const ua = answers[q.id];
      if (!ua) return;
      const ca = q.answer;
      if (Array.isArray(ca) && Array.isArray(ua)) {
        const sc = [...ca].sort(), su = [...ua].sort();
        if (sc.length === su.length && sc.every((v, i) => v === su[i])) correct++;
      } else if (ca === ua) correct++;
    });
    setScore({ correct, total });
    setIsFinished(true);

    if (user && Object.keys(answers).length > 0) {
      const attempts = Object.entries(answers)
        .filter(([_, v]) => v !== undefined)
        .map(([qid, ua]) => {
          const q = questions.find((q) => q.id === qid);
          const ca = q?.answer;
          let isCorrect = false;
          if (Array.isArray(ca) && Array.isArray(ua)) {
            isCorrect = [...ca].sort().join() === [...ua].sort().join();
          } else isCorrect = ca === ua;
          return { question_id: qid, library_id: id, user_answer: ua, is_correct: isCorrect };
        });
      await apiFetch('/api/attempts', { method: 'POST', body: { attempts } });
      const correctCount = attempts.filter((a) => a.is_correct).length;
      await apiFetch('/api/study-sessions', {
        method: 'POST',
        body: { library_id: id, questions_answered: attempts.length, correct_count: correctCount, duration_minutes: timeLimit > 0 ? Math.ceil((timeLimit * 60 - timeRemaining) / 60) : 0 }
      });
    }
    setSubmitting(false);
    setShowResult(true);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const currentQuestion = questions[currentIndex];

  if (loading || dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>;
  }

  if (!library) {
    return <div className="empty-state"><h3>题库不存在</h3><Link href="/libraries" className="btn btn-primary" style={{ marginTop: '1rem' }}>返回题库列表</Link></div>;
  }

  if (showModeSelector) {
    return (
      <div style={{ maxWidth: '560px', margin: '2rem auto' }}>
        <Link href={`/libraries/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}><ArrowLeft size={18} /> 返回题库</Link>
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{library.name}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>共 {questions.length} 道题目 · 选择刷题模式</p>
          {questions.length === 0 ? (
            <div className="empty-state"><h3>题库为空</h3><p>请先在题库中添加题目</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {[
                  { mode: 'sequential' as QuizMode, label: '顺序练习', desc: '按顺序逐题作答，适合系统学习' },
                  { mode: 'random' as QuizMode, label: '随机练习', desc: '随机出题，适合检验掌握程度' },
                  { mode: 'timed' as QuizMode, label: '限时挑战', desc: '设定时间限制，模拟考试环境' },
                ].map((opt) => (
                  <label key={opt.mode} className={`quiz-option ${quizMode === opt.mode ? 'selected' : ''}`} style={{ padding: '1rem' }}>
                    <input type="radio" name="quizMode" value={opt.mode} checked={quizMode === opt.mode} onChange={() => setQuizMode(opt.mode)} style={{ display: 'none' }} />
                    <div><div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{opt.label}</div><div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{opt.desc}</div></div>
                  </label>
                ))}
              </div>
              {quizMode === 'timed' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>时间限制（分钟）</label>
                  <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}>
                    <option value={5}>5 分钟</option>
                    <option value={10}>10 分钟</option>
                    <option value={15}>15 分钟</option>
                    <option value={30}>30 分钟</option>
                    <option value={60}>60 分钟</option>
                  </select>
                </div>
              )}
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={startQuiz}>开始刷题</button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isFinished && showResult) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div style={{ maxWidth: '560px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: pct >= 80 ? '#f0fdf4' : pct >= 60 ? '#fffbeb' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            {pct >= 80 ? <Check size={40} color="var(--success)" /> : <X size={40} color="var(--danger)" />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{pct >= 80 ? '太棒了！' : pct >= 60 ? '继续加油！' : '需要更多练习'}</h2>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{score.correct}/{score.total}</div>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>正确率 {pct}%</p>
          <div className="progress-bar" style={{ marginBottom: '2rem' }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => { setShowModeSelector(true); setShowResult(false); }}><RotateCcw size={18} /> 重新开始</button>
            <Link href={`/libraries/${id}`} className="btn btn-primary">返回题库</Link>
            <Link href="/wrong" className="btn btn-secondary">查看错题</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const userAnswer = answers[currentQuestion.id];
  const correctAnswer = currentQuestion.answer;

  const renderQuestionContent = () => {
    const q = currentQuestion.question_content;
    if (q.type === 'single' || q.type === 'true_false') {
      const options = q.type === 'true_false' ? ['正确', '错误'] : q.options || [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {options.map((opt, i) => {
            const letter = q.type === 'true_false' ? opt : String.fromCharCode(65 + i);
            return (
              <div key={i} className={`quiz-option ${userAnswer === opt || userAnswer === letter ? 'selected' : ''}`} onClick={() => handleAnswer(q.type === 'true_false' ? opt : letter)} style={{ cursor: 'pointer' }}>
                <span style={{ fontWeight: 600, minWidth: '1.5rem' }}>{q.type === 'true_false' ? '' : String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </div>
            );
          })}
        </div>
      );
    }
    if (q.type === 'multiple') {
      const selected = (Array.isArray(userAnswer) ? userAnswer : []) as string[];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(q.options || []).map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <div key={i} className={`quiz-option ${selected.includes(letter) ? 'selected' : ''}`} onClick={() => {
                const newSelected = selected.includes(letter) ? selected.filter((s) => s !== letter) : [...selected, letter];
                handleAnswer(newSelected);
              }} style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.includes(letter)} readOnly style={{ width: '1rem', height: '1rem' }} />
                <span style={{ fontWeight: 600, minWidth: '1.5rem' }}>{letter}.</span>
                <span>{opt}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link href={`/libraries/${id}`} className="btn btn-ghost btn-sm"><ArrowLeft size={18} /> 退出</Link>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '0.25rem' }}>{library.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>第 {currentIndex + 1}/{questions.length} 题</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {timeLimit > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: timeRemaining < 60 ? 'var(--danger)' : 'var(--foreground)' }}><Clock size={16} />{formatTime(timeRemaining)}</div>}
          <button className="btn btn-primary btn-sm" onClick={handleFinish} disabled={submitting}><Send size={16} /> 交卷</button>
        </div>
      </div>
      <div className="progress-bar" style={{ marginBottom: '2rem' }}>
        <div className="progress-fill" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%`, background: 'var(--primary)' }} />
      </div>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="badge badge-primary">{currentQuestion.question_content.type === 'single' ? '单选题' : currentQuestion.question_content.type === 'multiple' ? '多选题' : currentQuestion.question_content.type === 'true_false' ? '判断题' : '题目'}</span>
            <span className={`badge badge-${currentQuestion.difficulty <= 2 ? 'success' : currentQuestion.difficulty <= 3 ? 'warning' : 'danger'}`}>{currentQuestion.difficulty <= 2 ? '简单' : currentQuestion.difficulty <= 3 ? '中等' : '困难'}</span>
          </div>
          <p style={{ fontSize: '1.125rem', lineHeight: 1.7, fontWeight: 500 }}>{currentQuestion.question_content.question}</p>
        </div>
        {renderQuestionContent()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))} disabled={currentIndex === 0}><ChevronLeft size={18} /> 上一题</button>
        {currentIndex < questions.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setCurrentIndex((p) => p + 1)}>下一题 <ChevronRight size={18} /></button>
        ) : (
          <button className="btn btn-success" onClick={handleFinish} disabled={submitting}><Send size={18} /> 完成答题</button>
        )}
      </div>
    </div>
  );
}
