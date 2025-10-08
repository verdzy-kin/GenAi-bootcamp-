'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Camera, Search, Copy, Check, Globe, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';

type Language = 'en' | 'fr';
type Tab = 'welcome' | 'chat' | 'analysis' | 'research';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisResult {
  extractedText: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
}

interface ResearchResult {
  title: string;
  source: 'PubMed' | 'WHO' | 'CDC';
  summary: string;
  url: string;
}

const translations = {
  en: {
    welcome: 'Welcome',
    chat: 'Chat',
    analysis: 'Analysis',
    research: 'Research',
    heroTitle: 'Your Medical Assistant',
    heroSubtitle: 'AI-powered health information and document analysis',
    features: ['Chat with AI about health topics', 'Analyze medical documents', 'Research medical information'],
    getStarted: 'Get Started',
    disclaimer: '⚠️ For informational purposes only - Always consult healthcare professionals',
    chatPlaceholder: 'Ask a medical question...',
    suggestedQuestions: ['Symptoms of malaria?', 'What causes headaches?', 'Diabetes management tips'],
    uploadOrCapture: 'Upload Document or Capture Image',
    dragDrop: 'Drag & drop a file here, or click to select',
    captureImage: 'Capture Image',
    analyzing: 'Analyzing...',
    summary: 'Summary',
    keyFindings: 'Key Findings',
    recommendations: 'Recommendations',
    nextSteps: 'Next Steps',
    searchPlaceholder: 'Search medical topics...',
    researchTopics: ['Diabetes guidelines', 'Hypertension treatment', 'Malaria prevention'],
    searching: 'Searching...',
    copied: 'Copied!',
    copy: 'Copy',
    aiSummary: 'AI-Generated Summary',
  },
  fr: {
    welcome: 'Bienvenue',
    chat: 'Discussion',
    analysis: 'Analyse',
    research: 'Recherche',
    heroTitle: 'Votre Assistant Médical',
    heroSubtitle: 'Informations de santé et analyse de documents par IA',
    features: ['Discutez avec l\'IA sur la santé', 'Analysez des documents médicaux', 'Recherchez des informations médicales'],
    getStarted: 'Commencer',
    disclaimer: '⚠️ À titre informatif uniquement - Consultez toujours des professionnels de santé',
    chatPlaceholder: 'Posez une question médicale...',
    suggestedQuestions: ['Symptômes du paludisme?', 'Causes des maux de tête?', 'Conseils diabète'],
    uploadOrCapture: 'Télécharger un document ou capturer une image',
    dragDrop: 'Glissez-déposez un fichier ici ou cliquez pour sélectionner',
    captureImage: 'Capturer une image',
    analyzing: 'Analyse en cours...',
    summary: 'Résumé',
    keyFindings: 'Résultats clés',
    recommendations: 'Recommandations',
    nextSteps: 'Prochaines étapes',
    searchPlaceholder: 'Rechercher des sujets médicaux...',
    researchTopics: ['Directives diabète', 'Traitement hypertension', 'Prévention paludisme'],
    searching: 'Recherche en cours...',
    copied: 'Copié!',
    copy: 'Copier',
    aiSummary: 'Résumé généré par IA',
  },
};

