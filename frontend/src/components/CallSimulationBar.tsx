import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  BookOpen,
  ShieldAlert,
  Flame,
  Activity,
  Home,
  MessageSquare
} from 'lucide-react';
import { ringtoneService } from '../services/ringtoneService';
import type { CallSimulationState } from '../types';

export interface CallSimulationBarProps {
  onCallAccepted: (transcript: string, languageHint: string, locationHint: string) => void;
  onCallEnded: () => void;
  isCallActive?: boolean;
  activeLanguage?: string;
  onOpenLoadScenarios?: () => void;
  selectedScenario?: any;
  triggerIncomingCallRef?: React.MutableRefObject<((scenario?: any) => void) | null>;
}

export const CALLER_PRESETS: Record<string, { name: string; phone: string; location: string }> = {
  'DEMO-001': { name: 'Priya Verma', phone: '+91 98101 23456', location: 'Near North Campus, Delhi' },
  'DEMO-002': { name: 'Ananya Verma', phone: '+91 97182 34109', location: 'Rajiv Chowk Metro Gate 4, New Delhi' },
  'DEMO-003': { name: 'Rimi Banerjee', phone: '+91 98310 99421', location: 'Salt Lake Karunamoyee Bus Stand, Kolkata' },
  'DEMO-004': { name: 'Sneha Mehra', phone: '+91 98220 54321', location: 'Near Swargate Bus Stand, Pune' },
  'DEMO-005': { name: 'Selvi Murugan', phone: '+91 98401 67890', location: 'Koyambedu Bus Terminal, Chennai' },
  'DEMO-006': { name: 'Bhavana Reddy', phone: '+91 98490 12345', location: 'Madhapur Metro Station, Hyderabad' },
  'DEMO-007': { name: 'Harpreet Kaur', phone: '+91 98140 98765', location: 'Model Town Market, Ludhiana' },
  'DEMO-008': { name: 'Dhara Patel', phone: '+91 98250 87654', location: 'Navrangpura College Area, Ahmedabad' },
  'DEMO-009': { name: 'Nisha Singh', phone: '+91 98112 34567', location: 'Red Building near Metro, Delhi' },
  'DEMO-010': { name: 'Pooja Sharma', phone: '+91 98114 29081', location: 'Flat 402, Sector 18, Noida' },
  'DEMO-011': { name: 'Komal Gupta', phone: '+91 98710 45678', location: 'Sector 14 Bus Stop, Gurgaon' },
  'DEMO-012': { name: 'Meenakshi Iyer', phone: '+91 98200 32109', location: 'Metro Platform 2, New Delhi' },
  'sc-1': { name: 'Pooja Sharma', phone: '+91 98114 29081', location: 'Flat 402, Sector 18, Noida' },
  'sc-2': { name: 'Ananya Verma', phone: '+91 97182 34109', location: 'Rajiv Chowk Metro Gate 4, New Delhi' },
  'sc-3': { name: 'Sunita Mehra', phone: '+91 98103 88120', location: 'Near Hauz Khas Market, New Delhi' },
  'sc-4': { name: 'Deepa Roy', phone: '+91 98301 77214', location: 'Ground Floor Market Building, Munirka, Delhi' },
  'sc-5': { name: 'Kavita Devi', phone: '+91 99120 44510', location: 'Near Anand Vihar Bus Terminal, Delhi' },
  'sc-6': { name: 'Rimi Banerjee', phone: '+91 98310 99421', location: 'Salt Lake Karunamoyee Bus Stand, Kolkata' },
};

interface PreconfiguredCallScenario {
  id: string;
  title: string;
  category: string;
  callerName: string;
  callerPhone: string;
  callerLocation: string;
  languageHint: string;
  transcript: string;
  urgency: 'High' | 'Medium' | 'Critical';
  icon: any;
}

