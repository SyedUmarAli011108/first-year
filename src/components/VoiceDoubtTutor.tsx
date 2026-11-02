import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Send,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { SubjectName } from '../types/study';
import { SUBJECT_META_MAP } from '../data/studyData';

interface VoiceDoubtTutorProps {
  subject: SubjectName;
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function VoiceDoubtTutor({ subject }: VoiceDoubtTutorProps) {
  const { activeNote } = useNotes();
  const meta = SUBJECT_META_MAP[subject];

  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const [userTranscript, setUserTranscript] = useState<string>('');
  const [tutorTranscript, setTutorTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [textVoiceInput, setTextVoiceInput] = useState<string>('');

  // Audio Context & WebSocket Refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(false);

  isMutedRef.current = isMuted;

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live?subject=${encodeURIComponent(
      subject
    )}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnecting(false);
      setIsCalling(true);
      setConnectionStatus('listening');

      // Send initial notes setup text if available
      if (activeNote) {
        const introNotePayload = {
          text: `[SYSTEM: Ground your answers in the student's study note "${activeNote.title}": ${activeNote.content.slice(
            0,
            2000
          )}]`,
        };
        ws.send(JSON.stringify(introNotePayload));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setErrorMessage(data.error);
          setConnectionStatus('error');
          return;
        }

        if (data.inputTranscript) {
          setUserTranscript((prev) => `${prev} ${data.inputTranscript}`);
        }

        if (data.outputTranscript) {
          setTutorTranscript((prev) => `${prev} ${data.outputTranscript}`);
          setConnectionStatus('speaking');
        }

        if (data.text) {
          setTutorTranscript((prev) => `${prev} ${data.text}`);
        }

        if (data.audio && outputAudioCtxRef.current) {
          setConnectionStatus('speaking');
          playAudioChunk(data.audio);
        }

        if (data.interrupted) {
          stopAllQueuedAudio();
          setConnectionStatus('listening');
        }

        if (data.status === 'session_closed') {
          stopVoiceCall();
        }
      } catch (e) {
        console.error('Error handling live message:', e);
      }
    };

    ws.onerror = (err) => {
      console.warn('WebSocket Live API connection notice:', err);
      setErrorMessage(
        'Live API streaming connection closed. You can speak or type your doubt below, or tap a suggested topic.'
      );
      setConnectionStatus('error');
      stopVoiceCall();
    };

    ws.onclose = () => {
      setIsCalling(false);
      setIsConnecting(false);
      if (connectionStatus !== 'error') {
        setConnectionStatus('idle');
      }
    };