export default function MedicareApp() {
  const [activeTab, setActiveTab] = useState<Tab>('welcome');
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const t = translations[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoadingChat(true);

    try {
      const response = await fetch('https://medicare-backend-yk58.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, language }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t process your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      showToast('Error sending message. Please try again.');
      console.error('Chat error:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const response = await fetch('https://medicare-backend-yk58.onrender.com/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      
      setAnalysisResult({
        extractedText: data.extractedText || 'No text extracted',
        summary: data.summary || 'Analysis completed',
        keyFindings: data.keyFindings || ['Processing complete'],
        recommendations: data.recommendations || ['Review results carefully'],
        nextSteps: data.nextSteps || ['Consult with a healthcare professional'],
      });
    } catch (error) {
      showToast('Error analyzing document. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      showToast('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', error);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            handleFileUpload(file);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setIsSearching(true);

    try {
      const response = await fetch('https://medicare-backend-yk58.onrender.com/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language }),
      });

      if (!response.ok) throw new Error('Research request failed');

      const data = await response.json();
      
      setResearchResults(data.results || [
        {
          title: query,
          source: 'PubMed' as const,
          summary: 'Research results for your query. Please consult official medical sources.',
          url: '#',
        },
      ]);
    } catch (error) {
      showToast('Error fetching research. Please try again.');
      console.error('Research error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Medicare AI</h1>
          <p className="text-blue-100 text-sm mt-1">{t.heroSubtitle}</p>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {(['welcome', 'chat', 'analysis', 'research'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap relative ${
                  activeTab === tab
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                {t[tab]}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transition-all" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Disclaimer */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 font-medium">{t.disclaimer}</p>
        </div>

        {/* Welcome Tab */}
        {activeTab === 'welcome' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-8 md:p-12 shadow-xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.heroTitle}</h2>
              <p className="text-xl text-blue-100 mb-8">{t.heroSubtitle}</p>
              <button
                onClick={() => setActiveTab('chat')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                {t.getStarted}
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {t.features.map((feature, idx) => (
                <div key={idx} className="bg-slate-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white text-2xl font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="bg-slate-100 rounded-xl p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 py-12">
                  <p className="text-lg">{language === 'en' ? 'Start a conversation' : 'Commencer une conversation'}</p>
                </div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoadingChat && (
                <div className="flex justify-start mb-4">
                  <div className="bg-blue-600 text-white rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {t.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="bg-white border border-blue-300 text-blue-600 px-4 py-2 rounded-full text-sm hover:bg-blue-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={() => handleSendMessage(chatInput)}
                  disabled={isLoadingChat || !chatInput.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t.uploadOrCapture}</h2>

            {!analysisResult && !isAnalyzing && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-600 cursor-pointer transition-colors bg-slate-50"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <p className="text-slate-700 font-medium">{t.dragDrop}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="text-center">
                  <p className="text-slate-500 mb-4">{language === 'en' ? 'OR' : 'OU'}</p>
                  {!isCameraActive ? (
                    <button
                      onClick={startCamera}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Camera className="w-5 h-5" />
                      {t.captureImage}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <video ref={videoRef} autoPlay playsInline className="w-full max-w-md mx-auto rounded-lg" />
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={captureImage}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {language === 'en' ? 'Capture' : 'Capturer'}
                        </button>
                        <button
                          onClick={stopCamera}
                          className="bg-slate-500 text-white px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          {language === 'en' ? 'Cancel' : 'Annuler'}
                        </button>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="bg-slate-100 rounded-xl p-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-slate-700 font-medium">{t.analyzing}</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                <div className="bg-slate-100 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800">{language === 'en' ? 'Extracted Text' : 'Texte extrait'}</h3>
                    <button
                      onClick={() => copyToClipboard(analysisResult.extractedText, 'extracted')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {copiedId === 'extracted' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">{analysisResult.extractedText}</p>
                </div>

                {(['summary', 'keyFindings', 'recommendations', 'nextSteps'] as const).map((section) => (
                  <div key={section} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full flex justify-between items-center p-4 hover:bg-slate-50 transition-colors"
                    >
                      <h3 className="font-semibold text-slate-800">{t[section]}</h3>
                      {expandedSections.has(section) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections.has(section) && (
                      <div className="p-4 border-t border-slate-200">
                        {section === 'summary' ? (
                          <p className="text-slate-700">{analysisResult[section]}</p>
                        ) : (
                          <ul className="space-y-2">
                            {analysisResult[section].map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span className="text-slate-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setSelectedFile(null);
                  }}
                  className="w-full bg-slate-500 text-white py-3 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  {language === 'en' ? 'Analyze Another Document' : 'Analyser un autre document'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Research Tab */}
        {activeTab === 'research' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder={t.searchPlaceholder}
                className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {t.researchTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(topic)}
                  className="bg-white border border-blue-300 text-blue-600 px-4 py-2 rounded-full text-sm hover:bg-blue-50 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>

            {isSearching && (
              <div className="bg-slate-100 rounded-xl p-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-slate-700 font-medium">{t.searching}</p>
              </div>
            )}

            {researchResults.length > 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    <h3 className="font-semibold text-blue-800">{t.aiSummary}</h3>
                  </div>
                  <p className="text-slate-700">
                    {language === 'en' 
                      ? 'Based on current medical research and guidelines, here are the most relevant findings for your query.'
                      : 'Basé sur la recherche médicale actuelle et les directives, voici les résultats les plus pertinents pour votre requête.'}
                  </p>
                </div>

                {researchResults.map((result, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-slate-800 flex-1">{result.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.source === 'PubMed' ? 'bg-blue-100 text-blue-700' :
                        result.source === 'WHO' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {result.source}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-4">{result.summary}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(result.summary, `research-${idx}`)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        {copiedId === `research-${idx}` ? (
                          <>
                            <Check className="w-4 h-4" />
                            {t.copied}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            {t.copy}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Language Toggle Button */}
      <button
        onClick={() => setLanguage(lang => lang === 'en' ? 'fr' : 'en')}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 z-50"
        title={language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
      >
        <Globe className="w-6 h-6" />
        <span className="ml-2 text-lg">{language === 'en' ? '🇫🇷' : '🇬🇧'}</span>
      </button>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-slide-up">
          <p className="text-sm">{toast}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}