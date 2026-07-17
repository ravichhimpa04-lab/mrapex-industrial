import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
  Bot,
  RefreshCw,
  Mic,
  MicOff,
  Inbox,
  FileClock,
  MessageCircleReply,
  BellRing,
  ArrowUpRight,
  AlertTriangle,
  Bell,
  Volume2,
  VolumeX,
  Send,
  Clock,
  Sparkles,
  X,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
  Sunrise,
  User,
} from 'lucide-react';

const ENQUIRY_API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const API_URL = import.meta.env.VITE_API_URL;

const AUTO_REFRESH_INTERVAL_MS = 60000;

const SILENCE_TIMEOUT_MS = 4000;
const MAX_VOICE_LOG_ITEMS = 20;
const MAX_TIMELINE_ITEMS = 15;

export default function ApexDashboard() {
  const [enquiries, setEnquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [insights, setInsights] = useState([]);

  // Always-fresh refs so timer/voice-driven code never reads stale state
  const enquiriesRef = useRef([]);
  const quotationsRef = useRef([]);

  useEffect(() => {
    enquiriesRef.current = enquiries;
  }, [enquiries]);

  useEffect(() => {
    quotationsRef.current = quotations;
  }, [quotations]);

  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(true);

  const [enquiriesError, setEnquiriesError] = useState('');
  const [quotationsError, setQuotationsError] = useState('');

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ---------- Notification state ----------
  const [notificationSupported, setNotificationSupported] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [voiceNotifyEnabled, setVoiceNotifyEnabled] = useState(true);

  const prevEnquiryIdsRef = useRef(null); // null = not initialized yet (skip first load)
  const prevRepliedIdsRef = useRef(null); // null = not initialized yet (skip first load)

  const getEnquiryKey = useCallback(
    (item) => item.id || `${item.dateTime || ''}-${item.name || ''}-${item.emailId || ''}`,
    []
  );

  // True while Apex's own voice is playing, so the mic can ignore audio it
  // picks up from itself (prevents an endless self-triggered feedback loop).
  const isSpeakingRef = useRef(false);
  // True while the mic is deliberately paused for TTS playback + safety buffer.
  // Distinguishes an intentional pause from a real "stop listening" so the
  // auto-restart logic knows whether to resume.
  const isPausedForSpeechRef = useRef(false);
  // Last thing Apex said out loud — used to detect if the mic just heard its
  // own echo rather than a genuine new command from the owner.
  const lastSpokenTextRef = useRef('');

  // Available system/browser voices, loaded once (some browsers load this
  // list asynchronously, hence the voiceschanged listener).
  const availableVoicesRef = useRef([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        availableVoicesRef.current = voices;
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Picks the most natural-sounding FEMALE voice available for the given
  // language, falling back gracefully if the exact language/gender isn't
  // available on this device/browser.
  const pickFemaleVoice = useCallback((lang) => {
    const voices = availableVoicesRef.current;
    if (!voices || voices.length === 0) return null;

    const langPrefix = (lang || 'en-IN').slice(0, 2).toLowerCase();
    const sameLanguage = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    const pool = sameLanguage.length > 0 ? sameLanguage : voices;

    // Known good female-sounding voice names across common browsers/OSes,
    // roughly in order of naturalness. Swara/Neerja (Microsoft's neural
    // Indian voices, available in Edge) sound the most natural for Hindi.
    const femaleNamePatterns =
      langPrefix === 'hi'
        ? ['swara', 'lekha', 'google हिन्दी', 'google hindi', 'female']
        : [
            'neerja',
            'swara',
            'google uk english female',
            'google us english',
            'samantha',
            'zira',
            'heera',
            'female',
          ];

    for (const pattern of femaleNamePatterns) {
      const match = pool.find((v) => v.name.toLowerCase().includes(pattern));
      if (match) return match;
    }

    // No confidently-female voice found for this language — just use
    // whatever is available for the language rather than forcing a mismatch.
    return pool[0] || null;
  }, []);

  // Plays browser-native speech synthesis — used only as a fallback if the
  // cloud voice (Azure) isn't configured or a request fails, so Apex never
  // goes silent.
  const speakWithBrowserVoice = useCallback(
    (text, lang, resumeListening) => {
      if (!('speechSynthesis' in window)) {
        resumeListening();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang || 'en-IN';
        utterance.rate = 1;

        const selectedVoice = pickFemaleVoice(utterance.lang);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
          isSpeakingRef.current = true;
        };

        utterance.onend = resumeListening;
        utterance.onerror = resumeListening;

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Apex browser-voice speak error:', error);
        isSpeakingRef.current = false;
        resumeListening();
      }
    },
    [pickFemaleVoice]
  );

  const speak = useCallback(
    async (text, lang) => {
      lastSpokenTextRef.current = text;

      // Fully stop the mic (not just ignore its results) while Apex talks —
      // ignoring results client-side isn't enough because the browser can
      // still be mid-transcription right at the boundary and leak a stray
      // result.
      if (isListeningRef.current && recognitionRef.current) {
        isPausedForSpeechRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // ignore
        }
      }

      const resumeListening = () => {
        isSpeakingRef.current = false;

        if (!isListeningRef.current || !isPausedForSpeechRef.current) return;

        // Extra buffer after audio "ends" so any speaker/room echo tail has
        // time to die down before the mic starts capturing again.
        setTimeout(() => {
          isPausedForSpeechRef.current = false;

          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              // may already be running - safe to ignore
            }
          }
        }, 1200);
      };

      // Try the cloud voice first — this sounds identical on every device,
      // unlike the browser's built-in voice which depends on what happens to
      // be installed locally.
      try {
        isSpeakingRef.current = true;

        const response = await fetch(`${API_URL}/ai/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang: lang || 'en-IN' }),
        });

        const result = await response.json();

        if (!response.ok || !result.success || !result.audio) {
          throw new Error(result.error || 'Cloud voice unavailable');
        }

        const audio = new Audio(`data:audio/mp3;base64,${result.audio}`);
        audio.onended = resumeListening;
        audio.onerror = resumeListening;
        await audio.play();
      } catch (error) {
        console.warn('Apex cloud voice unavailable, using browser voice instead:', error.message);
        speakWithBrowserVoice(text, lang, resumeListening);
      }
    },
    [speakWithBrowserVoice]
  );

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotificationSupported(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.error('Apex notification permission error:', error);
    }
  }, []);

  // ---------- Push notifications (desktop + mobile, works even when this tab/browser is closed) ----------
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        const existingSubscription = await registration.pushManager.getSubscription();
        setPushSubscribed(Boolean(existingSubscription));
      } catch (error) {
        console.error('Apex push subscription check error:', error);
      }
    })();
  }, []);

  const enablePushNotifications = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser. Try Chrome or Edge on Android/desktop.');
      return;
    }

    setPushSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        setPushSubscribing(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const keyResponse = await fetch(`${API_URL}/push/vapid-public-key`);
      const keyResult = await keyResponse.json();

      if (!keyResponse.ok || !keyResult.success) {
        throw new Error(keyResult.error || 'Push notifications are not configured on the server yet');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyResult.publicKey),
      });

      const subscribeResponse = await fetch(`${API_URL}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      const subscribeResult = await subscribeResponse.json();

      if (!subscribeResponse.ok || !subscribeResult.success) {
        throw new Error(subscribeResult.error || 'Could not save subscription');
      }

      setPushSubscribed(true);
      alert('Push notifications enabled! You will now get alerts on this device even when the tab is closed.');
    } catch (error) {
      console.error('Apex enable push error:', error);
      alert(`Could not enable push notifications: ${error.message}`);
    } finally {
      setPushSubscribing(false);
    }
  }, []);

  const notifyNewEnquiry = useCallback(
    (item) => {
      const title = 'New Lead Enquiry - MR Apex';
      const body = `${item.name || 'Unknown'} (${item.companyName || 'No company'}) - ${
        item.productRequired || 'Product not specified'
      }`;

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.png',
          });
        } catch (error) {
          console.error('Apex desktop notification error:', error);
        }
      }

      if (voiceNotifyEnabled) {
        speak(
          `New enquiry received from ${item.name || 'a customer'} for ${
            item.productRequired || 'a product'
          }`
        );
      }
    },
    [voiceNotifyEnabled, speak]
  );

  const notifyCustomerReply = useCallback(
    (item) => {
      const title = 'Customer Replied - MR Apex';
      const body = item.reply_intent
        ? `${item.customer_name || item.company_name || 'Customer'} (${item.quotation_no}): ${item.reply_intent}`
        : `${item.customer_name || item.company_name || 'Customer'} replied to quotation ${
            item.quotation_no || ''
          }`;

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.png',
          });
        } catch (error) {
          console.error('Apex desktop notification error:', error);
        }
      }

      if (voiceNotifyEnabled) {
        speak(
          item.reply_intent
            ? `${item.customer_name || 'A customer'} replied about quotation ${
                item.quotation_no || ''
              }. ${item.reply_intent}`
            : `${item.customer_name || 'A customer'} replied to quotation ${item.quotation_no || ''}`
        );
      }
    },
    [voiceNotifyEnabled, speak]
  );

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotificationSupported(false);
      return;
    }

    setNotificationPermission(Notification.permission);
  }, []);

  // Detect newly arrived enquiries and fire notifications (skips the very first load)
  useEffect(() => {
    if (loadingEnquiries) return;

    const currentIds = new Set(enquiries.map(getEnquiryKey));

    if (prevEnquiryIdsRef.current === null) {
      prevEnquiryIdsRef.current = currentIds;
      return;
    }

    const previousIds = prevEnquiryIdsRef.current;
    const newItems = enquiries.filter((item) => !previousIds.has(getEnquiryKey(item)));

    if (newItems.length > 0) {
      newItems.forEach((item) => notifyNewEnquiry(item));
    }

    prevEnquiryIdsRef.current = currentIds;
  }, [enquiries, loadingEnquiries, getEnquiryKey, notifyNewEnquiry]);

  // Detect newly replied quotations and fire notifications (skips the very first load)
  useEffect(() => {
    if (loadingQuotations) return;

    const repliedIds = new Set(
      quotations.filter((item) => item.customer_replied).map((item) => item.id)
    );

    if (prevRepliedIdsRef.current === null) {
      prevRepliedIdsRef.current = repliedIds;
      return;
    }

    const previousRepliedIds = prevRepliedIdsRef.current;
    const newlyReplied = quotations.filter(
      (item) => item.customer_replied && !previousRepliedIds.has(item.id)
    );

    if (newlyReplied.length > 0) {
      newlyReplied.forEach((item) => notifyCustomerReply(item));
    }

    prevRepliedIdsRef.current = repliedIds;
  }, [quotations, loadingQuotations, notifyCustomerReply]);

  // ---------- Voice Assistant state ----------
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceLog, setVoiceLog] = useState([]);
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN'); // 'en-IN' | 'hi-IN'

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const commandBufferRef = useRef('');
  const silenceTimerRef = useRef(null);
  const processApexCommandRef = useRef(() => {}); // forward-ref, filled in below once processApexCommand is defined

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // If a big chunk of the words we just heard match what Apex itself just
  // spoke out loud, this is almost certainly the mic picking up its own
  // voice (echo/room acoustics) rather than a genuine new instruction.
  const isLikelyEcho = useCallback((capturedText) => {
    const lastSpoken = (lastSpokenTextRef.current || '').toLowerCase().trim();
    const captured = (capturedText || '').toLowerCase().trim();

    if (!lastSpoken || !captured) return false;

    const lastWords = lastSpoken.split(/\s+/).filter(Boolean);
    const capturedWords = captured.split(/\s+/).filter(Boolean);

    if (lastWords.length < 3 || capturedWords.length < 2) return false;

    const lastWordSet = new Set(lastWords);
    const matchCount = capturedWords.filter((word) => lastWordSet.has(word)).length;
    const overlapRatio = matchCount / capturedWords.length;

    return overlapRatio > 0.6;
  }, []);

  // Saves whatever has been captured so far as one command, and hands it off to
  // Apex to actually act on and respond to — the mic keeps listening for the next
  // command without needing to click again.
  const finalizeCommand = useCallback(() => {
    const text = commandBufferRef.current.trim();
    commandBufferRef.current = '';
    setLiveTranscript('');

    if (text && isLikelyEcho(text)) {
      console.warn('Apex ignored a likely echo of its own voice:', text);
      return;
    }

    if (text) {
      processApexCommandRef.current(text);
    }
  }, [isLikelyEcho]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      finalizeCommand();
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer, finalizeCommand]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    clearSilenceTimer();

    // Save any command that was spoken but hadn't hit the silence timeout yet
    finalizeCommand();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Apex voice stop error:', error);
      }
    }

    setIsListening(false);
  }, [clearSilenceTimer, finalizeCommand]);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceSupported(false);
      return;
    }

    setVoiceError('');
    commandBufferRef.current = '';
    setLiveTranscript('');
    pendingClarificationRef.current = null;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = voiceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
    };

    // No wake-word needed: clicking "Talk to Apex" is itself the signal to start
    // capturing. Everything spoken while listening is added to the current command,
    // and after ~4s of silence it is automatically saved to the Voice Command Log.
    // Some mobile speech engines (notably Android Chrome) occasionally
    // re-report the exact same final word several times in a row due to an
    // internal recognition glitch (e.g. "tum tum tum tum tum"). Collapse any
    // run of 3+ identical consecutive words down to a single occurrence —
    // this still allows genuine intentional doubling in speech (e.g. "bahut
    // bahut", "dheere dheere"), since only 3-or-more-in-a-row gets trimmed.
    const collapseRepeatedWords = (text) => {
      const words = text.split(/\s+/).filter(Boolean);
      const collapsed = [];
      let repeatCount = 0;

      for (const word of words) {
        const normalized = word.toLowerCase();
        const lastNormalized =
          collapsed.length > 0 ? collapsed[collapsed.length - 1].toLowerCase() : null;

        if (normalized === lastNormalized) {
          repeatCount += 1;
          if (repeatCount >= 2) {
            continue;
          }
        } else {
          repeatCount = 0;
        }

        collapsed.push(word);
      }

      return collapsed.join(' ');
    };

    recognition.onresult = (event) => {
      // Ignore anything picked up while Apex itself is talking — otherwise the
      // mic hears Apex's own voice through the speakers and treats it as a new
      // command, causing an endless repeating loop.
      if (isSpeakingRef.current) {
        return;
      }

      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += `${piece} `;
        } else {
          interimText += piece;
        }
      }

      if (finalText.trim()) {
        const cleanedFinalText = collapseRepeatedWords(finalText.trim());
        commandBufferRef.current = collapseRepeatedWords(
          `${commandBufferRef.current} ${cleanedFinalText}`.trim()
        );
      }

      setLiveTranscript(`${commandBufferRef.current} ${interimText}`.trim());
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      console.error('Apex voice recognition error:', event.error);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceError('Microphone permission denied. Please allow microphone access in your browser settings.');
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Ignore - recognition auto-restarts via onend
      } else if (event.error === 'audio-capture') {
        // The mic can become briefly unavailable right after our own
        // pause/resume cycle around Apex speaking (the OS needs a moment to
        // hand the microphone back). This isn't fatal — retry shortly rather
        // than getting stuck with a dead recognizer.
        setTimeout(() => {
          if (isListeningRef.current && !isPausedForSpeechRef.current) {
            try {
              recognition.start();
            } catch (retryError) {
              // Already running/starting - safe to ignore
            }
          }
        }, 1500);
      } else {
        setVoiceError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isPausedForSpeechRef.current) {
        // Deliberately stopped so Apex could talk without hearing itself —
        // speak()'s resumeListening() will restart this after a buffer delay.
        return;
      }

      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (error) {
          // Recognition may already be starting - safe to ignore
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error('Apex voice start error:', error);
      setVoiceError('Voice could not start. Please refresh the page and try again.');
    }
  }, [resetSilenceTimer, voiceLanguage]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceSupported(false);
    }

    return () => {
      isListeningRef.current = false;
      clearSilenceTimer();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // ignore cleanup errors
        }
      }
    };
  }, [clearSilenceTimer]);

  // ---------- Enquiries / Quotations data ----------
  const fetchEnquiries = useCallback(async () => {
    setLoadingEnquiries(true);
    setEnquiriesError('');

    try {
      const response = await fetch(`${ENQUIRY_API_URL}?type=enquiries`);
      const result = await response.json();

      if (result.success) {
        setEnquiries(result.enquiries || []);
      } else {
        setEnquiriesError('Failed to load enquiry data');
      }
    } catch (error) {
      console.error('Apex fetch enquiries error:', error);
      setEnquiriesError('Could not connect to the enquiry source');
    } finally {
      setLoadingEnquiries(false);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    setLoadingQuotations(true);
    setQuotationsError('');

    const { data, error } = await supabase
      .from('quotations')
      .select(
        'id, quotation_no, enquiry_no, customer_name, company_name, mobile, email, address, status, gst_percent, grand_total, created_at, sent_at, customer_replied, replied_at, reply_snippet, reply_intent, follow_up_count, last_follow_up_at, revision_count, won_at, do_not_contact'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Apex fetch quotations error:', error);
      setQuotationsError('Failed to load quotation data');
    } else {
      setQuotations(data || []);
    }

    setLoadingQuotations(false);
  }, []);

  // Proactive Thinking: things Apex noticed on its own that need attention
  // (computed by the "Apex - Proactive Insights" n8n workflow every few hours).
  const fetchInsights = useCallback(async () => {
    const { data, error } = await supabase
      .from('apex_insights')
      .select('id, category, message, quotation_id, created_at')
      .eq('dismissed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Apex fetch insights error:', error);
    } else {
      setInsights(data || []);
    }
  }, []);

  const dismissInsight = useCallback(async (insightId) => {
    const { error } = await supabase
      .from('apex_insights')
      .update({ dismissed: true })
      .eq('id', insightId);

    if (error) {
      console.error('Apex dismiss insight error:', error);
      return;
    }

    setInsights((prev) => prev.filter((item) => item.id !== insightId));
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchEnquiries(), fetchQuotations(), fetchInsights()]);
    setLastUpdated(new Date());
  }, [fetchEnquiries, fetchQuotations, fetchInsights]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const intervalId = setInterval(() => {
      refreshAll();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshAll]);

  const newEnquiriesCount = useMemo(
    () => enquiries.filter((item) => (item.status || 'New') === 'New').length,
    [enquiries]
  );

  const pendingQuotationsCount = useMemo(
    () => quotations.filter((item) => (item.status || 'Draft') !== 'Sent').length,
    [quotations]
  );

  const repliedQuotations = useMemo(
    () =>
      quotations
        .filter((item) => item.customer_replied)
        .sort((a, b) => new Date(b.replied_at || 0) - new Date(a.replied_at || 0)),
    [quotations]
  );

  const followedUpQuotations = useMemo(
    () =>
      quotations
        .filter((item) => Number(item.follow_up_count || 0) > 0)
        .sort((a, b) => new Date(b.last_follow_up_at || 0) - new Date(a.last_follow_up_at || 0)),
    [quotations]
  );

  const customerRepliesCount = repliedQuotations.length;
  const followUpsCount = followedUpQuotations.length;

  // Stable Enquiry Number — this is the permanent `id` assigned once by the
  // Google Sheet when the enquiry was first created, and never recalculated.
  // Using this directly (instead of a recomputed chronological index) means
  // the number never shifts even if other enquiries are later deleted.
  const enquiriesWithSrNo = useMemo(() => {
    return enquiries
      .map((item) => ({ ...item, srNo: Number(item.id) || null }))
      .sort((a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0));
  }, [enquiries]);

  const enquiriesWithSrNoRef = useRef([]);

  // Hard safety net: tracks the last time each quotation was actually
  // emailed, so a duplicate send request within a short window (e.g. from a
  // voice feedback loop) never results in the customer getting the same
  // quotation twice.
  const recentSendTimestampsRef = useRef(new Map());
  const RESEND_COOLDOWN_MS = 45000;

  useEffect(() => {
    enquiriesWithSrNoRef.current = enquiriesWithSrNo;
  }, [enquiriesWithSrNo]);

  const recentEnquiries = useMemo(() => enquiriesWithSrNo.slice(0, 5), [enquiriesWithSrNo]);

  const isLoading = loadingEnquiries || loadingQuotations;
  const hasError = Boolean(enquiriesError || quotationsError);

  // ---------- Daily Work Summary ----------
  const todayString = new Date().toDateString();

  const newEnquiriesToday = useMemo(
    () =>
      enquiries.filter(
        (item) => item.dateTime && new Date(item.dateTime).toDateString() === todayString
      ).length,
    [enquiries, todayString]
  );

  const awaitingReplyQuotations = useMemo(
    () => quotations.filter((item) => item.status === 'Sent' && !item.customer_replied),
    [quotations]
  );

  const repliesNeedingAction = useMemo(
    () => quotations.filter((item) => item.customer_replied && item.status !== 'Won'),
    [quotations]
  );

  const followUpsSentToday = useMemo(
    () =>
      quotations.filter(
        (item) =>
          item.last_follow_up_at && new Date(item.last_follow_up_at).toDateString() === todayString
      ).length,
    [quotations, todayString]
  );

  const dealsWonThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return quotations.filter(
      (item) => item.status === 'Won' && item.won_at && new Date(item.won_at).getTime() >= oneWeekAgo
    ).length;
  }, [quotations]);

  const briefingText = useMemo(() => {
    const insightsPart =
      insights.length > 0
        ? ` Also, ${insights.length} ${
            insights.length === 1 ? 'thing needs' : 'things need'
          } your attention — check the Attention Needed section.`
        : '';

    return `Good morning! You have ${newEnquiriesToday} new ${
      newEnquiriesToday === 1 ? 'enquiry' : 'enquiries'
    } today, ${pendingQuotationsCount} quotations pending to send, and ${
      awaitingReplyQuotations.length
    } quotations awaiting a customer reply. ${repliesNeedingAction.length} ${
      repliesNeedingAction.length === 1 ? 'reply needs' : 'replies need'
    } your attention. ${dealsWonThisWeek} deal${dealsWonThisWeek === 1 ? '' : 's'} won this week.${insightsPart}`;
  }, [
    newEnquiriesToday,
    pendingQuotationsCount,
    awaitingReplyQuotations,
    repliesNeedingAction,
    dealsWonThisWeek,
    insights,
  ]);

  const readBriefingAloud = useCallback(() => {
    speak(briefingText);
  }, [speak, briefingText]);

  useEffect(() => {
    if (isLoading) return;

    try {
      const lastBriefingDate = window.localStorage.getItem('apex_last_briefing_date');

      if (lastBriefingDate !== todayString) {
        window.localStorage.setItem('apex_last_briefing_date', todayString);

        if (voiceNotifyEnabled) {
          speak(briefingText);
        }
      }
    } catch (error) {
      console.error('Apex daily briefing error:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const systemStatus = isLoading ? 'CHECKING' : hasError ? 'PARTIAL' : 'READY';

  const statusStyles = {
    READY: 'text-green-400',
    CHECKING: 'text-yellow-400',
    PARTIAL: 'text-orange-400',
  };

  const statusLabel = {
    READY: '● READY',
    CHECKING: '● CHECKING...',
    PARTIAL: '● PARTIAL DATA',
  };

  // ---------- Timeline (Phase 4) ----------
  const formatRelativeTime = useCallback((date) => {
    const diffMs = Date.now() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return 'Just now';

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }, []);

  const timelineEvents = useMemo(() => {
    const events = [];

    enquiries.forEach((item) => {
      if (!item.dateTime) return;

      const timestamp = new Date(item.dateTime);
      if (Number.isNaN(timestamp.getTime())) return;

      events.push({
        id: `enquiry-${getEnquiryKey(item)}`,
        type: 'enquiry',
        timestamp,
        title: 'New Enquiry Received',
        description: `${item.name || 'Unknown'} (${item.companyName || 'No company'}) - ${
          item.productRequired || 'Product not specified'
        }`,
      });
    });

    quotations.forEach((item) => {
      if (item.created_at) {
        const createdTimestamp = new Date(item.created_at);

        if (!Number.isNaN(createdTimestamp.getTime())) {
          events.push({
            id: `quotation-created-${item.id}`,
            type: 'quotation_created',
            timestamp: createdTimestamp,
            title: 'Quotation Created',
            description: `${item.quotation_no || 'Quotation'} - ${
              item.customer_name || item.company_name || 'Customer'
            } - ₹${Number(item.grand_total || 0).toLocaleString('en-IN')}`,
          });
        }
      }

      if (item.status === 'Sent' && item.sent_at) {
        const sentTimestamp = new Date(item.sent_at);

        if (!Number.isNaN(sentTimestamp.getTime())) {
          events.push({
            id: `quotation-sent-${item.id}-${item.revision_count || 0}`,
            type: 'quotation_sent',
            timestamp: sentTimestamp,
            title:
              Number(item.revision_count || 0) > 0
                ? `Revised Quotation Sent (Rev ${item.revision_count})`
                : 'Quotation Sent',
            description: `${item.quotation_no || 'Quotation'} sent to ${
              item.customer_name || 'customer'
            } - ₹${Number(item.grand_total || 0).toLocaleString('en-IN')}`,
          });
        }
      }

      if (item.customer_replied && item.replied_at) {
        const repliedTimestamp = new Date(item.replied_at);

        if (!Number.isNaN(repliedTimestamp.getTime())) {
          events.push({
            id: `quotation-reply-${item.id}`,
            type: 'customer_reply',
            timestamp: repliedTimestamp,
            title: 'Customer Replied',
            description: `${item.customer_name || 'Customer'} replied to ${
              item.quotation_no || 'quotation'
            }`,
          });
        }
      }

      if (Number(item.follow_up_count || 0) > 0 && item.last_follow_up_at) {
        const followUpTimestamp = new Date(item.last_follow_up_at);

        if (!Number.isNaN(followUpTimestamp.getTime())) {
          events.push({
            id: `quotation-followup-${item.id}`,
            type: 'follow_up',
            timestamp: followUpTimestamp,
            title: 'Follow-up Sent',
            description: `Follow-up #${item.follow_up_count} sent for ${
              item.quotation_no || 'quotation'
            } to ${item.customer_name || 'customer'}`,
          });
        }
      }

      if (item.status === 'Won') {
        events.push({
          id: `quotation-won-${item.id}`,
          type: 'deal_won',
          timestamp: new Date(item.last_follow_up_at || item.replied_at || item.sent_at || item.created_at),
          title: 'Deal Won 🎉',
          description: `${item.quotation_no || 'Quotation'} - ${
            item.customer_name || 'Customer'
          } finalized`,
        });
      }
    });

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_TIMELINE_ITEMS);
  }, [enquiries, quotations, getEnquiryKey]);

  const timelineIconFor = (type) => {
    if (type === 'quotation_sent' || type === 'sent') return <Send className="w-4 h-4 text-white" />;
    if (type === 'quotation_created' || type === 'created')
      return <FileClock className="w-4 h-4 text-white" />;
    if (type === 'customer_reply' || type === 'customer_replied')
      return <MessageCircleReply className="w-4 h-4 text-white" />;
    if (type === 'follow_up' || type === 'follow_up_sent')
      return <BellRing className="w-4 h-4 text-white" />;
    if (type === 'deal_won') return <CheckCircle2 className="w-4 h-4 text-white" />;
    if (type === 'revised') return <RotateCcw className="w-4 h-4 text-white" />;
    if (type === 'resent') return <Send className="w-4 h-4 text-white" />;
    if (type === 'message_sent') return <Send className="w-4 h-4 text-white" />;
    if (type === 'contact_stopped') return <AlertTriangle className="w-4 h-4 text-white" />;
    if (type === 'contact_resumed') return <CheckCircle2 className="w-4 h-4 text-white" />;
    return <Inbox className="w-4 h-4 text-white" />;
  };

  const timelineColorFor = (type) => {
    if (type === 'quotation_sent' || type === 'sent') return 'bg-green-600';
    if (type === 'quotation_created' || type === 'created') return 'bg-blue-600';
    if (type === 'customer_reply' || type === 'customer_replied') return 'bg-amber-600';
    if (type === 'follow_up' || type === 'follow_up_sent') return 'bg-purple-600';
    if (type === 'deal_won') return 'bg-emerald-600';
    if (type === 'revised') return 'bg-orange-600';
    if (type === 'resent') return 'bg-green-700';
    if (type === 'message_sent') return 'bg-teal-600';
    if (type === 'contact_stopped') return 'bg-rose-600';
    if (type === 'contact_resumed') return 'bg-slate-600';
    return 'bg-slate-600';
  };

  const titleForHistoryEventType = (type) => {
    const map = {
      created: 'Quotation Created',
      sent: 'Quotation Sent',
      revised: 'Quotation Revised',
      resent: 'Revised Quotation Resent',
      customer_replied: 'Customer Replied',
      follow_up_sent: 'Follow-up Sent',
      message_sent: 'Message Sent (No Price Change)',
      contact_stopped: 'Contact Stopped',
      contact_resumed: 'Contact Resumed',
      deal_won: 'Deal Won 🎉',
    };
    return map[type] || type;
  };

  // ---------- Customer Timeline / Memory ----------
  const [customerTimelineFor, setCustomerTimelineFor] = useState(null); // { company, name }

  const normalizeCompany = useCallback((value) => (value || '').toLowerCase().trim(), []);

  const openCustomerTimeline = useCallback((companyName, customerName, enquiryNo) => {
    if (!companyName && !customerName && !enquiryNo) return;
    setCustomerTimelineFor({
      company: companyName || '',
      name: customerName || '',
      enquiryNo: enquiryNo ? Number(enquiryNo) : null,
    });
  }, []);

  const closeCustomerTimeline = useCallback(() => {
    setCustomerTimelineFor(null);
  }, []);

  const customerEnquiries = useMemo(() => {
    if (!customerTimelineFor) return [];

    if (customerTimelineFor.enquiryNo) {
      return enquiries.filter((item) => Number(item.id) === customerTimelineFor.enquiryNo);
    }

    const companyKey = normalizeCompany(customerTimelineFor.company);

    return enquiries.filter((item) => normalizeCompany(item.companyName) === companyKey && companyKey);
  }, [customerTimelineFor, enquiries, normalizeCompany]);

  const customerQuotations = useMemo(() => {
    if (!customerTimelineFor) return [];

    if (customerTimelineFor.enquiryNo) {
      return quotations.filter((item) => Number(item.enquiry_no) === customerTimelineFor.enquiryNo);
    }

    const companyKey = normalizeCompany(customerTimelineFor.company);

    return quotations.filter((item) => normalizeCompany(item.company_name) === companyKey && companyKey);
  }, [customerTimelineFor, quotations, normalizeCompany]);

  // Real, permanent history — every rate change, every reply's actual text,
  // every message Apex sent, fetched fresh from quotation_events so the
  // timeline shows exactly what happened, not just a reconstructed summary.
  const [customerHistoryEvents, setCustomerHistoryEvents] = useState([]);
  const [loadingCustomerHistory, setLoadingCustomerHistory] = useState(false);

  useEffect(() => {
    if (!customerTimelineFor || customerQuotations.length === 0) {
      setCustomerHistoryEvents([]);
      return undefined;
    }

    let cancelled = false;
    setLoadingCustomerHistory(true);

    (async () => {
      const quotationIds = customerQuotations.map((q) => q.id);
      const quotationNoById = new Map(customerQuotations.map((q) => [q.id, q.quotation_no]));

      const { data, error } = await supabase
        .from('quotation_events')
        .select('id, quotation_id, event_type, event_detail, created_at')
        .in('quotation_id', quotationIds)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error('Apex fetch customer history error:', error);
        setCustomerHistoryEvents([]);
      } else {
        const mapped = (data || []).map((row) => {
          const quotationNo = quotationNoById.get(row.quotation_id);

          return {
            id: `history-${row.id}`,
            type: row.event_type,
            timestamp: new Date(row.created_at),
            title: `${titleForHistoryEventType(row.event_type)}${quotationNo ? ` — ${quotationNo}` : ''}`,
            description: row.event_detail,
          };
        });

        setCustomerHistoryEvents(mapped);
      }

      setLoadingCustomerHistory(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [customerTimelineFor, customerQuotations]);

  const customerTimelineEvents = useMemo(() => {
    if (!customerTimelineFor) return [];

    const events = [];

    customerEnquiries.forEach((item) => {
      if (!item.dateTime) return;
      const timestamp = new Date(item.dateTime);
      if (Number.isNaN(timestamp.getTime())) return;

      events.push({
        id: `c-enquiry-${getEnquiryKey(item)}`,
        type: 'enquiry',
        timestamp,
        title: `Enquiry Received${item.id ? ` (Enquiry #${item.id})` : ''}`,
        description: `${item.productRequired || 'Product not specified'}${
          item.message ? ` — "${item.message}"` : ''
        }`,
      });
    });

    customerHistoryEvents.forEach((event) => {
      events.push(event);
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [customerTimelineFor, customerEnquiries, customerHistoryEvents, getEnquiryKey]);

  const customerTimelineSummary = useMemo(() => {
    const totalValue = customerQuotations.reduce(
      (sum, item) => sum + Number(item.grand_total || 0),
      0
    );
    const wonCount = customerQuotations.filter((item) => item.status === 'Won').length;

    return {
      enquiryCount: customerEnquiries.length,
      quotationCount: customerQuotations.length,
      totalValue,
      wonCount,
    };
  }, [customerEnquiries, customerQuotations]);

  // ---------- Quotation Trigger / Manual Creation / Revision (Phase 5 + 9) ----------
  const [convertingEntryId, setConvertingEntryId] = useState(null);
  const [quotationReview, setQuotationReview] = useState(null);
  const [quotationActionError, setQuotationActionError] = useState('');
  const [creatingQuotation, setCreatingQuotation] = useState(false);

  const findMatchingEnquiry = useCallback((companyNameGuess, customerNameGuess) => {
    const companyGuess = (companyNameGuess || '').toLowerCase().trim();
    const nameGuess = (customerNameGuess || '').toLowerCase().trim();

    if (!companyGuess && !nameGuess) return null;

    const candidates = enquiriesRef.current.filter((item) => {
      const company = (item.companyName || '').toLowerCase().trim();
      const name = (item.name || '').toLowerCase().trim();

      const companyMatches =
        companyGuess && company && (company.includes(companyGuess) || companyGuess.includes(company));
      const nameMatches =
        nameGuess && name && (name.includes(nameGuess) || nameGuess.includes(name));

      return companyMatches || nameMatches;
    });

    if (candidates.length === 0) return null;

    // Prefer the most recent matching enquiry if there are multiple
    return (
      candidates.sort((a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0))[0] || null
    );
  }, []);

  const convertVoiceToQuotation = useCallback(
    async (entry) => {
      setConvertingEntryId(entry.id);
      setQuotationActionError('');

      try {
        const response = await fetch(`${API_URL}/ai/parse-quotation-voice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: entry.text }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Could not parse the voice command');
        }

        const parsed = result.parsed || {};
        const matchedEnquiry = findMatchingEnquiry(parsed.company_name);
        const gstIncluded = (parsed.gst_note || '').toLowerCase().includes('include');

        setQuotationReview({
          sourceText: `Voice command: "${entry.text}"`,
          matchedEnquiryFound: Boolean(matchedEnquiry),
          enquiry_no: matchedEnquiry?.id ? Number(matchedEnquiry.id) : null,
          customer_name: matchedEnquiry?.name || '',
          company_name: matchedEnquiry?.companyName || parsed.company_name || '',
          mobile: matchedEnquiry?.contactNumber || '',
          email: matchedEnquiry?.emailId || '',
          address: matchedEnquiry?.address || '',
          product_name: matchedEnquiry?.productRequired || parsed.product_hint || '',
          part_number: matchedEnquiry?.partNumber || '',
          quantity: Number(matchedEnquiry?.quantity) || 1,
          rate: Number(parsed.rate) || 0,
          gst_percent: gstIncluded ? 0 : 18,
          delivery_days: parsed.delivery_days || '',
          payment_terms: parsed.payment_terms || '',
          warranty_terms: parsed.warranty || '',
          notes: parsed.notes || '',
        });
      } catch (error) {
        console.error('Apex convert voice to quotation error:', error);
        setQuotationActionError(error.message);
      } finally {
        setConvertingEntryId(null);
      }
    },
    [findMatchingEnquiry]
  );

  // Phase 9: create a quotation directly from an enquiry row (no voice needed)
  const createQuotationFromEnquiry = useCallback((enquiry) => {
    setQuotationActionError('');

    setQuotationReview({
      sourceText: `Created manually from enquiry — ${enquiry.name || 'customer'} (${
        enquiry.companyName || 'no company'
      })`,
      matchedEnquiryFound: true,
      enquiry_no: enquiry.id ? Number(enquiry.id) : null,
      customer_name: enquiry.name || '',
      company_name: enquiry.companyName || '',
      mobile: enquiry.contactNumber || '',
      email: enquiry.emailId || '',
      address: enquiry.address || '',
      product_name: enquiry.productRequired || '',
      part_number: enquiry.partNumber || '',
      quantity: Number(enquiry.quantity) || 1,
      rate: 0,
      gst_percent: 18,
      delivery_days: '',
      payment_terms: '',
      warranty_terms: '',
      notes: '',
    });
  }, []);

  // Phase 9: revise an already-sent quotation with a new rate and resend it
  const startQuotationRevision = useCallback(async (quotation) => {
    setQuotationActionError('');

    try {
      const { data: items, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', quotation.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (itemsError) throw new Error(itemsError.message);

      const firstItem = items?.[0] || {};

      setQuotationReview({
        revisingQuotationId: quotation.id,
        currentRevisionCount: Number(quotation.revision_count || 0),
        sourceText: `Revising quotation ${quotation.quotation_no} after customer reply`,
        matchedEnquiryFound: true,
        customer_name: quotation.customer_name || '',
        company_name: quotation.company_name || '',
        mobile: quotation.mobile || '',
        email: quotation.email || '',
        address: quotation.address || '',
        product_name: firstItem.product_name || '',
        part_number: firstItem.part_number || '',
        quantity: Number(firstItem.quantity) || 1,
        rate: Number(firstItem.rate) || 0,
        gst_percent: Number(quotation.gst_percent) || 18,
        delivery_days: '',
        payment_terms: '',
        notes: '',
      });
    } catch (error) {
      console.error('Apex start revision error:', error);
      setQuotationActionError(error.message);
    }
  }, []);

  // ---------- Permanent history log (never overwritten, never deleted) ----------
  // Every meaningful thing that happens to a quotation gets appended here.
  // This is what lets Apex actually answer "what all happened with this
  // customer" honestly, instead of only knowing the current snapshot.
  const logEvent = useCallback(async (quotationId, eventType, eventDetail) => {
    try {
      const { error } = await supabase.from('quotation_events').insert([
        {
          quotation_id: quotationId,
          event_type: eventType,
          event_detail: eventDetail,
        },
      ]);

      if (error) {
        console.error('Apex logEvent error:', error);
      }
    } catch (error) {
      console.error('Apex logEvent error:', error);
    }
  }, []);

  const fetchQuotationHistory = useCallback(async (quotationId) => {
    const { data, error } = await supabase
      .from('quotation_events')
      .select('event_type, event_detail, created_at')
      .eq('quotation_id', quotationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Apex fetchQuotationHistory error:', error);
      return '';
    }

    return (data || [])
      .map((event) => `[${new Date(event.created_at).toLocaleString()}] ${event.event_detail}`)
      .join('\n');
  }, []);

  // Phase 9: mark a deal as finalized/won, and best-effort update the linked enquiry status
  const markQuotationWon = useCallback(
    async (quotation) => {
      try {
        const { error } = await supabase
          .from('quotations')
          .update({ status: 'Won', won_at: new Date().toISOString() })
          .eq('id', quotation.id);

        if (error) throw new Error(error.message);

        await logEvent(
          quotation.id,
          'deal_won',
          `Deal finalized and marked as Won (final value ₹${Number(quotation.grand_total || 0).toLocaleString('en-IN')}).`
        );

        try {
          const matchedEnquiry = enquiries.find(
            (item) =>
              (item.companyName || '').toLowerCase().trim() ===
              (quotation.company_name || '').toLowerCase().trim()
          );

          if (matchedEnquiry) {
            await fetch(ENQUIRY_API_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'updateEnquiry',
                id: matchedEnquiry.id,
                status: 'Completed',
                assignedTo: matchedEnquiry.assignedTo || '',
                remarks: matchedEnquiry.remarks || '',
              }),
            });
          }
        } catch (enquiryUpdateError) {
          console.error('Apex mark won - enquiry update error:', enquiryUpdateError);
        }

        await fetchQuotations();
        alert('Deal marked as Won ✅');
      } catch (error) {
        console.error('Apex mark won error:', error);
        alert(error.message);
      }
    },
    [enquiries, fetchQuotations, logEvent]
  );

  const updateQuotationReviewField = useCallback((field, value) => {
    setQuotationReview((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const closeQuotationReview = useCallback(() => {
    setQuotationReview(null);
    setQuotationActionError('');
  }, []);

  const generateQuotationNo = useCallback(async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const fy = `${startYear}-${String(startYear + 1).slice(-2)}`;

    const { data, error } = await supabase
      .from('quotations')
      .select('quotation_no')
      .like('quotation_no', `Apex/${fy}/%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return `Apex/${fy}/1000`;
    }

    const lastNo = data[0].quotation_no;
    const lastNumber = Number(lastNo.split('/').pop() || 999);
    return `Apex/${fy}/${lastNumber + 1}`;
  }, []);

  // Standalone creation+send used by the hands-free conversational voice flow
  // (Apex acting on its own, without the manual review modal).
  const createAndSendQuotation = useCallback(
    async (data, sendImmediately) => {
      const quantity = Number(data.quantity || 1);
      const rate = Number(data.rate || 0);
      const subtotal = quantity * rate;
      const gstPercent = Number(data.gst_percent || 0);
      const gstAmount = (subtotal * gstPercent) / 100;
      const grandTotal = subtotal + gstAmount;

      const quotationNo = await generateQuotationNo();

      const quotationPayload = {
        quotation_no: quotationNo,
        enquiry_no: data.enquiry_no || null,
        customer_name: data.customer_name,
        company_name: data.company_name,
        mobile: data.mobile,
        email: data.email,
        address: data.address,
        quotation_date: new Date().toISOString().slice(0, 10),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        gst_percent: gstPercent,
        discount_amount: 0,
        freight_amount: 0,
        subtotal,
        gst_amount: gstAmount,
        grand_total: grandTotal,
        // Only what the owner actually said — never invent payment terms,
        // delivery time, or warranty. Left blank if not mentioned.
        terms: data.payment_terms || '',
        delivery_time: data.delivery_days ? `${data.delivery_days} days` : '',
        warranty_terms: data.warranty_terms || '',
        notes: data.notes || `Created by Apex — ${data.sourceText || 'voice command'}`,
        status: 'Draft',
        customer_email_sent: false,
      };

      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert([quotationPayload])
        .select()
        .single();

      if (quotationError) throw new Error(quotationError.message);

      const { error: itemError } = await supabase.from('quotation_items').insert([
        {
          quotation_id: quotation.id,
          product_name: data.product_name || 'Product',
          part_number: data.part_number || '',
          make: '',
          description: '',
          quantity,
          rate,
          amount: subtotal,
        },
      ]);

      if (itemError) throw new Error(itemError.message);

      await logEvent(
        quotation.id,
        'created',
        `Quotation ${quotationNo} created for ${data.customer_name || data.company_name} — ${
          data.product_name || 'Product'
        }, qty ${quantity}, rate ₹${rate.toLocaleString('en-IN')}${
          data.delivery_days ? `, delivery ${data.delivery_days} days` : ', delivery time not specified'
        }${data.payment_terms ? `, payment terms: ${data.payment_terms}` : ', payment terms not specified'}${
          data.warranty_terms ? `, warranty: ${data.warranty_terms}` : ', warranty not specified'
        }. (Source: ${data.sourceText || 'voice command'})`
      );

      if (sendImmediately) {
        if (!data.email) {
          throw new Error('Quotation saved as Draft, but no customer email was found — could not send.');
        }

        const lastSentAt = recentSendTimestampsRef.current.get(quotation.id);
        if (lastSentAt && Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
          throw new Error(
            'This quotation was just sent moments ago — skipping to avoid emailing the customer twice.'
          );
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const sendResponse = await fetch(`${API_URL}/quotations/${quotation.id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        const sendResult = await sendResponse.json();

        if (!sendResponse.ok || !sendResult.success) {
          throw new Error(sendResult.error || 'Quotation was created, but the email could not be sent');
        }

        await logEvent(quotation.id, 'sent', `Quotation ${quotationNo} emailed to ${data.email}.`);

        recentSendTimestampsRef.current.set(quotation.id, Date.now());
      }

      return quotation;
    },
    [generateQuotationNo, logEvent]
  );

  // Revises an already-sent quotation (new rate and/or delivery days) and resends it.
  // Used by the "give a discount and resend" style voice commands.
  const reviseAndSendQuotation = useCallback(async (quotation, updates) => {
    if (quotation.do_not_contact) {
      throw new Error(
        'This customer is marked as "do not contact" — nothing was sent. Say "isse contact karo" to resume.'
      );
    }

    // Hard safety net first, before touching anything: never resend the same
    // quotation twice within a short window (protects against a voice
    // feedback loop or an accidental repeat command from double-emailing
    // the customer).
    const lastSentAt = recentSendTimestampsRef.current.get(quotation.id);
    if (lastSentAt && Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
      throw new Error(
        'This quotation was just resent moments ago — skipping to avoid emailing the customer twice.'
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotation.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (itemsError) throw new Error(itemsError.message);

    const currentItem = items?.[0] || {};
    const quantity = Number(currentItem.quantity) || 1;

    // If a discount percentage is given, keep the ORIGINAL rate and apply the
    // discount as its own line item, so the PDF shows Rate, Discount %, and
    // the net Amount separately — instead of silently shrinking the rate.
    // If an explicit new absolute rate is given instead, that replaces the
    // rate outright and any previous discount is cleared.
    let rate;
    let discountPercent;

    if (updates.discountPercent !== undefined) {
      rate = Number(currentItem.rate) || 0;
      discountPercent = Number(updates.discountPercent) || 0;
    } else if (updates.rate !== undefined) {
      rate = Number(updates.rate) || 0;
      discountPercent = 0;
    } else {
      // No pricing change at all this time (e.g. only delivery/warranty
      // updated) — keep the existing rate and discount exactly as they were.
      rate = Number(currentItem.rate) || 0;
      discountPercent = Number(currentItem.discount_percent) || 0;
    }

    const grossAmount = quantity * rate;
    const discountAmount = grossAmount * (discountPercent / 100);
    const netAmount = grossAmount - discountAmount;

    const gstPercent = Number(quotation.gst_percent || 0);
    const gstAmount = (netAmount * gstPercent) / 100;
    const grandTotal = netAmount + gstAmount;

    // Only touch payment terms / delivery / warranty if this specific voice
    // command actually mentioned them — otherwise leave whatever was already
    // stored untouched (a price-only revision should not blank these out).
    const optionalFieldUpdates = {};
    if (updates.paymentTerms !== undefined) optionalFieldUpdates.terms = updates.paymentTerms || '';
    if (updates.deliveryDays !== undefined) {
      optionalFieldUpdates.delivery_time = updates.deliveryDays ? `${updates.deliveryDays} days` : '';
    }
    if (updates.warrantyTerms !== undefined) {
      optionalFieldUpdates.warranty_terms = updates.warrantyTerms || '';
    }

    // Describe exactly what changed this time, in plain language, for the
    // permanent history log — this is what lets Apex later explain "first I
    // quoted X, customer said Y, then I revised to Z" honestly.
    const oldRate = Number(currentItem.rate) || 0;
    const oldDiscountPercent = Number(currentItem.discount_percent) || 0;
    const changeParts = [];

    if (updates.discountPercent !== undefined) {
      changeParts.push(
        `Applied a ${discountPercent}% discount on the rate of ₹${rate.toLocaleString(
          'en-IN'
        )} (previous discount was ${oldDiscountPercent}%), new net amount ₹${netAmount.toLocaleString('en-IN')}`
      );
    } else if (updates.rate !== undefined && rate !== oldRate) {
      changeParts.push(
        `Rate changed from ₹${oldRate.toLocaleString('en-IN')} to ₹${rate.toLocaleString('en-IN')}`
      );
    }
    if (optionalFieldUpdates.delivery_time !== undefined) {
      changeParts.push(
        `delivery time set to ${optionalFieldUpdates.delivery_time || '(cleared)'}`
      );
    }
    if (optionalFieldUpdates.warranty_terms !== undefined) {
      changeParts.push(`warranty set to ${optionalFieldUpdates.warranty_terms || '(cleared)'}`);
    }
    if (optionalFieldUpdates.terms !== undefined) {
      changeParts.push(`payment terms set to ${optionalFieldUpdates.terms || '(cleared)'}`);
    }

    const changeDescription =
      changeParts.length > 0
        ? `Revision #${Number(quotation.revision_count || 0) + 1}: ${changeParts.join('; ')}. New grand total ₹${grandTotal.toLocaleString('en-IN')}.`
        : `Revision #${Number(quotation.revision_count || 0) + 1}: resent with no changes.`;

    const { error: updateQuotationError } = await supabase
      .from('quotations')
      .update({
        subtotal: grossAmount,
        discount_amount: discountAmount,
        gst_amount: gstAmount,
        grand_total: grandTotal,
        status: 'Sent',
        customer_replied: false,
        replied_at: null,
        reply_snippet: null,
        reply_intent: null,
        sent_at: new Date().toISOString(),
        ...optionalFieldUpdates,
        revision_count: Number(quotation.revision_count || 0) + 1,
      })
      .eq('id', quotation.id);

    if (updateQuotationError) throw new Error(updateQuotationError.message);

    const { error: deleteItemsError } = await supabase
      .from('quotation_items')
      .delete()
      .eq('quotation_id', quotation.id);

    if (deleteItemsError) throw new Error(deleteItemsError.message);

    const { error: insertItemError } = await supabase.from('quotation_items').insert([
      {
        quotation_id: quotation.id,
        product_name: currentItem.product_name || 'Product',
        part_number: currentItem.part_number || '',
        make: currentItem.make || '',
        description: currentItem.description || '',
        quantity,
        rate,
        discount_percent: discountPercent,
        amount: netAmount,
      },
    ]);

    if (insertItemError) throw new Error(insertItemError.message);

    await logEvent(quotation.id, 'revised', changeDescription);

    if (!quotation.email) {
      throw new Error('No customer email found on this quotation — could not resend.');
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sendResponse = await fetch(`${API_URL}/quotations/${quotation.id}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ customMessage: updates.customMessageHtml || '' }),
    });

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok || !sendResult.success) {
      throw new Error(sendResult.error || 'Quotation was updated, but the email could not be resent');
    }

    recentSendTimestampsRef.current.set(quotation.id, Date.now());

    await logEvent(quotation.id, 'resent', `Revised quotation re-emailed to ${quotation.email}.`);

    return { ...quotation, grand_total: grandTotal, rate };
  }, [logEvent]);

  // Sends a general, custom message to the customer — NOT a formal quotation
  // resend, no PDF, no price change. Composes the owner's dictated instruction
  // into a professional email and sends it as a reply on the same thread.
  const sendCustomMessage = useCallback(
    async (quotation, instruction) => {
      if (quotation.do_not_contact) {
        throw new Error(
          'This customer is marked as "do not contact" — nothing was sent. Say "isse contact karo" to resume.'
        );
      }

      if (!quotation.email) {
        throw new Error('No customer email found on this quotation — could not send.');
      }

      const lastSentAt = recentSendTimestampsRef.current.get(quotation.id);
      if (lastSentAt && Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
        throw new Error(
          'A message was just sent to this customer moments ago — skipping to avoid emailing them twice.'
        );
      }

      const contextText = `Quotation ${quotation.quotation_no} for ${
        quotation.customer_name || quotation.company_name
      } (${quotation.company_name || 'company unknown'}). Current status: ${quotation.status}.`;

      const composeResponse = await fetch(`${API_URL}/ai/compose-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, contextText }),
      });

      const composeResult = await composeResponse.json();

      if (!composeResponse.ok || !composeResult.success) {
        throw new Error(composeResult.error || 'Could not compose the message');
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const sendResponse = await fetch(`${API_URL}/quotations/${quotation.id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messageHtml: composeResult.messageHtml }),
      });

      const sendResult = await sendResponse.json();

      if (!sendResponse.ok || !sendResult.success) {
        throw new Error(sendResult.error || 'Message could not be sent');
      }

      recentSendTimestampsRef.current.set(quotation.id, Date.now());

      await logEvent(
        quotation.id,
        'message_sent',
        `Sent a follow-up message to the customer (not a quotation resend). Owner said: "${instruction}".`
      );

      return quotation;
    },
    [logEvent]
  );

  // Sets or clears the "do not contact" flag — when set, no further quotation
  // sends, revisions, custom messages, or automated follow-ups will go out to
  // this customer until the owner explicitly says to resume.
  const setContactPreference = useCallback(
    async (quotation, doNotContact) => {
      const { error } = await supabase
        .from('quotations')
        .update({ do_not_contact: doNotContact })
        .eq('id', quotation.id);

      if (error) throw new Error(error.message);

      await logEvent(
        quotation.id,
        doNotContact ? 'contact_stopped' : 'contact_resumed',
        doNotContact
          ? 'Owner instructed Apex to stop all further emails (including follow-ups) to this customer.'
          : 'Owner instructed Apex to resume contacting this customer again.'
      );

      await fetchQuotations();
    },
    [logEvent, fetchQuotations]
  );

  // Deletes an enquiry (permanently, from the Google Sheet) and cascades to
  // delete any linked quotation (and its items/history) from Supabase too —
  // "delete everywhere" as the owner asked for.
  const deleteEnquiryAndQuotation = useCallback(
    async (enquiry) => {
      // Delete the enquiry itself from the Google Sheet. This endpoint uses
      // no-cors (like the rest of this app's writes to it), so we can't read
      // a real success/failure response — it's a fire-and-confirm call.
      await fetch(ENQUIRY_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteEnquiry', id: enquiry.id }),
      });

      // Find any quotation(s) linked to this enquiry — by the permanent
      // enquiry_no first (reliable), falling back to a company/name match for
      // older quotations created before enquiry_no existed.
      const matchedQuotations = quotationsRef.current.filter((q) => {
        if (enquiry.id && Number(q.enquiry_no) === Number(enquiry.id)) return true;

        const company = (q.company_name || '').toLowerCase().trim();
        const enquiryCompany = (enquiry.companyName || '').toLowerCase().trim();
        const name = (q.customer_name || '').toLowerCase().trim();
        const enquiryName = (enquiry.name || '').toLowerCase().trim();

        return (
          !q.enquiry_no &&
          enquiryCompany &&
          company === enquiryCompany &&
          enquiryName &&
          name === enquiryName
        );
      });

      for (const quotation of matchedQuotations) {
        await supabase.from('quotation_items').delete().eq('quotation_id', quotation.id);
        await supabase.from('quotation_events').delete().eq('quotation_id', quotation.id);
        await supabase.from('quotations').delete().eq('id', quotation.id);
      }

      await Promise.all([fetchEnquiries(), fetchQuotations()]);

      return { deletedQuotationCount: matchedQuotations.length };
    },
    [fetchEnquiries, fetchQuotations]
  );

  const deleteAllEnquiriesAndQuotations = useCallback(async () => {
    await fetch(ENQUIRY_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'deleteAllEnquiries' }),
    });

    const allQuotationIds = quotationsRef.current.map((q) => q.id);

    if (allQuotationIds.length > 0) {
      await supabase.from('quotation_items').delete().in('quotation_id', allQuotationIds);
      await supabase.from('quotation_events').delete().in('quotation_id', allQuotationIds);
      await supabase.from('quotations').delete().in('id', allQuotationIds);
    }

    await Promise.all([fetchEnquiries(), fetchQuotations()]);
  }, [fetchEnquiries, fetchQuotations]);

  // ---------- Apex's "brain": understands a spoken command/question and responds ----------
  const lastDiscussedQuotationIdRef = useRef(null);
  // Holds a partially-built quotation while Apex is waiting for the answer to
  // exactly one follow-up question (e.g. "what delivery time?").
  const pendingClarificationRef = useRef(null);

  const updateVoiceLogResponse = useCallback((commandId, responseText, responseStatus) => {
    setVoiceLog((prev) =>
      prev.map((entry) =>
        entry.id === commandId ? { ...entry, response: responseText, responseStatus } : entry
      )
    );
  }, []);

  // Decides what to do with a (possibly partial) quotation: send it if everything
  // needed is present, ask ONE follow-up question if exactly one useful field is
  // missing, or fall back to the manual review modal if too much is missing/unclear.
  const proceedWithQuotation = useCallback(
    async (reviewData, commandId, isHindi, speakLang) => {
      const hasIdentity = Boolean(reviewData.matchedEnquiryFound && reviewData.email);
      const hasRate = Number(reviewData.rate) > 0;
      const hasDelivery = Boolean(reviewData.delivery_days);

      if (hasIdentity && hasRate && !hasDelivery) {
        const question = isHindi
          ? `${reviewData.customer_name} ke liye rate ${reviewData.rate} rupaye mil gaya. Delivery time kitne din doon?`
          : `Got the rate of ${reviewData.rate} rupees for ${reviewData.customer_name}. How many days for delivery?`;

        speak(question, speakLang);
        updateVoiceLogResponse(commandId, question, 'needs_review');

        pendingClarificationRef.current = { field: 'delivery_days', reviewData, question };
        return;
      }

      if (hasIdentity && hasDelivery && !hasRate) {
        const question = isHindi
          ? `Delivery ${reviewData.delivery_days} din mil gayi. Rate kitni doon?`
          : `Got the delivery time of ${reviewData.delivery_days} days. What rate should I quote?`;

        speak(question, speakLang);
        updateVoiceLogResponse(commandId, question, 'needs_review');

        pendingClarificationRef.current = { field: 'rate', reviewData, question };
        return;
      }

      if (hasIdentity && hasRate && hasDelivery) {
        const workingText = isHindi
          ? `${reviewData.customer_name} ke liye ${reviewData.rate} rupaye ki rate, ${reviewData.delivery_days} din delivery ke saath quotation bana raha hoon. Abhi bhej raha hoon.`
          : `Creating a quotation for ${reviewData.customer_name} at rate ${reviewData.rate} rupees with ${reviewData.delivery_days} days delivery. Sending it now.`;

        speak(workingText, speakLang);
        updateVoiceLogResponse(commandId, workingText, 'working');

        try {
          const quotation = await createAndSendQuotation(reviewData, true);
          lastDiscussedQuotationIdRef.current = quotation.id;
          await fetchQuotations();

          const doneText = isHindi
            ? `Ho gaya. Quotation ${quotation.quotation_no} ${reviewData.customer_name} ko bhej diya gaya hai.`
            : `Done. Quotation ${quotation.quotation_no} has been sent to ${reviewData.customer_name}.`;

          speak(doneText, speakLang);
          updateVoiceLogResponse(commandId, doneText, 'done');
        } catch (createError) {
          console.error('Apex auto-create quotation error:', createError);

          const failText = isHindi
            ? 'Maaf kijiye, quotation bhejne mein problem aa gayi.'
            : 'Sorry, there was a problem sending the quotation.';

          speak(failText, speakLang);
          updateVoiceLogResponse(
            commandId,
            `${isHindi ? 'Bhej nahi paya' : 'Could not send'}: ${createError.message}`,
            'error'
          );
        }
        return;
      }

      // Too much missing (no identity match, or both rate+delivery missing) — hand off to manual review
      const missing = [];

      if (isHindi) {
        if (!reviewData.matchedEnquiryFound) missing.push('matching enquiry');
        if (!reviewData.email) missing.push('customer email');
        if (!hasRate) missing.push('rate');
      } else {
        if (!reviewData.matchedEnquiryFound) missing.push('a matching enquiry');
        if (!reviewData.email) missing.push('customer email');
        if (!hasRate) missing.push('the rate');
      }

      const askText = isHindi
        ? `Mujhe thodi aur jaankari chahiye — ${missing.join(', ')} missing hai. Please review karke complete karein.`
        : `I found some details, but I'm missing ${missing.join(', ')}. Please review and complete it.`;

      const shortAskText = isHindi
        ? 'Mujhe thodi aur jaankari chahiye — please details review kar lijiye.'
        : 'I need a bit more information — please review the details I found.';

      speak(shortAskText, speakLang);
      updateVoiceLogResponse(commandId, askText, 'needs_review');
      setQuotationReview(reviewData);
    },
    [speak, createAndSendQuotation, fetchQuotations, updateVoiceLogResponse]
  );

  const resolveTargetQuotation = useCallback((parsed) => {
    const list = quotationsRef.current;

    const hasExplicitReference = Boolean(
      parsed.enquiry_number || parsed.company_name || parsed.customer_name
    );

    // Most reliable: the quotation itself stores the same permanent enquiry
    // number, so a direct match needs no fuzzy name comparison at all.
    if (parsed.enquiry_number) {
      const directMatch = list
        .filter((q) => Number(q.enquiry_no) === Number(parsed.enquiry_number))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (directMatch) return directMatch;
    }

    let companyGuess = (parsed.company_name || '').toLowerCase().trim();
    let nameGuess = (parsed.customer_name || '').toLowerCase().trim();

    if (parsed.enquiry_number) {
      const referencedEnquiry = enquiriesWithSrNoRef.current.find(
        (item) => item.srNo === Number(parsed.enquiry_number)
      );

      if (referencedEnquiry) {
        companyGuess = (referencedEnquiry.companyName || '').toLowerCase().trim();
        nameGuess = (referencedEnquiry.name || '').toLowerCase().trim();
      }
    }

    let target = null;

    if (companyGuess || nameGuess) {
      target =
        list
          .filter((q) => {
            const company = (q.company_name || '').toLowerCase().trim();
            const name = (q.customer_name || '').toLowerCase().trim();

            const companyMatches =
              companyGuess && company && (company.includes(companyGuess) || companyGuess.includes(company));
            const nameMatches =
              nameGuess && name && (name.includes(nameGuess) || nameGuess.includes(name));

            return companyMatches || nameMatches;
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
    }

    // Only fall back to whatever was last discussed if the owner didn't give
    // any explicit reference this time (e.g. "iska status batao"). If they DID
    // name a specific enquiry/company/customer and it simply wasn't found,
    // falling back here would silently answer about the WRONG quotation —
    // worse than saying "not found".
    if (!target && !hasExplicitReference && lastDiscussedQuotationIdRef.current) {
      target = list.find((q) => q.id === lastDiscussedQuotationIdRef.current) || null;
    }

    return target;
  }, []);

  // Applies a rate change or discount to an already-identified target quotation
  // and resends it. Shared by the explicit "revise_quotation" intent and by the
  // safety-net redirect from "create_quotation" when a quotation already exists.
  const handleRevisionForTarget = useCallback(
    async (target, parsed, commandId, isHindi, speakLang) => {
      lastDiscussedQuotationIdRef.current = target.id;

      // Only touch these if the owner actually said them this time — never
      // invent or default them.
      const optionalUpdates = {};
      if (parsed.payment_terms) optionalUpdates.paymentTerms = parsed.payment_terms;
      if (parsed.delivery_days) optionalUpdates.deliveryDays = parsed.delivery_days;
      if (parsed.warranty) optionalUpdates.warrantyTerms = parsed.warranty;

      // If the owner also dictated something to explain in the email
      // alongside this revision, compose it into a proper professional
      // paragraph so the customer sees WHY things changed, not just a
      // generic "please find attached" resend.
      if (parsed.revision_message) {
        try {
          const contextText = `Quotation ${target.quotation_no} for ${
            target.customer_name || target.company_name
          } is being revised and resent.`;

          const composeResponse = await fetch(`${API_URL}/ai/compose-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instruction: parsed.revision_message, contextText }),
          });

          const composeResult = await composeResponse.json();

          if (composeResponse.ok && composeResult.success && composeResult.messageHtml) {
            optionalUpdates.customMessageHtml = composeResult.messageHtml;
          }
        } catch (composeError) {
          console.error('Apex compose revision message error:', composeError);
        }
      }

      if (Number(parsed.rate) > 0) {
        const newRate = Number(parsed.rate);

        const workingText = isHindi
          ? `${target.quotation_no} ko naye rate ${newRate} rupaye ke saath dobara bhej raha hoon.`
          : `Resending ${target.quotation_no} with the new rate of ${newRate} rupees.`;

        speak(workingText, speakLang);
        updateVoiceLogResponse(commandId, workingText, 'working');

        try {
          const updated = await reviseAndSendQuotation(target, {
            rate: newRate,
            ...optionalUpdates,
          });
          await fetchQuotations();

          const doneText = isHindi
            ? `Ho gaya. ${updated.quotation_no} naye rate ke saath dobara bhej diya gaya.`
            : `Done. ${updated.quotation_no} has been resent with the new rate.`;

          speak(doneText, speakLang);
          updateVoiceLogResponse(commandId, doneText, 'done');
        } catch (reviseError) {
          console.error('Apex revise quotation error:', reviseError);

          const failText = isHindi
            ? 'Maaf kijiye, dobara bhejne mein problem aa gayi.'
            : 'Sorry, there was a problem resending the quotation.';

          speak(failText, speakLang);
          updateVoiceLogResponse(
            commandId,
            `${isHindi ? 'Nahi bhej paya' : 'Could not resend'}: ${reviseError.message}`,
            'error'
          );
        }
        return;
      }

      if (Number(parsed.discount_percent) > 0) {
        try {
          const { data: items, error: itemsError } = await supabase
            .from('quotation_items')
            .select('rate')
            .eq('quotation_id', target.id)
            .order('created_at', { ascending: true })
            .limit(1);

          if (itemsError) throw new Error(itemsError.message);

          const oldRate = Number(items?.[0]?.rate) || 0;
          const discountPercent = Number(parsed.discount_percent);
          const newRate = Math.round(oldRate * (1 - discountPercent / 100));

          const workingText = isHindi
            ? `${target.quotation_no} par ${discountPercent}% discount laga kar naya rate ${newRate} rupaye ban raha hai. Dobara bhej raha hoon.`
            : `Applying a ${discountPercent}% discount to ${target.quotation_no}, new rate is ${newRate} rupees. Resending now.`;

          speak(workingText, speakLang);
          updateVoiceLogResponse(commandId, workingText, 'working');

          const updated = await reviseAndSendQuotation(target, {
            discountPercent,
            ...optionalUpdates,
          });
          await fetchQuotations();

          const doneText = isHindi
            ? `Ho gaya. ${updated.quotation_no} ${newRate} rupaye ke naye rate ke saath dobara bhej diya gaya.`
            : `Done. ${updated.quotation_no} has been resent with the new rate of ${newRate} rupees.`;

          speak(doneText, speakLang);
          updateVoiceLogResponse(commandId, doneText, 'done');
        } catch (reviseError) {
          console.error('Apex revise quotation error:', reviseError);

          const failText = isHindi
            ? 'Maaf kijiye, dobara bhejne mein problem aa gayi.'
            : 'Sorry, there was a problem resending the quotation.';

          speak(failText, speakLang);
          updateVoiceLogResponse(
            commandId,
            `${isHindi ? 'Nahi bhej paya' : 'Could not resend'}: ${reviseError.message}`,
            'error'
          );
        }
        return;
      }

      // No price change mentioned at all — if delivery/warranty/payment terms
      // were mentioned instead, apply just those and resend with pricing
      // left exactly as it was.
      if (Object.keys(optionalUpdates).length > 0) {
        const workingText = isHindi
          ? `${target.quotation_no} ki details update karke dobara bhej raha hoon.`
          : `Updating ${target.quotation_no} and resending now.`;

        speak(workingText, speakLang);
        updateVoiceLogResponse(commandId, workingText, 'working');

        try {
          const updated = await reviseAndSendQuotation(target, { ...optionalUpdates });
          await fetchQuotations();

          const doneText = isHindi
            ? `Ho gaya. ${updated.quotation_no} dobara bhej diya gaya.`
            : `Done. ${updated.quotation_no} has been resent with the updated details.`;

          speak(doneText, speakLang);
          updateVoiceLogResponse(commandId, doneText, 'done');
        } catch (reviseError) {
          console.error('Apex revise quotation error:', reviseError);

          const failText = isHindi
            ? 'Maaf kijiye, dobara bhejne mein problem aa gayi.'
            : 'Sorry, there was a problem resending the quotation.';

          speak(failText, speakLang);
          updateVoiceLogResponse(
            commandId,
            `${isHindi ? 'Nahi bhej paya' : 'Could not resend'}: ${reviseError.message}`,
            'error'
          );
        }
        return;
      }

      try {
        const { data: items, error: itemsError } = await supabase
          .from('quotation_items')
          .select('rate')
          .eq('quotation_id', target.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (itemsError) throw new Error(itemsError.message);

        const oldRate = Number(items?.[0]?.rate) || 0;

        const question = isHindi
          ? `${target.quotation_no} ke liye kitna percent discount doon?`
          : `How much discount (in percent) should I apply to ${target.quotation_no}?`;

        speak(question, speakLang);
        updateVoiceLogResponse(commandId, question, 'needs_review');

        pendingClarificationRef.current = {
          kind: 'revision',
          quotation: target,
          discountBased: true,
          oldRate,
          question,
        };
      } catch (fetchError) {
        console.error('Apex revise quotation - fetch item error:', fetchError);

        const errText = isHindi ? 'Kuch galti ho gayi.' : 'Something went wrong.';
        speak(errText, speakLang);
        updateVoiceLogResponse(commandId, errText, 'error');
      }
    },
    [speak, updateVoiceLogResponse, reviseAndSendQuotation, fetchQuotations]
  );

  const processApexCommand = useCallback(
    async (text) => {
      const commandId = Date.now();
      const isHindi = voiceLanguage === 'hi-IN';
      const speakLang = voiceLanguage;

      setVoiceLog((prev) =>
        [
          { id: commandId, timestamp: new Date(), text, response: null, responseStatus: 'thinking' },
          ...prev,
        ].slice(0, MAX_VOICE_LOG_ITEMS)
      );

      // ---- If Apex just asked a follow-up question, treat this as the answer ----
      if (pendingClarificationRef.current) {
        const pending = pendingClarificationRef.current;
        pendingClarificationRef.current = null;

        if (pending.kind === 'delete_all_confirm') {
          const normalized = text.toLowerCase();
          const confirmed =
            normalized.includes('confirm') ||
            normalized.includes('haan') ||
            normalized.includes('yes') ||
            normalized.includes('kar do') ||
            normalized.includes('kardo');

          if (!confirmed) {
            const cancelText = isHindi
              ? 'Theek hai, kuch delete nahi kiya gaya.'
              : "Okay, nothing was deleted.";
            speak(cancelText, speakLang);
            updateVoiceLogResponse(commandId, cancelText, 'done');
            return;
          }

          const workingText = isHindi
            ? 'Theek hai, saari enquiries aur unki quotations delete kar raha hoon.'
            : 'Understood, deleting all enquiries and their quotations now.';

          speak(workingText, speakLang);
          updateVoiceLogResponse(commandId, workingText, 'working');

          try {
            await deleteAllEnquiriesAndQuotations();

            const doneText = isHindi
              ? 'Ho gaya. Saari enquiries aur quotations delete kar di gayi hain.'
              : 'Done. All enquiries and their quotations have been deleted.';

            speak(doneText, speakLang);
            updateVoiceLogResponse(commandId, doneText, 'done');
          } catch (deleteError) {
            console.error('Apex delete all error:', deleteError);

            const failText = isHindi
              ? 'Maaf kijiye, delete karne mein problem aa gayi.'
              : 'Sorry, there was a problem deleting those.';

            speak(failText, speakLang);
            updateVoiceLogResponse(commandId, `Error: ${deleteError.message}`, 'error');
          }
          return;
        }

        if (pending.kind === 'delete_range_confirm') {
          const normalized = text.toLowerCase();
          const confirmed =
            normalized.includes('confirm') ||
            normalized.includes('haan') ||
            normalized.includes('yes') ||
            normalized.includes('kar do') ||
            normalized.includes('kardo');

          if (!confirmed) {
            const cancelText = isHindi
              ? 'Theek hai, kuch delete nahi kiya gaya.'
              : 'Okay, nothing was deleted.';
            speak(cancelText, speakLang);
            updateVoiceLogResponse(commandId, cancelText, 'done');
            return;
          }

          const workingText = isHindi
            ? `Theek hai, in ${pending.enquiries.length} enquiries ko delete kar raha hoon.`
            : `Understood, deleting these ${pending.enquiries.length} enquiries now.`;

          speak(workingText, speakLang);
          updateVoiceLogResponse(commandId, workingText, 'working');

          try {
            let totalQuotationsDeleted = 0;

            for (const enquiry of pending.enquiries) {
              const { deletedQuotationCount } = await deleteEnquiryAndQuotation(enquiry);
              totalQuotationsDeleted += deletedQuotationCount;
            }

            const doneText = isHindi
              ? `Ho gaya. ${pending.enquiries.length} enquiries delete kar di gayi${
                  totalQuotationsDeleted > 0 ? ` aur unki ${totalQuotationsDeleted} quotations bhi` : ''
                }.`
              : `Done. ${pending.enquiries.length} enquiries have been deleted${
                  totalQuotationsDeleted > 0 ? `, along with ${totalQuotationsDeleted} linked quotation(s)` : ''
                }.`;

            speak(doneText, speakLang);
            updateVoiceLogResponse(commandId, doneText, 'done');
          } catch (deleteError) {
            console.error('Apex delete range error:', deleteError);

            const failText = isHindi
              ? 'Maaf kijiye, delete karne mein problem aa gayi.'
              : 'Sorry, there was a problem deleting those.';

            speak(failText, speakLang);
            updateVoiceLogResponse(commandId, `Error: ${deleteError.message}`, 'error');
          }
          return;
        }

        const numberMatch = text.match(/\d+(\.\d+)?/);

        if (!numberMatch) {
          const retryText = isHindi
            ? `Mujhe ek number chahiye. ${pending.question}`
            : `I need a number for that. ${pending.question}`;

          speak(retryText, speakLang);
          updateVoiceLogResponse(commandId, retryText, 'needs_review');
          pendingClarificationRef.current = pending; // ask again, keep waiting
          return;
        }

        const numberValue = Number(numberMatch[0]);

        if (pending.kind === 'revision') {
          const newRate = pending.discountBased
            ? Math.round(pending.oldRate * (1 - numberValue / 100))
            : Math.round(numberValue);

          const workingText = isHindi
            ? `Naye rate ${newRate} rupaye ke saath ${pending.quotation.quotation_no} dobara bhej raha hoon.`
            : `Resending ${pending.quotation.quotation_no} with the new rate of ${newRate} rupees.`;

          speak(workingText, speakLang);
          updateVoiceLogResponse(commandId, workingText, 'working');

          try {
            const updated = await reviseAndSendQuotation(
              pending.quotation,
              pending.discountBased ? { discountPercent: numberValue } : { rate: newRate }
            );
            lastDiscussedQuotationIdRef.current = updated.id;
            await fetchQuotations();

            const doneText = isHindi
              ? `Ho gaya. ${updated.quotation_no} naye rate ke saath dobara bhej diya gaya.`
              : `Done. ${updated.quotation_no} has been resent with the new rate.`;

            speak(doneText, speakLang);
            updateVoiceLogResponse(commandId, doneText, 'done');
          } catch (reviseError) {
            console.error('Apex revise quotation error:', reviseError);

            const failText = isHindi
              ? 'Maaf kijiye, dobara bhejne mein problem aa gayi.'
              : 'Sorry, there was a problem resending the quotation.';

            speak(failText, speakLang);
            updateVoiceLogResponse(
              commandId,
              `${isHindi ? 'Nahi bhej paya' : 'Could not resend'}: ${reviseError.message}`,
              'error'
            );
          }
          return;
        }

        const updatedReviewData = {
          ...pending.reviewData,
          [pending.field]: numberValue,
        };

        await proceedWithQuotation(updatedReviewData, commandId, isHindi, speakLang);
        return;
      }

      // Hard safeguards for high-stakes delete commands — Gemini has sometimes
      // misclassified these as plain questions instead of actions, so detect
      // them directly from keywords first, no AI call needed.
      const lowerText = text.toLowerCase();
      const hasDeleteWord = /(delete|hata|hta|mita|mta|nikaal|nikal|remove|khatam|hatado|delete kar)/.test(
        lowerText
      );
      const hasEnquiryWord = /(enquiry|enquiries|inquiry|inquiries|enqury|inqury)/.test(lowerText);

      // Range delete first: e.g. "20 se 22 tak", "20 to 22" — must be checked
      // before the "delete all" check below, since a range command may also
      // contain a word like "sari" ("delete kar do sari") without meaning
      // literally every enquiry.
      const rangeMatch = lowerText.match(/(\d+)\s*(?:se|to|lekar|se lekar|-)\s*(\d+)\s*(?:tak)?/);

      if (hasDeleteWord && hasEnquiryWord && rangeMatch) {
        const lo = Math.min(Number(rangeMatch[1]), Number(rangeMatch[2]));
        const hi = Math.max(Number(rangeMatch[1]), Number(rangeMatch[2]));

        const matchedEnquiries = enquiriesWithSrNoRef.current.filter(
          (item) => item.srNo >= lo && item.srNo <= hi
        );

        if (matchedEnquiries.length === 0) {
          const answer = isHindi
            ? `Enquiry number ${lo} se ${hi} tak mujhe koi enquiry nahi mili.`
            : `I couldn't find any enquiries numbered ${lo} to ${hi}.`;

          speak(answer, speakLang);
          updateVoiceLogResponse(commandId, answer, 'unclear');
        } else {
          const numbersList = matchedEnquiries.map((item) => `#${item.srNo}`).join(', ');

          const question = isHindi
            ? `Yeh ${matchedEnquiries.length} enquiries delete karne wala hoon: ${numbersList} — aur unki quotations bhi. Confirm karne ke liye "haan confirm karo" boliye.`
            : `I'm about to delete ${matchedEnquiries.length} enquiries: ${numbersList} — along with their quotations. Say "yes confirm" to proceed.`;

          speak(question, speakLang);
          updateVoiceLogResponse(commandId, question, 'needs_review');

          pendingClarificationRef.current = {
            kind: 'delete_range_confirm',
            enquiries: matchedEnquiries,
            question,
          };
        }
        return;
      }

      const hasAllWord = /(sari|saari|sabhi|sab |poori|puri|total|entire|every|all )/.test(
        `${lowerText} `
      );

      if (hasDeleteWord && hasAllWord && hasEnquiryWord) {
        const totalCount = enquiriesWithSrNoRef.current.length;

        const question = isHindi
          ? `Aap sach mein saari ${totalCount} enquiries aur unki quotations permanently delete karna chahte hain? Yeh wapas nahi ho sakta. Confirm karne ke liye "haan confirm karo" boliye.`
          : `Are you sure you want to permanently delete all ${totalCount} enquiries and their quotations? This cannot be undone. Say "yes confirm" to proceed.`;

        speak(question, speakLang);
        updateVoiceLogResponse(commandId, question, 'needs_review');

        pendingClarificationRef.current = {
          kind: 'delete_all_confirm',
          question,
        };
        return;
      }

      try {
        const response = await fetch(`${API_URL}/ai/apex-command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Could not understand the command');
        }

        const parsed = result.parsed || {};

        if (parsed.intent === 'create_quotation') {
          // A specific enquiry number (e.g. "enquiry 32") is the most reliable match —
          // check it before falling back to fuzzy name/company matching.
          let matchedEnquiry = null;

          if (parsed.enquiry_number) {
            matchedEnquiry =
              enquiriesWithSrNoRef.current.find(
                (item) => item.srNo === Number(parsed.enquiry_number)
              ) || null;
          }

          if (!matchedEnquiry) {
            matchedEnquiry = findMatchingEnquiry(parsed.company_name, parsed.customer_name);
          }

          // Safety net: if a quotation for this same enquiry/customer was already
          // sent, this is really a revision request (even if the AI classified it
          // as "create") — never create a duplicate quotation for the same enquiry.
          if (matchedEnquiry) {
            const matchedCompany = (matchedEnquiry.companyName || '').toLowerCase().trim();
            const matchedName = (matchedEnquiry.name || '').toLowerCase().trim();

            const existingQuotation = quotationsRef.current
              .filter((q) => {
                const company = (q.company_name || '').toLowerCase().trim();
                const name = (q.customer_name || '').toLowerCase().trim();

                const companyMatches = matchedCompany && company && company === matchedCompany;
                const nameMatches = matchedName && name && name === matchedName;

                return (companyMatches && nameMatches) || (companyMatches && !matchedName);
              })
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

            if (existingQuotation && existingQuotation.status !== 'Draft') {
              await handleRevisionForTarget(existingQuotation, parsed, commandId, isHindi, speakLang);
              return;
            }
          }

          const gstIncluded = (parsed.gst_note || '').toLowerCase().includes('include');

          const reviewData = {
            sourceText: `Voice command: "${text}"`,
            matchedEnquiryFound: Boolean(matchedEnquiry),
            enquiry_no: matchedEnquiry?.id ? Number(matchedEnquiry.id) : null,
            customer_name: matchedEnquiry?.name || parsed.customer_name || '',
            company_name: matchedEnquiry?.companyName || parsed.company_name || '',
            mobile: matchedEnquiry?.contactNumber || '',
            email: matchedEnquiry?.emailId || '',
            address: matchedEnquiry?.address || '',
            product_name: matchedEnquiry?.productRequired || parsed.product_hint || '',
            part_number: matchedEnquiry?.partNumber || '',
            quantity: Number(matchedEnquiry?.quantity) || 1,
            rate: Number(parsed.rate) || 0,
            gst_percent: gstIncluded ? 0 : 18,
            delivery_days: parsed.delivery_days || '',
            payment_terms: parsed.payment_terms || '',
            warranty_terms: parsed.warranty || '',
            notes: parsed.notes || '',
          };

          await proceedWithQuotation(reviewData, commandId, isHindi, speakLang);
        } else if (parsed.intent === 'revise_quotation') {
          const target = resolveTargetQuotation(parsed);

          if (!target) {
            const answer = isHindi
              ? 'Mujhe samajh nahi aaya kaunsi quotation revise karni hai. Company ka naam ya enquiry number boliye.'
              : "I'm not sure which quotation to revise. Please mention the company name or enquiry number.";

            speak(answer, speakLang);
            updateVoiceLogResponse(commandId, answer, 'unclear');
          } else {
            await handleRevisionForTarget(target, parsed, commandId, isHindi, speakLang);
          }
        } else if (parsed.intent === 'delete_enquiry') {
          if (parsed.delete_all) {
            const totalCount = enquiriesWithSrNoRef.current.length;

            const question = isHindi
              ? `Aap sach mein saari ${totalCount} enquiries aur unki quotations permanently delete karna chahte hain? Yeh wapas nahi ho sakta. Confirm karne ke liye "haan confirm karo" boliye.`
              : `Are you sure you want to permanently delete all ${totalCount} enquiries and their quotations? This cannot be undone. Say "yes confirm" to proceed.`;

            speak(question, speakLang);
            updateVoiceLogResponse(commandId, question, 'needs_review');

            pendingClarificationRef.current = {
              kind: 'delete_all_confirm',
              question,
            };
          } else if (parsed.enquiry_number_from && parsed.enquiry_number_to) {
            const from = Number(parsed.enquiry_number_from);
            const to = Number(parsed.enquiry_number_to);
            const lo = Math.min(from, to);
            const hi = Math.max(from, to);

            const matchedEnquiries = enquiriesWithSrNoRef.current.filter(
              (item) => item.srNo >= lo && item.srNo <= hi
            );

            if (matchedEnquiries.length === 0) {
              const answer = isHindi
                ? `Enquiry number ${lo} se ${hi} tak mujhe koi enquiry nahi mili.`
                : `I couldn't find any enquiries numbered ${lo} to ${hi}.`;

              speak(answer, speakLang);
              updateVoiceLogResponse(commandId, answer, 'unclear');
            } else {
              const numbersList = matchedEnquiries.map((item) => `#${item.srNo}`).join(', ');

              const question = isHindi
                ? `Yeh ${matchedEnquiries.length} enquiries delete karne wala hoon: ${numbersList} — aur unki quotations bhi. Confirm karne ke liye "haan confirm karo" boliye.`
                : `I'm about to delete ${matchedEnquiries.length} enquiries: ${numbersList} — along with their quotations. Say "yes confirm" to proceed.`;

              speak(question, speakLang);
              updateVoiceLogResponse(commandId, question, 'needs_review');

              pendingClarificationRef.current = {
                kind: 'delete_range_confirm',
                enquiries: matchedEnquiries,
                question,
              };
            }
          } else {
            let matchedEnquiry = null;

            if (parsed.enquiry_number) {
              matchedEnquiry =
                enquiriesWithSrNoRef.current.find(
                  (item) => item.srNo === Number(parsed.enquiry_number)
                ) || null;
            }

            if (!matchedEnquiry) {
              matchedEnquiry = findMatchingEnquiry(parsed.company_name, parsed.customer_name);
            }

            if (!matchedEnquiry) {
              const answer = isHindi
                ? 'Mujhe samajh nahi aaya kaunsi enquiry delete karni hai. Enquiry number ya company ka naam boliye.'
                : "I'm not sure which enquiry to delete. Please mention the enquiry number or company name.";

              speak(answer, speakLang);
              updateVoiceLogResponse(commandId, answer, 'unclear');
            } else {
              const workingText = isHindi
                ? `Enquiry #${matchedEnquiry.srNo} aur uske saath judi quotation delete kar raha hoon.`
                : `Deleting enquiry #${matchedEnquiry.srNo} and its linked quotation.`;

              speak(workingText, speakLang);
              updateVoiceLogResponse(commandId, workingText, 'working');

              try {
                const { deletedQuotationCount } = await deleteEnquiryAndQuotation(matchedEnquiry);

                const doneText = isHindi
                  ? `Ho gaya. Enquiry #${matchedEnquiry.srNo} delete kar di gayi${
                      deletedQuotationCount > 0 ? ' aur uski quotation bhi hata di gayi' : ''
                    }.`
                  : `Done. Enquiry #${matchedEnquiry.srNo} has been deleted${
                      deletedQuotationCount > 0 ? ', along with its quotation' : ''
                    }.`;

                speak(doneText, speakLang);
                updateVoiceLogResponse(commandId, doneText, 'done');
              } catch (deleteError) {
                console.error('Apex delete enquiry error:', deleteError);

                const failText = isHindi
                  ? 'Maaf kijiye, delete karne mein problem aa gayi.'
                  : 'Sorry, there was a problem deleting that.';

                speak(failText, speakLang);
                updateVoiceLogResponse(commandId, `Error: ${deleteError.message}`, 'error');
              }
            }
          }
        } else if (parsed.intent === 'send_message') {
          const target = resolveTargetQuotation(parsed);

          if (!target) {
            const answer = isHindi
              ? 'Mujhe samajh nahi aaya kis customer ko message bhejna hai. Company ka naam ya enquiry number boliye.'
              : "I'm not sure which customer to message. Please mention the company name or enquiry number.";

            speak(answer, speakLang);
            updateVoiceLogResponse(commandId, answer, 'unclear');
          } else if (!parsed.message_content) {
            const answer = isHindi
              ? 'Aap unhe kya bolna chahte hain, wo bataiye.'
              : 'What would you like me to tell them?';

            speak(answer, speakLang);
            updateVoiceLogResponse(commandId, answer, 'needs_review');
          } else {
            lastDiscussedQuotationIdRef.current = target.id;

            const workingText = isHindi
              ? `${target.customer_name || target.company_name} ko professional email bana kar bhej raha hoon.`
              : `Composing a professional email to ${target.customer_name || target.company_name} and sending it now.`;

            speak(workingText, speakLang);
            updateVoiceLogResponse(commandId, workingText, 'working');

            try {
              await sendCustomMessage(target, parsed.message_content);
              await fetchQuotations();

              const doneText = isHindi
                ? `Ho gaya, message bhej diya gaya hai.`
                : `Done — the message has been sent.`;

              speak(doneText, speakLang);
              updateVoiceLogResponse(commandId, doneText, 'done');
            } catch (messageError) {
              console.error('Apex send message error:', messageError);

              const failText = isHindi
                ? 'Maaf kijiye, message bhejne mein problem aa gayi.'
                : 'Sorry, there was a problem sending that message.';

              speak(failText, speakLang);
              updateVoiceLogResponse(
                commandId,
                `${isHindi ? 'Nahi bhej paya' : 'Could not send'}: ${messageError.message}`,
                'error'
              );
            }
          }
        } else if (parsed.intent === 'set_contact_preference') {
          const target = resolveTargetQuotation(parsed);

          if (!target) {
            const answer = isHindi
              ? 'Mujhe samajh nahi aaya kis customer ki baat kar rahe hain. Company ka naam ya enquiry number boliye.'
              : "I'm not sure which customer you mean. Please mention the company name or enquiry number.";

            speak(answer, speakLang);
            updateVoiceLogResponse(commandId, answer, 'unclear');
          } else {
            const doNotContact = parsed.do_not_contact !== false;
            lastDiscussedQuotationIdRef.current = target.id;

            try {
              await setContactPreference(target, doNotContact);

              const answer = doNotContact
                ? isHindi
                  ? `Theek hai, ab ${target.customer_name || target.company_name} ko koi mail nahi jayega — na follow-up, na kuch aur, jab tak aap dobara na bolein.`
                  : `Understood — no more emails, including follow-ups, will go to ${
                      target.customer_name || target.company_name
                    } until you say otherwise.`
                : isHindi
                  ? `Theek hai, ${target.customer_name || target.company_name} ko ab se dobara contact kiya ja sakta hai.`
                  : `Understood — ${target.customer_name || target.company_name} can be contacted again now.`;

              speak(answer, speakLang);
              updateVoiceLogResponse(commandId, answer, 'done');
            } catch (prefError) {
              console.error('Apex set contact preference error:', prefError);

              const errText = isHindi ? 'Kuch galti ho gayi.' : 'Something went wrong.';
              speak(errText, speakLang);
              updateVoiceLogResponse(commandId, `Error: ${prefError.message}`, 'error');
            }
          }
        } else if (parsed.intent === 'discuss') {
          let target = resolveTargetQuotation(parsed);
          let matchedEnquiry = null;

          const hasAnyReference = Boolean(
            parsed.enquiry_number || parsed.company_name || parsed.customer_name
          );

          if (!target) {
            if (parsed.enquiry_number) {
              matchedEnquiry =
                enquiriesWithSrNoRef.current.find(
                  (item) => item.srNo === Number(parsed.enquiry_number)
                ) || null;
            }

            if (!matchedEnquiry) {
              matchedEnquiry = findMatchingEnquiry(parsed.company_name, parsed.customer_name);
            }
          }

          if (!target && !matchedEnquiry && hasAnyReference) {
            // The owner named a SPECIFIC customer/enquiry/number and it just
            // doesn't exist — say so plainly rather than guessing.
            const answer = isHindi
              ? 'Mujhe samajh nahi aaya aap kis customer ya quotation ki baat kar rahe hain. Company ka naam ya enquiry number bhi boliye.'
              : "I'm not sure which customer or quotation you mean. Please mention the company name or enquiry number.";

            speak(answer, speakLang);
            updateVoiceLogResponse(commandId, answer, 'unclear');
          } else {
            try {
              let historyText = '';
              let contextText = '';

              if (target) {
                lastDiscussedQuotationIdRef.current = target.id;
                historyText = await fetchQuotationHistory(target.id);
                contextText = `Quotation ${target.quotation_no} for ${
                  target.customer_name || target.company_name
                } (${target.company_name || 'company unknown'}). Current status: ${target.status}.${
                  target.customer_replied
                    ? ` The customer's most recent reply${
                        target.reply_intent ? ` (summarized: ${target.reply_intent})` : ''
                      }${target.reply_snippet ? ` — actual text: "${target.reply_snippet}"` : ''} was received ${
                        target.replied_at ? formatRelativeTime(new Date(target.replied_at)) : 'recently'
                      }.`
                    : ' The customer has not replied yet.'
                }`;
              } else if (matchedEnquiry) {
                contextText = `This is enquiry #${matchedEnquiry.srNo || '?'} from ${
                  matchedEnquiry.name
                } (${matchedEnquiry.companyName || 'no company'}) for "${
                  matchedEnquiry.productRequired || 'a product'
                }", received ${
                  matchedEnquiry.dateTime
                    ? formatRelativeTime(new Date(matchedEnquiry.dateTime))
                    : 'recently'
                }. No quotation has been created for this enquiry yet.`;
              } else {
                // No specific entity referenced at all — this is a general
                // question about the business (e.g. "any new enquiries?",
                // "what's pending today?"). Give Apex a snapshot of the
                // current overall state instead of asking who they mean.
                const allEnquiries = enquiriesWithSrNoRef.current;
                const allQuotations = quotationsRef.current;

                const recentEnquiriesText = allEnquiries
                  .slice(0, 8)
                  .map(
                    (e) =>
                      `#${e.srNo} — ${e.name || 'unknown'} (${e.companyName || 'no company'}) wants "${
                        e.productRequired || 'a product'
                      }", received ${
                        e.dateTime ? formatRelativeTime(new Date(e.dateTime)) : 'recently'
                      }, status: ${e.status || 'New'}`
                  )
                  .join('\n');

                const pendingQuotations = allQuotations.filter((q) => q.status === 'Draft').length;
                const sentAwaitingReply = allQuotations.filter(
                  (q) => q.status === 'Sent' && !q.customer_replied
                ).length;
                const repliesNeedingAttention = allQuotations.filter(
                  (q) => q.status === 'Sent' && q.customer_replied
                ).length;

                contextText = `Overall business snapshot right now:
- Total enquiries on record: ${allEnquiries.length}
- Quotations still in Draft (not sent yet): ${pendingQuotations}
- Quotations sent and awaiting a customer reply: ${sentAwaitingReply}
- Quotations where the customer has replied: ${repliesNeedingAttention}

Most recent enquiries (newest first):
${recentEnquiriesText || 'No enquiries on record at all right now.'}`;
              }

              const discussResponse = await fetch(`${API_URL}/ai/discuss`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: text, historyText, contextText }),
              });

              const discussResult = await discussResponse.json();

              if (!discussResponse.ok || !discussResult.success) {
                throw new Error(discussResult.error || 'Could not think through an answer');
              }

              const answer =
                discussResult.answer ||
                (isHindi
                  ? 'Maaf kijiye, jawab nahi mil paya.'
                  : 'Sorry, I could not come up with an answer.');

              speak(answer, speakLang);
              updateVoiceLogResponse(commandId, answer, 'answered');
            } catch (discussError) {
              console.error('Apex discuss error:', discussError);

              const errText = isHindi
                ? 'Maaf kijiye, sochne mein problem aa gayi.'
                : 'Sorry, I had trouble thinking that through.';

              speak(errText, speakLang);
              updateVoiceLogResponse(commandId, `Error: ${discussError.message}`, 'error');
            }
          }
        } else {
          const answer = isHindi
            ? 'Maaf kijiye, samajh nahi aaya. Dobara boliye.'
            : "Sorry, I didn't understand that. Please try again.";

          speak(answer, speakLang);
          updateVoiceLogResponse(commandId, answer, 'unclear');
        }
      } catch (error) {
        console.error('Apex process command error:', error);

        const errText = isHindi
          ? 'Kuch galti ho gayi, samajhne mein problem aayi.'
          : 'Sorry, something went wrong understanding that.';

        speak(errText, speakLang);
        updateVoiceLogResponse(commandId, `Error: ${error.message}`, 'error');
      }
    },
    [
      findMatchingEnquiry,
      proceedWithQuotation,
      resolveTargetQuotation,
      reviseAndSendQuotation,
      handleRevisionForTarget,
      sendCustomMessage,
      setContactPreference,
      deleteEnquiryAndQuotation,
      deleteAllEnquiriesAndQuotations,
      fetchQuotations,
      fetchQuotationHistory,
      speak,
      updateVoiceLogResponse,
      formatRelativeTime,
      voiceLanguage,
    ]
  );

  useEffect(() => {
    processApexCommandRef.current = processApexCommand;
  }, [processApexCommand]);

  const submitQuotationReview = useCallback(
    async (sendImmediately) => {
      if (!quotationReview) return;

      if (!quotationReview.customer_name || !quotationReview.company_name || !quotationReview.mobile) {
        setQuotationActionError('Customer name, company name and mobile are required');
        return;
      }

      setCreatingQuotation(true);
      setQuotationActionError('');

      try {
        const quantity = Number(quotationReview.quantity || 1);
        const rate = Number(quotationReview.rate || 0);
        const subtotal = quantity * rate;
        const gstPercent = Number(quotationReview.gst_percent || 0);
        const gstAmount = (subtotal * gstPercent) / 100;
        const grandTotal = subtotal + gstAmount;

        const termsText = [
          quotationReview.payment_terms,
          quotationReview.delivery_days ? `Delivery: ${quotationReview.delivery_days} days` : '',
        ]
          .filter(Boolean)
          .join('. ');

        let quotationId;

        if (quotationReview.revisingQuotationId) {
          // ---- REVISION FLOW: update existing quotation + replace its item ----
          quotationId = quotationReview.revisingQuotationId;

          const { error: updateQuotationError } = await supabase
            .from('quotations')
            .update({
              customer_name: quotationReview.customer_name,
              company_name: quotationReview.company_name,
              mobile: quotationReview.mobile,
              email: quotationReview.email,
              address: quotationReview.address,
              gst_percent: gstPercent,
              subtotal,
              gst_amount: gstAmount,
              grand_total: grandTotal,
              terms: termsText || '30% advance with Purchase Order, balance before dispatch.',
              notes: quotationReview.notes || 'Revised by Apex with an updated rate',
              status: 'Sent',
              customer_replied: false,
              replied_at: null,
              reply_snippet: null,
              sent_at: new Date().toISOString(),
              revision_count: Number(quotationReview.currentRevisionCount || 0) + 1,
            })
            .eq('id', quotationId);

          if (updateQuotationError) throw new Error(updateQuotationError.message);

          const { error: deleteItemsError } = await supabase
            .from('quotation_items')
            .delete()
            .eq('quotation_id', quotationId);

          if (deleteItemsError) throw new Error(deleteItemsError.message);

          const { error: insertItemError } = await supabase.from('quotation_items').insert([
            {
              quotation_id: quotationId,
              product_name: quotationReview.product_name || 'Product',
              part_number: quotationReview.part_number || '',
              make: '',
              description: '',
              quantity,
              rate,
              amount: subtotal,
            },
          ]);

          if (insertItemError) throw new Error(insertItemError.message);
        } else {
          // ---- NEW QUOTATION FLOW (from voice command or manually from an enquiry) ----
          const quotationNo = await generateQuotationNo();

          const quotationPayload = {
            quotation_no: quotationNo,
            enquiry_no: quotationReview.enquiry_no || null,
            customer_name: quotationReview.customer_name,
            company_name: quotationReview.company_name,
            mobile: quotationReview.mobile,
            email: quotationReview.email,
            address: quotationReview.address,
            quotation_date: new Date().toISOString().slice(0, 10),
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
            gst_percent: gstPercent,
            discount_amount: 0,
            freight_amount: 0,
            subtotal,
            gst_amount: gstAmount,
            grand_total: grandTotal,
            terms: termsText || '30% advance with Purchase Order, balance before dispatch.',
            notes:
              quotationReview.notes ||
              `Created by Apex — ${quotationReview.sourceText}`,
            status: 'Draft',
            customer_email_sent: false,
          };

          const { data: quotation, error: quotationError } = await supabase
            .from('quotations')
            .insert([quotationPayload])
            .select()
            .single();

          if (quotationError) throw new Error(quotationError.message);

          quotationId = quotation.id;

          const { error: itemError } = await supabase.from('quotation_items').insert([
            {
              quotation_id: quotationId,
              product_name: quotationReview.product_name || 'Product',
              part_number: quotationReview.part_number || '',
              make: '',
              description: '',
              quantity,
              rate,
              amount: subtotal,
            },
          ]);

          if (itemError) throw new Error(itemError.message);
        }

        const shouldSendNow = sendImmediately || Boolean(quotationReview.revisingQuotationId);

        if (shouldSendNow) {
          if (!quotationReview.email) {
            throw new Error(
              'Quotation saved, but no customer email was found — could not send. Please add the email from the Quotations page and send it from there.'
            );
          }

          const {
            data: { session },
          } = await supabase.auth.getSession();

          const sendResponse = await fetch(`${API_URL}/quotations/${quotationId}/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          const sendResult = await sendResponse.json();

          if (!sendResponse.ok || !sendResult.success) {
            throw new Error(sendResult.error || 'Quotation was created, but the email could not be sent');
          }
        }

        setQuotationReview(null);
        await fetchQuotations();

        alert(
          quotationReview.revisingQuotationId
            ? 'Revised quotation sent to the customer ✅'
            : shouldSendNow
              ? 'Quotation created and sent to the customer ✅'
              : 'Quotation saved as Draft ✅ (you can review and send it from the Quotations page)'
        );
      } catch (error) {
        console.error('Apex submit quotation error:', error);
        setQuotationActionError(error.message);
      } finally {
        setCreatingQuotation(false);
      }
    },
    [quotationReview, generateQuotationNo, fetchQuotations]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="w-8 h-8" />
              Apex
            </h1>

            <p className="text-slate-300 mt-2">AI Employee Control Center</p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className={`font-bold ${statusStyles[systemStatus]}`}>
              {statusLabel[systemStatus]}
            </div>

            <div className="text-sm text-slate-300">
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : 'Loading status...'}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="accent-blue-500"
                />
                Auto refresh (60s)
              </label>

              <button
                type="button"
                onClick={refreshAll}
                disabled={isLoading}
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {hasError && (
          <div className="mt-4 bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm rounded-lg px-3 py-2">
            {enquiriesError && <p>⚠ {enquiriesError}</p>}
            {quotationsError && <p>⚠ {quotationsError}</p>}
          </div>
        )}
      </div>

      {/* Daily Work Summary */}
      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sunrise className="w-5 h-5 text-amber-500" />
            Daily Briefing
          </h2>

          <button
            type="button"
            onClick={readBriefingAloud}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Read Aloud
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Preparing your briefing...</p>
        ) : (
          <>
            <p className="text-sm text-slate-700">{briefingText}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">New Today</p>
                <p className="text-xl font-bold text-slate-900">{newEnquiriesToday}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">To Send</p>
                <p className="text-xl font-bold text-slate-900">{pendingQuotationsCount}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Awaiting Reply</p>
                <p className="text-xl font-bold text-slate-900">{awaitingReplyQuotations.length}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Need Action</p>
                <p className="text-xl font-bold text-slate-900">{repliesNeedingAction.length}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Follow-ups Today</p>
                <p className="text-xl font-bold text-slate-900">{followUpsSentToday}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Won This Week</p>
                <p className="text-xl font-bold text-emerald-600">{dealsWonThisWeek}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Attention Needed — Proactive Thinking */}
      {insights.length > 0 && (
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Attention Needed
            <span className="text-sm font-normal text-gray-500">
              ({insights.length} thing{insights.length === 1 ? '' : 's'} Apex noticed)
            </span>
          </h2>

          <div className="space-y-2">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3"
              >
                <p className="text-sm text-slate-800">{insight.message}</p>
                <button
                  type="button"
                  onClick={() => dismissInsight(insight.id)}
                  className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border rounded-lg px-2.5 py-1"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Apex checks for these automatically every few hours — stale replies, expired quotations,
            stalled negotiations, and un-quoted enquiries.
          </p>
        </div>
      )}

      {/* Notifications Panel */}
      <div className="bg-white rounded-xl shadow border p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-gray-500">
                Apex will alert you via desktop + voice for new enquiries and customer replies
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!notificationSupported ? (
              <span className="text-xs text-orange-600">
                Desktop notifications are not supported in this browser
              </span>
            ) : notificationPermission === 'granted' ? (
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                ✓ Desktop notifications ON
              </span>
            ) : notificationPermission === 'denied' ? (
              <span className="text-xs font-semibold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
                Desktop notifications blocked (allow in browser settings)
              </span>
            ) : (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-full hover:bg-slate-800"
              >
                Enable Desktop Notifications
              </button>
            )}

            <button
              type="button"
              onClick={enablePushNotifications}
              disabled={pushSubscribing || pushSubscribed}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                pushSubscribed
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {pushSubscribed
                ? '✓ Push Enabled on This Device'
                : pushSubscribing
                  ? 'Enabling...'
                  : 'Enable Push on This Device (Mobile/Desktop)'}
            </button>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none bg-slate-50 border px-3 py-1.5 rounded-full">
              <input
                type="checkbox"
                checked={voiceNotifyEnabled}
                onChange={(e) => setVoiceNotifyEnabled(e.target.checked)}
                className="accent-blue-500"
              />
              {voiceNotifyEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              Voice Notification
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          "Enable Push" works even when this browser tab is closed — on mobile, first add this page
          to your Home Screen (browser menu → "Add to Home Screen") for the best experience, then tap
          Enable Push from there. Each device needs to enable push separately.
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Link
          to="/admin"
          className="bg-white rounded-xl shadow border p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-gray-500 text-sm flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              New Enquiries
            </h2>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-slate-600" />
          </div>

          <div className="text-4xl font-bold mt-3">
            {loadingEnquiries ? '…' : newEnquiriesCount}
          </div>

          <p className="text-xs text-gray-400 mt-1">Tap to open Enquiries CRM</p>
        </Link>

        <Link
          to="/admin/quotations"
          className="bg-white rounded-xl shadow border p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-gray-500 text-sm flex items-center gap-2">
              <FileClock className="w-4 h-4" />
              Pending Quotations
            </h2>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-slate-600" />
          </div>

          <div className="text-4xl font-bold mt-3">
            {loadingQuotations ? '…' : pendingQuotationsCount}
          </div>

          <p className="text-xs text-gray-400 mt-1">Draft / not yet sent</p>
        </Link>

        <Link
          to="/admin/quotations"
          className="bg-white rounded-xl shadow border p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-gray-500 text-sm flex items-center gap-2">
              <MessageCircleReply className="w-4 h-4" />
              Customer Replies
            </h2>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-slate-600" />
          </div>

          <div className="text-4xl font-bold mt-3">
            {loadingQuotations ? '…' : customerRepliesCount}
          </div>

          <p className="text-xs text-gray-400 mt-1">Replied to a sent quotation</p>
        </Link>

        <Link
          to="/admin/quotations"
          className="bg-white rounded-xl shadow border p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-gray-500 text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Follow Ups
            </h2>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-slate-600" />
          </div>

          <div className="text-4xl font-bold mt-3">
            {loadingQuotations ? '…' : followUpsCount}
          </div>

          <p className="text-xs text-gray-400 mt-1">Quotations with a follow-up sent</p>
        </Link>
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Enquiries</h2>
          <Link to="/admin" className="text-sm text-blue-600 underline">
            View all in Enquiries CRM
          </Link>
        </div>

        {loadingEnquiries ? (
          <p className="text-sm text-gray-500">Loading enquiries...</p>
        ) : recentEnquiries.length === 0 ? (
          <p className="text-sm text-gray-500">No enquiries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2 text-left">No.</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {recentEnquiries.map((item, index) => (
                  <tr
                    key={item.id || index}
                    onClick={() => openCustomerTimeline(item.companyName, item.name, item.id)}
                    className={`cursor-pointer hover:bg-blue-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="p-2 border-t font-semibold text-slate-700">#{item.srNo}</td>

                    <td className="p-2 border-t whitespace-nowrap">
                      {item.dateTime ? new Date(item.dateTime).toLocaleString() : '-'}
                    </td>

                    <td className="p-2 border-t">
                      <p className="font-medium text-slate-900">{item.name || '-'}</p>
                      <p className="text-xs text-gray-500">{item.companyName}</p>
                    </td>

                    <td className="p-2 border-t">{item.productRequired || '-'}</td>

                    <td className="p-2 border-t">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                        {item.status || 'New'}
                      </span>
                    </td>

                    <td className="p-2 border-t">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          createQuotationFromEnquiry(item);
                        }}
                        className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Create Quotation
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Replies (Phase 6 + 9) */}
      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircleReply className="w-5 h-5 text-slate-700" />
            Customer Replies
          </h2>
          <Link to="/admin/quotations" className="text-sm text-blue-600 underline">
            View all Quotations
          </Link>
        </div>

        {loadingQuotations ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : repliedQuotations.length === 0 ? (
          <p className="text-sm text-gray-500">
            No customer replies yet. Apex checks the mailbox automatically in the background.
          </p>
        ) : (
          <div className="space-y-3">
            {repliedQuotations.slice(0, 5).map((item) => (
              <div key={item.id} className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
                      <button
                        type="button"
                        onClick={() => openCustomerTimeline(item.company_name, item.customer_name, item.enquiry_no)}
                        className="text-slate-900 hover:underline hover:text-blue-700"
                      >
                        {item.customer_name || item.company_name || 'Customer'}
                      </button>{' '}
                      — {item.quotation_no}
                      {item.enquiry_no && (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          (Enquiry #{item.enquiry_no})
                        </span>
                      )}
                      {item.status === 'Won' && (
                        <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          ✅ Won
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.replied_at ? new Date(item.replied_at).toLocaleString() : ''}
                      {Number(item.revision_count || 0) > 0
                        ? ` · Revision ${item.revision_count}`
                        : ''}
                      {' · '}₹{Number(item.grand_total || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {item.status !== 'Won' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startQuotationRevision(item)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revise & Resend
                      </button>

                      <button
                        type="button"
                        onClick={() => markQuotationWon(item)}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Won
                      </button>
                    </div>
                  )}
                </div>

                {item.reply_intent && (
                  <p className="text-sm text-slate-900 mt-2 flex items-start gap-1.5">
                    <span className="font-semibold">🧠 Apex understood:</span> {item.reply_intent}
                  </p>
                )}

                {item.reply_snippet && (
                  <p className="text-xs text-gray-500 mt-1 italic">"{item.reply_snippet}"</p>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Apex checks the sales@mrapexindustrial.in mailbox every few minutes for replies to sent
          quotations. Use "Revise & Resend" to send a new rate, or "Mark Won" once the deal is
          finalized.
        </p>
      </div>

      {/* Follow-ups (Phase 7) */}
      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BellRing className="w-5 h-5 text-slate-700" />
            Automated Follow-ups
          </h2>
          <Link to="/admin/quotations" className="text-sm text-blue-600 underline">
            View all Quotations
          </Link>
        </div>

        {loadingQuotations ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : followedUpQuotations.length === 0 ? (
          <p className="text-sm text-gray-500">
            No follow-ups sent yet. Apex automatically emails a reminder if a customer has not
            replied within a few days of a quotation being sent.
          </p>
        ) : (
          <div className="space-y-3">
            {followedUpQuotations.slice(0, 5).map((item) => (
              <div key={item.id} className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900">
                    {item.customer_name || item.company_name || 'Customer'} — {item.quotation_no}
                    {item.enquiry_no && (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        (Enquiry #{item.enquiry_no})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {item.last_follow_up_at
                      ? new Date(item.last_follow_up_at).toLocaleString()
                      : ''}
                  </p>
                </div>

                <p className="text-xs text-gray-600 mt-1">
                  Follow-up sent {item.follow_up_count} time{item.follow_up_count > 1 ? 's' : ''}
                  {item.customer_replied ? ' — customer has since replied' : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Follow-ups are sent automatically in the background — no action needed here. Delay and
          maximum follow-up count are configurable on the backend.
        </p>
      </div>

      {/* Activity Timeline (Phase 4) */}
      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-slate-700" />
          <h2 className="text-xl font-bold">Activity Timeline</h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading timeline...</p>
        ) : timelineEvents.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${timelineColorFor(
                    event.type
                  )}`}
                >
                  {timelineIconFor(event.type)}
                </div>

                <div className="flex-1 border-b pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900">{event.title}</p>
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Assistant */}
      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Voice Assistant</h2>

          {isListening && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
              🔴 Listening — speak your command
            </span>
          )}
        </div>

        {!voiceSupported ? (
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              This browser does not support Voice Recognition. Use Chrome (Desktop or Android) for
              the best compatibility.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                onClick={toggleListening}
                className={`px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 text-white transition-colors ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isListening ? 'Stop Listening' : 'Talk to Apex'}
              </button>

              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setVoiceLanguage('en-IN')}
                  disabled={isListening}
                  className={`text-xs font-semibold px-3 py-2 rounded-md disabled:opacity-50 ${
                    voiceLanguage === 'en-IN' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLanguage('hi-IN')}
                  disabled={isListening}
                  className={`text-xs font-semibold px-3 py-2 rounded-md disabled:opacity-50 ${
                    voiceLanguage === 'hi-IN' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {voiceError && <p className="text-sm text-red-600 mt-3">⚠ {voiceError}</p>}

            {isListening && liveTranscript && (
              <p className="text-sm text-gray-500 italic mt-3">"{liveTranscript}"</p>
            )}

            <p className="text-xs text-gray-400 mt-3">
              Click "Talk to Apex" and just start speaking — no wake word needed. Every enquiry has
              a Sr. No. shown in the "No." column below — you can say "enquiry number 32, rate
              23500" instead of the company name. You can also ask a question ("did you send the
              mail to ABC?", "any reply from the customer?"). If you give a rate but no delivery
              time (or vice versa), Apex will ask you for just that one detail — answer with a
              number and it continues automatically. After about 4 seconds of silence, Apex
              processes what you said. Pick English or हिंदी above before you start speaking — the
              browser cannot reliably switch languages mid-sentence.
            </p>

            {quotationActionError && (
              <p className="text-sm text-red-600 mt-3">⚠ {quotationActionError}</p>
            )}

            {voiceLog.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Conversation with Apex</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {voiceLog.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-3 bg-slate-50">
                      <p className="text-xs text-gray-400 mb-1">
                        {entry.timestamp.toLocaleString()}
                      </p>

                      <p className="text-sm text-slate-900">
                        <span className="font-semibold">You:</span> {entry.text}
                      </p>

                      {entry.responseStatus === 'thinking' && (
                        <p className="text-sm text-gray-500 italic mt-1">Apex is thinking...</p>
                      )}

                      {entry.responseStatus === 'working' && (
                        <p className="text-sm text-blue-700 mt-1">
                          <span className="font-semibold">🤖 Apex:</span> {entry.response}
                        </p>
                      )}

                      {entry.responseStatus === 'done' && (
                        <p className="text-sm text-green-700 mt-1">
                          <span className="font-semibold">🤖 Apex:</span> {entry.response}
                        </p>
                      )}

                      {entry.responseStatus === 'answered' && (
                        <p className="text-sm text-slate-800 mt-1">
                          <span className="font-semibold">🤖 Apex:</span> {entry.response}
                        </p>
                      )}

                      {(entry.responseStatus === 'error' ||
                        entry.responseStatus === 'unclear' ||
                        entry.responseStatus === 'needs_review') && (
                        <p className="text-sm text-orange-700 mt-1">
                          <span className="font-semibold">🤖 Apex:</span> {entry.response}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => convertVoiceToQuotation(entry)}
                        disabled={convertingEntryId === entry.id}
                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap mt-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {convertingEntryId === entry.id
                          ? 'Parsing...'
                          : 'Manually Convert to Quotation'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quotation Review Modal (Phase 5 + 9: voice / manual-from-enquiry / revision) */}
      {quotationReview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {quotationReview.revisingQuotationId ? 'Revise Quotation' : 'Review Quotation'}
              </h2>
              <button type="button" onClick={closeQuotationReview} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Context:</p>
              <p className="text-sm text-gray-700 italic">{quotationReview.sourceText}</p>
            </div>

            {quotationReview.matchedEnquiryFound ? (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                ✓ Customer details have been auto-filled — please verify before sending.
              </p>
            ) : (
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-4">
                ⚠ No matching enquiry found — please fill in customer details manually.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                <input
                  value={quotationReview.customer_name}
                  onChange={(e) => updateQuotationReviewField('customer_name', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  value={quotationReview.company_name}
                  onChange={(e) => updateQuotationReviewField('company_name', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mobile *</label>
                <input
                  value={quotationReview.mobile}
                  onChange={(e) => updateQuotationReviewField('mobile', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  value={quotationReview.email}
                  onChange={(e) => updateQuotationReviewField('email', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Required to auto-send"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  value={quotationReview.address}
                  onChange={(e) => updateQuotationReviewField('address', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <input
                  value={quotationReview.product_name}
                  onChange={(e) => updateQuotationReviewField('product_name', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Part Number</label>
                <input
                  value={quotationReview.part_number}
                  onChange={(e) => updateQuotationReviewField('part_number', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  value={quotationReview.quantity}
                  onChange={(e) => updateQuotationReviewField('quantity', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rate (₹)</label>
                <input
                  type="number"
                  value={quotationReview.rate}
                  onChange={(e) => updateQuotationReviewField('rate', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  autoFocus={Boolean(quotationReview.revisingQuotationId)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>
                <input
                  type="number"
                  value={quotationReview.gst_percent}
                  onChange={(e) => updateQuotationReviewField('gst_percent', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Delivery (days)</label>
                <input
                  value={quotationReview.delivery_days}
                  onChange={(e) => updateQuotationReviewField('delivery_days', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Warranty</label>
                <input
                  value={quotationReview.warranty_terms}
                  onChange={(e) => updateQuotationReviewField('warranty_terms', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Leave blank if not specified"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                <input
                  value={quotationReview.payment_terms}
                  onChange={(e) => updateQuotationReviewField('payment_terms', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Leave blank if not specified"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={quotationReview.notes}
                  onChange={(e) => updateQuotationReviewField('notes', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 min-h-[70px]"
                />
              </div>
            </div>

            {quotationActionError && (
              <p className="text-sm text-red-600 mt-4">⚠ {quotationActionError}</p>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeQuotationReview}
                disabled={creatingQuotation}
                className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              {!quotationReview.revisingQuotationId && (
                <button
                  type="button"
                  onClick={() => submitQuotationReview(false)}
                  disabled={creatingQuotation}
                  className="px-4 py-2 rounded-lg border border-slate-900 text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                >
                  {creatingQuotation ? 'Saving...' : 'Save as Draft'}
                </button>
              )}

              <button
                type="button"
                onClick={() => submitQuotationReview(true)}
                disabled={creatingQuotation}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
              >
                {creatingQuotation
                  ? 'Sending...'
                  : quotationReview.revisingQuotationId
                    ? 'Resend with New Rate'
                    : 'Create & Send to Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Customer Timeline / Memory Modal */}
      {customerTimelineFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-slate-700" />
                {customerTimelineFor.name || customerTimelineFor.company || 'Customer'}
              </h2>
              <button
                type="button"
                onClick={closeCustomerTimeline}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">{customerTimelineFor.company}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Enquiries</p>
                <p className="text-xl font-bold text-slate-900">
                  {customerTimelineSummary.enquiryCount}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Quotations</p>
                <p className="text-xl font-bold text-slate-900">
                  {customerTimelineSummary.quotationCount}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{customerTimelineSummary.totalValue.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Deals Won</p>
                <p className="text-xl font-bold text-emerald-600">
                  {customerTimelineSummary.wonCount}
                </p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3">Complete History</h3>

            {loadingCustomerHistory ? (
              <p className="text-sm text-gray-500">Loading full history...</p>
            ) : customerTimelineEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No history found for this customer yet.</p>
            ) : (
              <div className="space-y-4">
                {customerTimelineEvents.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${timelineColorFor(
                        event.type
                      )}`}
                    >
                      {timelineIconFor(event.type)}
                    </div>

                    <div className="flex-1 border-b pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-900">{event.title}</p>
                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(event.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={closeCustomerTimeline}
                className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
