import React, { useState } from 'react';
import { getGeminiApiKey, setGeminiApiKey, isGeminiConfigured } from '../services/geminiClient';

export default function AiConfigModal({ isOpen, onClose }) {
  const [keyInput, setKeyInput] = useState(getGeminiApiKey());
  const [savedMessage, setSavedMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setGeminiApiKey(keyInput.trim());
    setSavedMessage('✅ Gemini API Key saved successfully!');
    setTimeout(() => {
      setSavedMessage('');
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setKeyInput('');
    setGeminiApiKey('');
    setSavedMessage('Key removed. App will use intelligent heuristic engine.');
    setTimeout(() => setSavedMessage(''), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Gemini AI Configuration</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Powers autonomous job drafting, mock interviews & screening
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0.2rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#0f172a' }}>
              Google Gemini API Key
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Paste your Gemini API Key (AIzaSy...)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
              }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              💡 Free Gemini API keys can be generated at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
                Google AI Studio ↗
              </a>
              . Your key is stored securely in your browser and used directly for live generation.
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: isGeminiConfigured() ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isGeminiConfigured() ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.82rem',
              color: isGeminiConfigured() ? '#15803d' : '#b45309',
            }}
          >
            <span>{isGeminiConfigured() ? '🟢' : '🟠'}</span>
            <span>
              {isGeminiConfigured()
                ? 'Gemini 1.5 Flash is active & verified for live generation.'
                : 'No key active. The app will use the built-in intelligent heuristic engine.'}
            </span>
          </div>

          {savedMessage && (
            <div className="alert alert-success" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              {savedMessage}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            {keyInput ? (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-outline-danger btn-sm"
              >
                Clear Key
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ padding: '0.45rem 1.25rem' }}
              >
                Save & Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