    return ws;
  };

  const startVoiceCall = async () => {
    setErrorMessage(null);
    setMicPermissionDenied(false);
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setUserTranscript('');
    setTutorTranscript('');

    // Setup Output AudioContext (24kHz as per Gemini Live API specification)
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const outputCtx = new AudioCtx({ sampleRate: 24000 });
    outputAudioCtxRef.current = outputCtx;
    nextStartTimeRef.current = outputCtx.currentTime;

    // Connect WebSocket
    const ws = connectWebSocket();

    // Try to get microphone stream
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        mediaStreamRef.current = stream;

        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        inputAudioCtxRef.current = inputCtx;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current) {
            setAudioLevel(0);
            return;
          }

          const channelData = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sum / channelData.length);
          setAudioLevel(Math.min(100, Math.round(rms * 400)));

          if (ws.readyState === WebSocket.OPEN) {
            const pcm16Buffer = floatTo16BitPCM(channelData);
            const base64Audio = arrayBufferToBase64(pcm16Buffer);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      } else {
        setMicPermissionDenied(true);
      }
    } catch (err: any) {
      console.warn('Microphone permission not granted or unavailable:', err);
      setMicPermissionDenied(true);
      // We keep the voice session running so the student can still talk via text & hear the Live Voice Tutor!
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    try {
      const buffer = base64ToArrayBuffer(base64Audio);
      const pcm16 = new Int16Array(buffer);
      const float32 = new Float32Array(pcm16.length);

      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      const startAt = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startAt);
      nextStartTimeRef.current = startAt + audioBuffer.duration;

      scheduledSourcesRef.current.push(source);
      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source);
        if (scheduledSourcesRef.current.length === 0) {
          setConnectionStatus('listening');
        }
      };
    } catch (e) {
      console.error('Error playing 24kHz audio chunk:', e);
    }
  };

  const stopAllQueuedAudio = () => {
    scheduledSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    scheduledSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  };

  const interruptTutor = () => {
    stopAllQueuedAudio();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: '[Student interrupted]' }));
    }
    setConnectionStatus('listening');
  };

  const sendSpokenPrompt = async (textPrompt: string) => {
    const prompt = textPrompt.trim();
    if (!prompt) return;

    setUserTranscript((prev) => (prev ? `${prev}\n• ${prompt}` : `• ${prompt}`));
    setTextVoiceInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: prompt }));
    } else {
      // Graceful fallback: Ask Gemini AI tutor via HTTP and speak aloud with SpeechSynthesis
      setConnectionStatus('speaking');
      try {
        const notesContext = activeNote
          ? `NOTE TITLE: ${activeNote.title} (${activeNote.subject})\n${activeNote.content}`
          : '';
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            subject: meta.fullLabel,
            notesContext,
            model: 'gemini-3.8-flash',
          }),
        });

        const rawText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(rawText);
        } catch {}

        if (!res.ok) {
          throw new Error(data.error || `Spoken query failed with status ${res.status}`);
        }

        const reply = data.reply || '';
        setTutorTranscript((prev) => (prev ? `${prev}\n\n${reply}` : reply));

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const cleanText = reply.replace(/[*#`_$\\]/g, ' ');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.onend = () => setConnectionStatus('idle');
          utterance.onerror = () => setConnectionStatus('idle');
          window.speechSynthesis.speak(utterance);
        } else {
          setConnectionStatus('idle');
        }
      } catch (err: any) {
        console.error('Spoken answer error:', err);
        setErrorMessage(err?.message || 'Could not fetch spoken answer.');
        setConnectionStatus('idle');
      }
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type or tap a sample topic.');
      return;
    }

    try {
      setErrorMessage(null);
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      setIsRecognizing(true);
      rec.onstart = () => setIsRecognizing(true);
      rec.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript;
        if (spoken) {
          sendSpokenPrompt(spoken);
        }
        setIsRecognizing(false);
      };
      rec.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e);
        setIsRecognizing(false);
        if (e.error === 'not-allowed') {
          setMicPermissionDenied(true);
        }
      };
      rec.onend = () => setIsRecognizing(false);
      rec.start();
    } catch (e: any) {
      console.warn('Recognition start exception:', e);
      setIsRecognizing(false);
    }
  };

  const stopVoiceCall = () => {
    stopAllQueuedAudio();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        const p = inputAudioCtxRef.current.close();
        if (p && typeof (p as any).catch === 'function') {
          (p as any).catch(() => {});
        }
      } catch {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        const p = outputAudioCtxRef.current.close();
        if (p && typeof (p as any).catch === 'function') {
          (p as any).catch(() => {});
        }
      } catch {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setIsCalling(false);
    setIsConnecting(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      stopVoiceCall();
    };
  }, [subject]);

  return (
    <div className="space-y-6">
      {/* Voice Status & Live Session Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-6">
        <div className="flex flex-col items-center justify-center">
          {/* Animated Avatar / Audio Ring */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-4">
            {isCalling && (
              <span
                className={`absolute inset-0 rounded-full transition-all duration-150 ${
                  connectionStatus === 'speaking'
                    ? 'bg-blue-100 animate-ping opacity-30'
                    : 'bg-emerald-100 opacity-20'
                }`}
                style={{
                  transform: `scale(${1 + audioLevel / 120})`,
                }}
              />
            )}

            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isCalling
                  ? connectionStatus === 'speaking'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-100'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-2 border-dashed border-slate-300'
              }`}
            >
              <Mic className="w-10 h-10 stroke-[2.2]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCalling
                    ? connectionStatus === 'speaking'
                      ? 'bg-blue-600 animate-pulse'
                      : 'bg-emerald-600 animate-pulse'
                    : 'bg-slate-300'
                }`}
              />
              <h3 className="text-lg font-bold text-slate-900">
                {isCalling
                  ? connectionStatus === 'speaking'
                    ? 'Tutor Speaking Spoken Audio...'
                    : 'Listening to You...'
                  : isConnecting
                  ? 'Connecting to Live API...'
                  : 'Live Voice Doubt Tutor'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Model: <strong className="text-blue-600">gemini-3.8-live</strong> · 24kHz Spoken Response
            </p>
          </div>
        </div>

        {/* Grounded Notes Indicator */}
        {activeNote && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Voice Context: <strong className="text-slate-800">{activeNote.title}</strong>
            </span>
          </div>
        )}

        {/* Audio Waveform Simulation Bar */}
        {isCalling && (
          <div className="flex items-center justify-center gap-1.5 h-8">
            {[20, 45, 75, 95, 60, 85, 40, 65, 30, 90, 50, 70].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  connectionStatus === 'speaking'
                    ? 'bg-blue-600'
                    : audioLevel > 10
                    ? 'bg-emerald-600'
                    : 'bg-slate-200'
                }`}
                style={{
                  height: `${Math.max(
                    6,
                    Math.min(32, (h * (connectionStatus === 'speaking' ? 0.8 : audioLevel / 40)))
                  )}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Mic Permission Guidance Note if browser blocked mic */}
        {micPermissionDenied && isCalling && (
          <div className="max-w-md mx-auto p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Microphone Access Blocked</span>
            </div>
            <p className="text-amber-800">
              Your browser or iframe blocked microphone access. Click the <strong>lock icon</strong> in your browser address bar to allow microphone.
            </p>
            <p className="text-amber-700 font-medium">
              You can still speak with the tutor by typing below or tapping a question to hear spoken audio!
            </p>
          </div>
        )}

        {/* Live Call & Voice Recognition Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isCalling ? (
            <>
              <button
                type="button"
                disabled={isConnecting}
                onClick={startVoiceCall}
                className="min-h-[50px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting Live API...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    <span>Live Voice Call</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={startSpeechRecognition}
                disabled={isRecognizing}
                className={`min-h-[50px] px-5 py-3 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isRecognizing
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Mic className={`w-4 h-4 ${isRecognizing ? 'text-rose-600' : 'text-blue-600'}`} />
                <span>{isRecognizing ? 'Listening to your speech...' : 'Speak Question (Mic)'}</span>
              </button>
            </>
          ) : (
            <>
              {/* Mute Toggle */}
              {!micPermissionDenied && (
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className={`min-h-[46px] px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    isMuted
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-amber-600" /> : <Mic className="w-4 h-4" />}
                  <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                </button>
              )}

              {/* Interrupt Tutor */}
              <button
                type="button"
                onClick={interruptTutor}
                className="min-h-[46px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Radio className="w-4 h-4 text-blue-600" />
                <span>Interrupt Tutor</span>
              </button>

              {/* End Call */}
              <button
                type="button"
                onClick={stopVoiceCall}
                className="min-h-[46px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </>
          )}
        </div>

        {/* In-Call Text Prompt (works always, especially when mic is blocked) */}
        {isCalling && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendSpokenPrompt(textVoiceInput);
            }}
            className="max-w-lg mx-auto flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={textVoiceInput}
              onChange={(e) => setTextVoiceInput(e.target.value)}
              placeholder="Ask a question to hear Live Voice Tutor speak..."
              className="flex-1 min-h-[42px] px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textVoiceInput.trim()}
              className="min-h-[42px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Spoken Transcription Stream Card */}
      {(userTranscript || tutorTranscript) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Real-Time Speech Transcription
          </h4>

          {userTranscript && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm">
              <span className="font-semibold text-slate-900 block mb-0.5">You:</span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{userTranscript}</p>
            </div>
          )}

          {tutorTranscript && (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs sm:text-sm">
              <span className="font-semibold text-blue-900 block mb-0.5">
                StudyBuddy Live Tutor:
              </span>
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{tutorTranscript}</p>
            </div>
          )}
        </div>
      )}

      {/* Suggested Spoken Questions */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
        <h4 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Tap to ask out loud in {meta.fullLabel}:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
          <button
            type="button"
            onClick={() => {
              if (!isCalling) startVoiceCall();
              setTimeout(() => sendSpokenPrompt('Can you explain why the SHE electrode is assigned 0.00 V?'), 800);
            }}
            className="p-2.5 bg-white hover:bg-blue-50/60 rounded-lg border border-slate-200 text-left transition-colors cursor-pointer"
          >
            &ldquo;Can you explain why the SHE electrode is assigned 0.00 V?&rdquo;
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isCalling) startVoiceCall();
              setTimeout(() => sendSpokenPrompt('What is the chemical difference between primary and secondary batteries?'), 800);
            }}
            className="p-2.5 bg-white hover:bg-blue-50/60 rounded-lg border border-slate-200 text-left transition-colors cursor-pointer"
          >
            &ldquo;What is the chemical difference between primary and secondary batteries?&rdquo;
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isCalling) startVoiceCall();
              setTimeout(() => sendSpokenPrompt('How does pointer arithmetic work in C when swapping two numbers?'), 800);
            }}
            className="p-2.5 bg-white hover:bg-blue-50/60 rounded-lg border border-slate-200 text-left transition-colors cursor-pointer"
          >
            &ldquo;How does pointer arithmetic work in C when swapping two numbers?&rdquo;
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isCalling) startVoiceCall();
              setTimeout(() => sendSpokenPrompt('What are the 7 Cs of effective technical report writing?'), 800);
            }}
            className="p-2.5 bg-white hover:bg-blue-50/60 rounded-lg border border-slate-200 text-left transition-colors cursor-pointer"
          >
            &ldquo;What are the 7 Cs of effective technical report writing?&rdquo;
          </button>
        </div>
      </div>
    </div>
  );
}
