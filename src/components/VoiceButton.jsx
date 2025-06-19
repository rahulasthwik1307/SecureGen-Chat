import { useState, useEffect } from 'react';

const VoiceButton = ({ prompt, setPrompt, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setPrompt(prev => prev + (prev ? ' ' : '') + finalTranscript);
          
          // Trigger textarea auto-resize (matches your existing behavior)
          const textarea = document.querySelector('.chatbot_input textarea');
          if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
          }
        }
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions.');
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      setBrowserSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [setPrompt]);

  const toggleRecording = () => {
    if (!recognition || disabled || !browserSupported) return;
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsRecording(false);
      }
    }
  };

  return (
    <button
      className={`voice-button ${isRecording ? 'recording' : ''}`}
      onClick={toggleRecording}
      disabled={disabled || !browserSupported}
      aria-label={isRecording ? "Stop recording" : "Start voice input"}
      title={isRecording ? "Stop recording" : browserSupported ? "Start voice input" : "Voice input not supported"}
    >
      {isRecording ? "🔴" : "🎤"}
    </button>
  );
};

export default VoiceButton;