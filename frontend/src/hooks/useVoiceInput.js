import { useRef, useState } from "react";

export function useVoiceInput(onText) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const isSupported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  function start() {
    if (!isSupported) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) onText(transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return { isSupported, listening, start, stop };
}
