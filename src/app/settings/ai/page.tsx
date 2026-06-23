'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { AiSettings } from '@/types';
import { Sparkles, Save, Key, Settings2 } from 'lucide-react';

export default function AiSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<Partial<AiSettings>>({
    provider: 'deepseek',
    model: 'deepseek-chat',
    auto_grade: true,
    auto_explain: false,
    temperature: 0.7,
    max_tokens: 1024,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data } = await apiFetch<any>('/api/ai-settings');
      if (data) {
        setSettings({
          provider: data.provider,
          api_key: data.api_key,
          api_endpoint: data.api_endpoint,
          model: data.model,
          auto_grade: data.auto_grade,
          auto_explain: data.auto_explain,
          temperature: data.temperature,
          max_tokens: data.max_tokens,
        });
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await apiFetch('/api/ai-settings', {
        method: 'PUT',
        body: settings,
      });
      if (error) throw new Error(error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Error saving AI settings:', err);
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || dataLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>;
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div className="page-header">
        <h1 className="page-title">AI 设置</h1>
        <p className="page-description">配置 AI 答题辅助功能</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={20} color="var(--primary)" /> 基本配置</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>AI 服务商</label>
          <select value={settings.provider || 'deepseek'} onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}>
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>API Key</label>
          <div style={{ position: 'relative' }}>
            <input type="password" placeholder="输入 API Key" value={settings.api_key || ''} onChange={(e) => setSettings({ ...settings, api_key: e.target.value })} />
            <Key size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>默认使用系统配置的 DeepSeek API Key，留空则使用系统默认</p>
        </div>
        {settings.provider === 'custom' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>自定义 API 端点</label>
            <input type="text" placeholder="https://api.example.com/v1" value={settings.api_endpoint || ''} onChange={(e) => setSettings({ ...settings, api_endpoint: e.target.value })} />
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>模型</label>
          <select value={settings.model || 'deepseek-chat'} onChange={(e) => setSettings({ ...settings, model: e.target.value })}>
            {settings.provider === 'deepseek' ? (<><option value="deepseek-chat">DeepSeek Chat</option><option value="deepseek-reasoner">DeepSeek Reasoner</option></>) : settings.provider === 'openai' ? (<><option value="gpt-4o">GPT-4o</option><option value="gpt-4o-mini">GPT-4o Mini</option></>) : <option value="custom-model">自定义模型</option>}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings2 size={20} color="var(--primary)" /> 功能设置</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0' }}>
            <input type="checkbox" checked={settings.auto_grade ?? true} onChange={(e) => setSettings({ ...settings, auto_grade: e.target.checked })} style={{ width: '1.125rem', height: '1.125rem' }} />
            <div><span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>自动批改</span><p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>对主观题自动进行 AI 批改和评分</p></div>
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0' }}>
            <input type="checkbox" checked={settings.auto_explain ?? false} onChange={(e) => setSettings({ ...settings, auto_explain: e.target.checked })} style={{ width: '1.125rem', height: '1.125rem' }} />
            <div><span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>自动解析</span><p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>答题后自动生成 AI 题目解析</p></div>
          </label>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings2 size={20} color="var(--primary)" /> 高级设置</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Temperature（随机性）</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="range" min="0" max="2" step="0.1" value={settings.temperature ?? 0.7} onChange={(e) => setSettings({ ...settings, temperature: Number(e.target.value) })} style={{ flex: 1 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '2.5rem', textAlign: 'right' }}>{settings.temperature?.toFixed(1)}</span>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Max Tokens</label>
          <select value={settings.max_tokens ?? 1024} onChange={(e) => setSettings({ ...settings, max_tokens: Number(e.target.value) })}>
            <option value={512}>512 tokens</option>
            <option value={1024}>1024 tokens</option>
            <option value={2048}>2048 tokens</option>
            <option value={4096}>4096 tokens</option>
          </select>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
        <Save size={18} /> {saving ? '保存中...' : saved ? '已保存' : '保存设置'}
      </button>
    </div>
  );
}
