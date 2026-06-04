import { Mic, Square } from "lucide-react";
import { useVoiceInput } from "../hooks/useVoiceInput.js";

export default function VoiceRecorder({ onTranscript }) {
  const { isSupported, listening, start, stop } = useVoiceInput(onTranscript);

  return (
    <button
      className="inline-flex items-center gap-2 rounded-md border border-clinic-line px-3 py-2 text-sm font-semibold text-clinic-ink hover:border-clinic-green disabled:cursor-not-allowed disabled:text-clinic-muted"
      disabled={!isSupported}
      onClick={listening ? stop : start}
      type="button"
    >
      {listening ? <Square size={16} /> : <Mic size={16} />}
      {listening ? "Stop Voice" : "Voice Input"}
    </button>
  );
}
