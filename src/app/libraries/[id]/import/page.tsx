'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Upload, FileSpreadsheet, FileText, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ImportPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const id = params?.id as string;

  const [libraryName, setLibraryName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user && id) {
      apiFetch<any>(`/api/libraries?id=${id}`).then(({ data }) => {
        if (data) setLibraryName(data.name);
      });
    }
  }, [user, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        setPreview(jsonData.slice(0, 10));
      } catch (err) {
        console.error('Error parsing file:', err);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const detectColumn = (row: any, aliases: string[]): string => {
    for (const key of Object.keys(row)) {
      for (const alias of aliases) {
        if (key.toLowerCase().includes(alias)) return key;
      }
    }
    return '';
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;
    setImporting(true);
    let success = 0, failed = 0;
    const errors: string[] = [];

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          const questionCol = detectColumn(row, ['题目', '问题', 'question', '题干', '题']);
          const typeCol = detectColumn(row, ['类型', '题型', 'type']);
          const optionACol = detectColumn(row, ['选项A', '选项 a', 'a选项', 'a']);
          const optionBCol = detectColumn(row, ['选项B', '选项 b', 'b选项', 'b']);
          const optionCCol = detectColumn(row, ['选项C', '选项 c', 'c选项', 'c']);
          const optionDCol = detectColumn(row, ['选项D', '选项 d', 'd选项', 'd']);
          const answerCol = detectColumn(row, ['答案', '正确答案', 'answer', '正确']);
          const analysisCol = detectColumn(row, ['解析', '分析', '详解', 'explanation', 'analysis']);
          const difficultyCol = detectColumn(row, ['难度', 'difficulty']);
          const categoryCol = detectColumn(row, ['分类', '类别', 'category']);

          const questionText = row[questionCol] || '';
          if (!questionText) { failed++; errors.push(`第 ${i + 1} 行：缺少题目内容`); continue; }

          const options: string[] = [];
          if (optionACol && row[optionACol]) options.push(row[optionACol]);
          if (optionBCol && row[optionBCol]) options.push(row[optionBCol]);
          if (optionCCol && row[optionCCol]) options.push(row[optionCCol]);
          if (optionDCol && row[optionDCol]) options.push(row[optionDCol]);

          let qType = 'single';
          if (typeCol && row[typeCol]) {
            const typeStr = String(row[typeCol]);
            if (typeStr.includes('多')) qType = 'multiple';
            else if (typeStr.includes('判') || typeStr.includes('true') || typeStr.includes('false')) qType = 'true_false';
          }
          if (qType === 'true_false' || options.length === 0) options.push('正确', '错误');

          const rawAnswer = row[answerCol] ? String(row[answerCol]).trim() : '';
          let answer: string | string[] = rawAnswer;
          if (qType === 'multiple') answer = rawAnswer.split('').filter((c: string) => c >= 'A' && c <= 'Z');
          const difficulty = difficultyCol ? Math.min(5, Math.max(1, Number(row[difficultyCol]) || 3)) : 3;

          const questionContent = { type: qType, question: questionText, options };

          const { error } = await apiFetch(`/api/libraries/${id}/questions`, {
            method: 'POST',
            body: { question_content: questionContent, answer, analysis: analysisCol ? String(row[analysisCol] || '') : '', difficulty, tags: categoryCol && row[categoryCol] ? [String(row[categoryCol])] : [] }
          });
          if (error) { failed++; errors.push(`第 ${i + 1} 行：${error}`); } else success++;
        } catch (err: any) { failed++; errors.push(`第 ${i + 1} 行：${err.message}`); }
      }
      setResult({ success, failed, errors: errors.slice(0, 20) });
    } catch (err: any) {
      setResult({ success: 0, failed: preview.length, errors: [err.message] });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>;
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <Link href={`/libraries/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}><ArrowLeft size={18} /> 返回题库</Link>
      <div className="page-header">
        <h1 className="page-title">导入题目</h1>
        <p className="page-description">导入到：{libraryName}</p>
      </div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>上传文件</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>支持 .xlsx, .xls, .csv 格式。</p>
        <div style={{ border: '2px dashed var(--card-border)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: file ? '#f0fdf4' : '#f8fafc' }}
          onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: 'none' }} />
          {file ? (
            <div>
              <FileSpreadsheet size={48} style={{ margin: '0 auto 0.75rem', color: 'var(--success)' }} />
              <p style={{ fontWeight: 600 }}>{file.name}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <Upload size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>点击上传文件或拖拽到此区域</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>支持 .xlsx, .xls, .csv</p>
            </div>
          )}
        </div>
      </div>
      {preview.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>数据预览（前 {preview.length} 行）</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{Object.keys(preview[0]).map((key) => <th key={key} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', borderBottom: '2px solid var(--card-border)', fontWeight: 600, whiteSpace: 'nowrap' }}>{key}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((row: any, i) => (
                  <tr key={i}>{Object.values(row).map((val: any, j) => <td key={j} style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--card-border)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(val)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }} onClick={handleImport} disabled={importing}>
            {importing ? '导入中...' : `开始导入 ${preview.length} 条数据`}
          </button>
        </div>
      )}
      {result && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {result.success > 0 ? <Check size={24} color="var(--success)" /> : <AlertCircle size={24} color="var(--danger)" />}
            <div><h3 style={{ fontWeight: 600 }}>导入完成：成功 {result.success}，失败 {result.failed}</h3></div>
          </div>
          {result.errors.length > 0 && <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {result.errors.map((err, i) => <p key={i} style={{ fontSize: '0.8125rem', color: 'var(--danger)', padding: '0.25rem 0' }}>{err}</p>)}
          </div>}
          <Link href={`/libraries/${id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>查看题库</Link>
        </div>
      )}
    </div>
  );
}
