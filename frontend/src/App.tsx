import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  MessageSquare, 
  Layers, 
  CheckSquare, 
  BookOpen, 
  Loader2, 
  FileText,
  Send,
  Bot,
  User,
  RotateCcw,
  Sparkles,
  Play,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';

import "./index.css" // DO NOT REMOVE OR ELSE CSS WILL BREAK

// ==========================================
// 1. SHARED TYPES & CONFIG
// ==========================================

const API_URL = "http://localhost:9000";

type TabType = 'chat' | 'flashcards' | 'quiz';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface Flashcard {
  front: string;
  back: string;
}

interface QuizItem {
  question: string;
  options: string[];
  correct_answer: string;
}

// ==========================================
// 2. GLOBAL STYLES (Injected for 3D effects)
// ==========================================

const style = document.createElement('style');
style.textContent = `
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  
  /* Custom Scrollbar for Dark Theme */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.8); }
`;
document.head.appendChild(style);

// ==========================================
// 3. SUB-COMPONENTS
// ==========================================

// --- Sidebar ---
interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onFileSelect: (file: File) => Promise<boolean>; // Returns success/fail
  files: string[]; // List of filenames
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onFileSelect, files }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Prevent duplicates in UI
      if (files.includes(selectedFile.name)) {
        setUploadStatus("File already added");
        setTimeout(() => setUploadStatus(""), 2000);
        return;
      }

      setIsUploading(true);
      setUploadStatus("Processing...");

      const success = await onFileSelect(selectedFile);
      
      if (success) {
        setUploadStatus("Success");
      } else {
        setUploadStatus("Failed");
      }
      
      setIsUploading(false);
      setTimeout(() => setUploadStatus(""), 2000); // Clear status after delay
      
      // Reset input
      e.target.value = '';
    }
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: TabType; icon: any; label: string }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeTab === tab 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon className="w-5 h-5" /> 
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col shadow-xl z-10 h-full flex-shrink-0">
      <div className="flex items-center gap-3 mb-8 text-blue-400">
        <div className="p-2 bg-blue-500/10 rounded-lg">
            <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">StudyBuddy</h1>
      </div>

      <nav className="space-y-2 mb-8">
        <NavButton tab="chat" icon={MessageSquare} label="Chat Assistant" />
        <NavButton tab="flashcards" icon={Layers} label="Flashcards" />
        <NavButton tab="quiz" icon={CheckSquare} label="Quiz Mode" />
      </nav>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Course Materials
          </label>
          <span className="text-xs font-medium text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
            {files.length}
          </span>
        </div>
        
        {/* File List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4 pr-1">
          {files.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-800 rounded-xl">
              <p className="text-sm text-slate-500">No notes uploaded yet.</p>
            </div>
          ) : (
            files.map((fileName, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg group hover:border-blue-500/30 transition-colors">
                <div className="p-2 bg-blue-500/10 rounded-md text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-[10px] text-slate-500">Processed</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload Area */}
        <div className="group relative border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:bg-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer bg-slate-900/50">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            ) : (
              <div className="p-2 bg-slate-800 rounded-full group-hover:bg-blue-600 transition-colors">
                 <Plus className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </div>
            )}
            
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">
              {isUploading ? uploadStatus : "Add PDF Notes"}
            </span>
          </div>
        </div>
        
        {uploadStatus && !isUploading && (
          <p className={`text-xs text-center mt-2 font-medium ${uploadStatus === 'Success' ? 'text-green-500' : 'text-red-500'}`}>
            {uploadStatus === 'Success' ? 'Added successfully!' : uploadStatus}
          </p>
        )}
      </div>

      <div className="text-xs text-slate-600 text-center mt-4 pt-4 border-t border-slate-800">
        v1.1.0 • Multi-File Support
      </div>
    </div>
  );
};

// --- Chat View ---
const ChatView: React.FC<{ hasFiles: boolean }> = ({ hasFiles }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hello! Upload your course notes PDFs to start studying.' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    if (!hasFiles) {
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'bot', text: "Please upload at least one PDF file first so I have context to answer you!" }]);
        }, 500);
        setInput("");
        return;
    }
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I encountered an error reading the notes." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to the study server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
            )}

            <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 flex-shrink-0">
                <User className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Bot className="w-5 h-5 text-blue-400" />
             </div>
             <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> 
               <span className="text-sm text-slate-400">Analyzing context...</span>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="relative">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={hasFiles ? "Ask a question about your uploaded PDF..." : "Upload a PDF to start chatting..."}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-lg placeholder:text-slate-500"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// --- Flashcard View ---
