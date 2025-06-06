import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Divider,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
// Import ReactMarkdown as a direct import instead of named import
import ReactMarkdown from 'react-markdown';
import styles from "./AssistenteIa.module.css";
import { api } from "../../service/api";

// Remover o token JWT hardcoded
// const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiYWNrZW5kLWFwaS1yZXN0Iiwic3ViIjoiZ2VtaW5pQGdvb2dsZS5jb20iLCJleHAiOjE3NDUwMjMzNzN9.6Ak4jU2JAKKlT82o8KsAM3CWWoTC3insLmZ9H0V6eGw';

const AssistenteIa = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = handleSpeechEnd;
    } else {
      console.error('Speech recognition not supported in this browser');
    }

    loadHistory();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSpeechResult = (event) => {
    let finalTranscript = '';
    let currentInterimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
        sendMessage(transcript.trim());
      } else {
        currentInterimTranscript += transcript;
      }
    }

    setInterimTranscript(currentInterimTranscript);
  };

  const handleSpeechError = (event) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
  };

  const handleSpeechEnd = () => {
    setIsListening(false);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setInterimTranscript('');
      } catch (error) {
        console.error('Error starting speech recognition:', error);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'pt-BR';

          recognitionRef.current.onresult = handleSpeechResult;
          recognitionRef.current.onerror = handleSpeechError;
          recognitionRef.current.onend = handleSpeechEnd;

          recognitionRef.current.start();
          setInterimTranscript('');
        }
      }
    }
    setIsListening(!isListening);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };

    setChatHistory(prevHistory => {
      const historyWithUserMsg = [...prevHistory, userMessage];
      saveHistory(historyWithUserMsg);
      return historyWithUserMsg;
    });

    setLoading(true);

    const currentHistoryForAPI = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');

    try {
      // Substituir fetch por api.post do axios
      const response = await api.post('/ai/gemini/chat', {
        message: text,
        history: currentHistoryForAPI
      });

      // Axios retorna os dados na propriedade data
      const data = response.data;

      // Verificar se a estrutura esperada existe na resposta do axios
      if (data && data.data && data.data.response) {
        const aiResponse = data.data.response;
        const cleanedResponse = aiResponse.replace(/^Assistant:\s*/i, ''); // Keep cleaning if needed
        const assistantMessage = { role: 'assistant', content: cleanedResponse };

        setChatHistory(prevHistory => {
          const latestHistory = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
          // Avoid adding duplicate assistant messages if already present
          if (latestHistory.length > 0 && latestHistory[latestHistory.length - 1].role === 'assistant' && latestHistory[latestHistory.length - 1].content === cleanedResponse) {
            return latestHistory;
          }
          const finalHistory = [...latestHistory, assistantMessage];
          saveHistory(finalHistory);
          return finalHistory;
        });
      } else {
        // Handle cases where the response format is unexpected
        console.error('Unexpected API response format:', data);
        throw new Error('Received an unexpected response format from the server.');
      }

    } catch (error) {
      console.error('Error communicating with backend:', error);
      // Adaptar a estrutura de erro do Axios
      const errorMessageContent = error.response ? `Error: ${error.response.status} ${error.response.statusText}` : `Error: ${error.message}`;
      const errorMessage = { role: 'error', content: errorMessageContent };

      setChatHistory(prevHistory => {
        const latestHistory = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
        if (latestHistory.length > 0 && latestHistory[latestHistory.length - 1].role === 'error' && latestHistory[latestHistory.length - 1].content === errorMessage.content) {
          return latestHistory;
        }
        const errorHistory = [...latestHistory, errorMessage];
        saveHistory(errorHistory);
        return errorHistory;
      });
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = (history) => {
    sessionStorage.setItem('chatHistory', JSON.stringify(history));
  };

  const loadHistory = () => {
    const savedHistory = sessionStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    sessionStorage.removeItem('chatHistory');
  };

  const renderMessage = (msg, index) => {
    switch (msg.role) {
      case "user":
        return (
          <Box key={index} className={styles.userMessage}>
            <Typography variant="body1">{msg.content}</Typography>
          </Box>
        );
      case "assistant":
        return (
          <Box key={index} className={`${styles.aiMessage} ${styles.markdownContainer}`}> {/* Add markdownContainer class */}
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </Box>
        );
      case "error":
        return (
          <Box key={index} className={styles.errorMessage}>
            <Typography variant="body1">{msg.content}</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Paper elevation={3} className={styles.chatContainer}>
        <Box className={styles.controls}>
          <IconButton
            onClick={toggleListening}
            className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
          >
            {isListening ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
          <Box className={`${styles.statusIndicator} ${isListening ? styles.active : ''}`}>
            {isListening ? 'Reconhecendo fala...' : 'Reconhecimento parado'}
          </Box>
        </Box>

        {interimTranscript && (
          <Box className={styles.interimTranscript}>
            <Typography variant="body2" fontStyle="italic">
              Ouvindo: {interimTranscript}
            </Typography>
          </Box>
        )}

        <Box className={styles.chatHistoryHeader}>
          <Button
            startIcon={<ChatIcon />}
            onClick={clearHistory}
            variant="outlined"
            color="success"
            size="small"
          >
            Novo Chat
          </Button>
        </Box>

        <Divider />

        <Box ref={chatContainerRef} className={styles.transcription}>
          {chatHistory.map((msg, index) => renderMessage(msg, index))}

          {loading && (
            <Box className={styles.loadingIndicator}>
              <CircularProgress size={20} sx={{ marginRight: 1, color: "#61131A" }} />
              <Typography variant="body2">Aguardando resposta da IA...</Typography>
            </Box>
          )}
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          className={styles.messageForm}
        >
          <TextField
            fullWidth
            multiline
            rows={1}
            variant="outlined"
            placeholder="Digite sua mensagem aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#9C1F2E",
                },
                "&.Mui-focused": {
                  "& fieldset": {
                    borderColor: "#61131A",
                  },
                },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendIcon />}
            disabled={!message.trim() || loading}
            sx={{
              backgroundColor: "#61131A",
              "&:hover": {
                backgroundColor: "#8B1E26"
              },
              height: "56px",
              padding: "0 16px",
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center"
            }}
          >
            Enviar
          </Button>
        </Box>
      </Paper>
    </div>
  );
};

export { AssistenteIa };