const CALL_SCENARIOS: PreconfiguredCallScenario[] = [
  {
    id: 'sc-1',
    title: 'Active Door Intrusion & Threat (Urgent)',
    category: 'Active Intrusion',
    callerName: 'Pooja Sharma',
    callerPhone: '+91 98114 29081',
    callerLocation: 'Flat 402, Sector 18, Noida',
    languageHint: 'Hinglish',
    urgency: 'Critical',
    icon: ShieldAlert,
    transcript: 'Emergency! Mere flat ke bahar koi darwaza zor-zor se peet raha hai aur gaaliyan de raha hai. Wo keh raha hai darwaza tod kar ghus jayega. Main bedroom mein locked hoon, please police ya PCR bhejo abhi!',
  },
  {
    id: 'sc-2',
    title: 'Metro Stalking & Unwanted Pursuit (Hindi)',
    category: 'Stalking in Transit',
    callerName: 'Ananya Verma',
    callerPhone: '+91 97182 34109',
    callerLocation: 'Rajiv Chowk Metro Gate 4, New Delhi',
    languageHint: 'Hindi',
    urgency: 'Medium',
    icon: MessageSquare,
    transcript: 'नमस्ते, मैं राजीव चौक मेट्रो स्टेशन के गेट नंबर 4 के बाहर खड़ी हूं। एक अज्ञात व्यक्ति पिछले 20 मिनट से लगातार मेरा पीछा कर रहा है। वह बार-बार पास आने की कोशिश कर रहा है और मुझे असहज महसूस करा रहा है। मुझे घर जाने में डर लग रहा है।',
  },
  {
    id: 'sc-3',
    title: 'Physical Assault & Fracture (Medical)',
    category: 'Medical Trauma',
    callerName: 'Sunita Mehra',
    callerPhone: '+91 98103 88120',
    callerLocation: 'Near Hauz Khas Market, New Delhi',
    languageHint: 'Hinglish',
    urgency: 'Critical',
    icon: Activity,
    transcript: 'Mujhe urgent ambulance chahiye! Yahan sadak par do ladkon ne dhakka diya aur mera hath fracture ho gaya hai, blood nikal raha hai. Main Hauz Khas market ke paas hoon aur bahut dard mein hoon.',
  },
  {
    id: 'sc-4',
    title: 'Building Fire Trap & Smoke (Fire Tender)',
    category: 'Fire Hazard',
    callerName: 'Deepa Roy',
    callerPhone: '+91 98301 77214',
    callerLocation: 'Ground Floor Market Building, Munirka, Delhi',
    languageHint: 'Hindi / Hinglish',
    urgency: 'Critical',
    icon: Flame,
    transcript: 'Emergency! Building ke ground floor par aag lag gayi hai, bahut dhuwan bhar gaya hai aur hum second floor pe phase hue hain. Fire brigade aur ambulance jaldi bhejo!',
  },
  {
    id: 'sc-5',
    title: 'Domestic Abuse & Shelter Needed (Bhojpuri)',
    category: 'Domestic & Shelter',
    callerName: 'Kavita Devi',
    callerPhone: '+91 99120 44510',
    callerLocation: 'Near Anand Vihar Bus Terminal, Delhi',
    languageHint: 'Bhojpuri',
    urgency: 'High',
    icon: Home,
    transcript: 'हमार पति रोज शराब पीके मारत बाड़े, आज घर से निकाल देले बा। हमार 4 साल के बच्ची साथे बाटे, हमके कहीं सुरक्षित शेल्टर आ कानूनी मदद चाही।',
  },
  {
    id: 'sc-6',
    title: 'Karunamoyee Bike Stalking (Bengali)',
    category: 'Stalking',
    callerName: 'Rimi Banerjee',
    callerPhone: '+91 98310 99421',
    callerLocation: 'Salt Lake Karunamoyee Bus Stand, Kolkata',
    languageHint: 'Bengali',
    urgency: 'High',
    icon: MessageSquare,
    transcript: 'নমস্কার, আমি সল্টলেক করুণাময়ী বাস স্ট্যান্ডের কাছে দাঁড়িয়ে আছি। গত তিন দিন ধরে একটা ছেলে অফিসে যাওয়ার পর বাইকে করে আমার পিছনে আসছে। আজ আমাকে হুমকি দিয়েছে। আমাকে অবিলম্বে পুলিশ পাঠান।',
  },
];