const FlashcardView: React.FC = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFlashcards = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/generate_flashcards`, { method: 'POST' });
      const data = await res.json();
      if (data.flashcards) setFlashcards(data.flashcards);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const FlipCard = ({ front, back }: { front: string, back: string }) => {
    const [isFlipped, setIsFlipped] = useState(false);
  
    return (
      <div 
        className="group h-72 perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative h-full w-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg backface-hidden group-hover:border-blue-500/30 transition-colors">
            <div className="w-8 h-1 bg-blue-500/20 rounded-full mb-6"></div>
            <p className="font-medium text-lg text-slate-200 leading-relaxed">{front}</p>
            <div className="absolute bottom-6 text-xs font-semibold text-blue-400 uppercase tracking-widest opacity-60">Question</div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl rotate-y-180 backface-hidden">
            <p className="font-medium text-lg text-white leading-relaxed">{back}</p>
            <div className="absolute bottom-6 text-xs font-semibold text-blue-200 uppercase tracking-widest opacity-80">Answer</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h3 className="text-xl font-semibold text-slate-100">Study Cards</h3>
            <p className="text-sm text-slate-400 mt-1">Click cards to reveal answers</p>
        </div>
        
        <button 
          onClick={generateFlashcards} 
          disabled={isGenerating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate New Set
        </button>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
             <RotateCcw className="w-8 h-8 text-slate-600" />
          </div>
          <h4 className="text-slate-300 font-medium">No cards generated yet</h4>
          <p className="text-slate-500 text-sm mt-2">Upload PDFs and click the button above to create cards.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((card, idx) => (
            <FlipCard key={idx} front={card.front} back={card.back} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Quiz View ---
const QuizView: React.FC = () => {
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: string}>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const generateQuiz = async () => {
    setIsGenerating(true);
    setQuizScore(null);
    setQuizAnswers({});
    try {
      const res = await fetch(`${API_URL}/generate_quiz`, { method: 'POST' });
      const data = await res.json();
      if (data.quiz) setQuiz(data.quiz);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const submitQuiz = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_answer) score++;
    });
    setQuizScore(score);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h3 className="text-xl font-semibold text-slate-100">Knowledge Check</h3>
            <p className="text-sm text-slate-400 mt-1">Test your understanding</p>
        </div>
        
        <button 
          onClick={generateQuiz} 
          disabled={isGenerating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-70"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Start New Quiz
        </button>
      </div>

      {quizScore !== null && (
        <div className="mb-8 p-6 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-2xl flex items-center justify-between">
            <div>
                <p className="text-green-400 font-medium mb-1">Quiz Completed!</p>
                <h4 className="text-3xl font-bold text-white">{quizScore} / {quiz.length}</h4>
            </div>
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-900/50">
                <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
        </div>
      )}

      {quiz.length === 0 ? (
         <div className="text-center py-24 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-600" />
           </div>
           <h4 className="text-slate-300 font-medium">No active quiz</h4>
           <p className="text-slate-500 text-sm mt-2">Upload PDFs and generate a quiz to start practicing.</p>
         </div>
      ) : (
        <div className="space-y-6">
          {quiz.map((q, idx) => {
            const isSubmitted = quizScore !== null;
            const isCorrect = quizAnswers[idx] === q.correct_answer;
            const userAnswer = quizAnswers[idx];

            return (
                <div key={idx} className={`p-6 rounded-2xl border transition-all ${
                    isSubmitted 
                        ? isCorrect 
                            ? 'bg-green-900/10 border-green-500/30' 
                            : 'bg-red-900/10 border-red-500/30'
                        : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                          {idx + 1}
                      </span>
                      <div className="flex-1">
                          <p className="font-medium text-lg text-slate-200 mb-6">{q.question}</p>
                          <div className="space-y-3">
                            {q.options.map((opt, optIdx) => {
                                let optionClass = "border-slate-700 hover:bg-slate-700/50";
                                
                                if (isSubmitted) {
                                    if (opt === q.correct_answer) optionClass = "border-green-500 bg-green-500/10 text-green-300";
                                    else if (opt === userAnswer && opt !== q.correct_answer) optionClass = "border-red-500 bg-red-500/10 text-red-300";
                                    else optionClass = "border-slate-700 opacity-50";
                                } else if (userAnswer === opt) {
                                    optionClass = "border-blue-500 bg-blue-500/10 text-blue-200";
                                }

                                return (
                                  <label key={optIdx} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${optionClass}`}>
                                    <div className="relative flex items-center">
                                        <input 
                                          type="radio" 
                                          name={`q-${idx}`} 
                                          value={opt}
                                          checked={userAnswer === opt}
                                          onChange={() => !isSubmitted && setQuizAnswers(prev => ({...prev, [idx]: opt}))}
                                          disabled={isSubmitted}
                                          className="peer appearance-none w-5 h-5 border-2 border-slate-500 rounded-full checked:border-blue-500 checked:border-4 transition-all"
                                        />
                                    </div>
                                    <span className="text-sm">{opt}</span>
                                  </label>
                                )
                            })}
                          </div>
                      </div>
                  </div>
                </div>
            );
          })}
          
          {!quizScore && (
              <div className="flex justify-end pt-6">
                <button 
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < quiz.length}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Submit Answers
                </button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. MAIN APP COMPONENT
// ==========================================

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]); // Track file names

  const handleFileSelect = async (file: File): Promise<boolean> => {
    // Add logic to call backend upload here inside the parent if needed, 
    // but typically Sidebar calls it. 
    // For this architecture, Sidebar does the fetch, but we update state here on success.
    
    // We return true because Sidebar handles the fetch. 
    // In a real app, Sidebar would call a prop "onUpload" which does the fetch here.
    // To keep it simple based on previous logic, we just update the list state.
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
            setUploadedFiles(prev => [...prev, file.name]);
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onFileSelect={handleFileSelect}
        // currentFile={null} // Deprecated prop, not used in new design
        files={uploadedFiles}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center px-6 justify-between backdrop-blur-sm flex-shrink-0">
          <h2 className="font-semibold text-lg capitalize tracking-wide text-blue-100">
            {activeTab} Mode
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Model: Llama3 (Local)
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-950 to-slate-900">
          {activeTab === 'chat' && <ChatView hasFiles={uploadedFiles.length > 0} />}
          {activeTab === 'flashcards' && <FlashcardView />}
          {activeTab === 'quiz' && <QuizView />}
        </main>
      </div>
    </div>
  );
}

export default App;