export const CallSimulationBar: React.FC<CallSimulationBarProps> = ({
  onCallAccepted,
  onCallEnded,
  onOpenLoadScenarios,
  selectedScenario,
  triggerIncomingCallRef,
}) => {
  const [callState, setCallState] = useState<CallSimulationState>({
    status: 'idle',
    callerPhone: '+91 98114 29081',
    callerLocation: 'Munirka Metro Cell #04, New Delhi',
    callerName: 'Anonymous Citizen',
    incomingLanguage: 'Hinglish',
    callDuration: 0,
    scenarioTitle: 'Standard Helpline Inflow',
  });

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('sc-1');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (triggerIncomingCallRef) {
      triggerIncomingCallRef.current = (sc?: any) => triggerIncomingCall(sc);
    }
  });

  // Call duration timer
  useEffect(() => {
    let timer: any = null;
    if (callState.status === 'connected') {
      timer = setInterval(() => {
        setCallState((prev) => ({ ...prev, callDuration: prev.callDuration + 1 }));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.status]);

  // Clean up ringtone on unmount
  useEffect(() => {
    return () => {
      ringtoneService.stopRingtone();
    };
  }, []);

  const triggerIncomingCall = (scenario?: any) => {
    const sc = scenario || selectedScenario || CALL_SCENARIOS[0];
    const preset = CALLER_PRESETS[sc.id] || {
      name: sc.callerName || 'Anonymous Citizen',
      phone: sc.callerPhone || '+91 98114 29081',
      location: sc.callerLocation || sc.location || 'Munirka Metro Cell #04, New Delhi',
    };

    ringtoneService.startRingtone();
    setCallState({
      status: 'ringing',
      callerPhone: sc.callerPhone || preset.phone,
      callerLocation: sc.callerLocation || preset.location,
      callerName: sc.callerName || preset.name,
      incomingLanguage: sc.languageHint || sc.language_hint || 'Hinglish',
      callDuration: 0,
      scenarioTitle: sc.title || 'Helpline Emergency Call',
    });
    setSelectedScenarioId(sc.id);
  };

  const handleAnswerCall = () => {
    ringtoneService.stopRingtone();
    ringtoneService.playDispatchSound();
    const sc = selectedScenario || CALL_SCENARIOS.find((s) => s.id === selectedScenarioId) || CALL_SCENARIOS[0];
    const preset = CALLER_PRESETS[sc.id] || {
      name: sc.callerName || 'Anonymous Citizen',
      phone: sc.callerPhone || '+91 98114 29081',
      location: sc.callerLocation || sc.location || 'Munirka Metro Cell #04, New Delhi',
    };

    setCallState((prev) => ({
      ...prev,
      status: 'connected',
      callDuration: 1,
    }));

    onCallAccepted(
      sc.transcript,
      sc.languageHint || sc.language_hint || 'Hinglish',
      sc.callerLocation || preset.location
    );
  };

  const handleDeclineCall = () => {
    ringtoneService.stopRingtone();
    setCallState((prev) => ({
      ...prev,
      status: 'idle',
      callDuration: 0,
    }));
  };

  const handleHangUp = () => {
    ringtoneService.stopRingtone();
    setCallState((prev) => ({
      ...prev,
      status: 'ended',
    }));
    onCallEnded();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    ringtoneService.setMuted(nextMuted);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all overflow-hidden">
      {/* 1. When Incoming Call is Ringing */}
      {callState.status === 'ringing' && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white animate-pulseGlow flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-lg animate-bounce">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-white/25 text-white">
                  Incoming Helpline Call (Ringing...)
                </span>
                <span className="text-xs bg-black/25 px-2 py-0.5 rounded-full font-mono">
                  {callState.incomingLanguage}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white mt-1 truncate">
                {callState.callerName} • <span className="font-mono">{callState.callerPhone}</span>
              </h3>
              <p className="text-xs text-white/90 truncate flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3.5 h-3.5 shrink-0 animate-ping" />
                <span>Cell Tower: {callState.callerLocation}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all text-xs font-semibold flex items-center gap-1.5"
              title={isMuted ? 'Unmute Ringtone' : 'Mute Ringtone'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-200" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isMuted ? 'Unmute Ringtone' : 'Mute Ringtone'}</span>
            </button>

            <button
              type="button"
              onClick={handleDeclineCall}
              className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/50 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>

            <button
              type="button"
              onClick={handleAnswerCall}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 animate-pulse active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>Answer Call</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. When Call is Connected & Active */}
      {callState.status === 'connected' && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Call Connected
                </span>
                <span className="font-mono text-xs text-slate-300 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-teal-300" />
                  {formatTimer(callState.callDuration)}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1 truncate">
                {callState.callerName} • <span className="font-mono text-teal-200">{callState.callerPhone}</span>
              </h3>
              <p className="text-xs text-slate-300 truncate">
                Location: {callState.callerLocation} | Spoken: <strong>{callState.incomingLanguage}</strong>
              </p>
            </div>
          </div>

          {/* Sound Wave Animation & Hang up */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Animated Audio Waveform */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <span className="w-1 bg-teal-400 rounded-full animate-[waveBar_0.8s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-sky-400 rounded-full animate-[waveBar_0.8s_ease-in-out_0.2s_infinite]"></span>
              <span className="w-1 bg-emerald-400 rounded-full animate-[waveBar_0.8s_ease-in-out_0.4s_infinite]"></span>
              <span className="w-1 bg-teal-300 rounded-full animate-[waveBar_0.8s_ease-in-out_0.1s_infinite]"></span>
              <span className="text-[11px] font-medium text-slate-300 ml-1.5">Voice Audio Active</span>
            </div>

            <button
              type="button"
              onClick={handleHangUp}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-950/40 transition-all flex items-center gap-2 active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Hang Up Call</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. When Idle: Simulator Controls & Ringtone Test Bar */}
      {(callState.status === 'idle' || callState.status === 'ended') && (
        <div className="p-2 sm:px-3 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 overflow-x-auto">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
              Helpline Call Simulator & Dispatch Console
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
              Ready for Calls
            </span>
          </div>

          {/* Quick Simulation Trigger Buttons - strictly linear on single row */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap ml-auto">
            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                isMuted
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isMuted ? 'Ringtone sound is Muted' : 'Ringtone sound is Audible'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-teal-600" />}
              <span className="text-xs">{isMuted ? 'Ringtone Muted' : 'Ringtone ON'}</span>
            </button>

            {/* Direct Instant Ring Button */}
            <button
              type="button"
              onClick={() => triggerIncomingCall(selectedScenario || CALL_SCENARIOS[0])}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title={selectedScenario ? `Simulate call: ${selectedScenario.title}` : 'Simulate incoming emergency helpline call'}
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>Simulate Incoming Emergency Call</span>
            </button>

            {/* Load Scenarios Button */}
            <button
              type="button"
              onClick={onOpenLoadScenarios}
              className="px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              title="Select a scenario from the library to simulate"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>Load Scenarios</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
