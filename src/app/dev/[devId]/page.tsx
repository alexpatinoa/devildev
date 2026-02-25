"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HelpCircle, Maximize, X, Menu, MessageCircle, Users, Phone, Plus, Loader2, MessageSquare, BrainCircuit, ChevronDown } from 'lucide-react';
import Architecture from '@/components/core/architecture';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SoulCount from '../../../components/core/SoulCount';
import { ChatMessageList, ChatInput } from '@/components/Dev';
import { chatbot, architectureModificationBot } from '../../../../actions/agentsFlow';
import { TerminatingTools, GeneralResponsePayload, InterviewPayload, Tier1Payload, Tier2Payload, type InterviewAnswer, type InterviewQuestion } from '../../../../types/pToA/tools';
import { submitFeedback } from '../../../../actions/feedback';
import { notifyCreditsUpdate, refetchCredits } from '@/lib/credits-events';
import { generateMainArchitecture, triggerArchitectureGeneration } from '../../../../actions/architecture';
import { getChat, addMessageToChat, updateChatMessages, createChatWithId, ChatMessage as ChatMessageType, getUserChats } from '../../../../actions/chat';
import { createArchOptionsFromTier2, getArchOptionsHistory } from '../../../../actions/archOptions';
import {
  getArchitecture,
  updateComponentPositionsDebounced,
  checkArchitectureById,
  ArchitectureData,
  ComponentPosition
} from '../../../../actions/architecturePersistence';
import FileExplorer from '@/components/core/ContextDocs';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { maxChatCharactersLimitFree, maxChatCharactersLimitPro } from '../../../../Limits';
import useUserSubscription from '@/hooks/useSubscription';
import PricingDialog from '@/components/PricingDialog';
import { StackOptions } from '@/components/Dev/StackOptions';

interface UserChat {
  id: string;
  title: string | null;
  updatedAt: Date;
  createdAt: Date;
}

interface Particle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

interface ArchitectureVersion {
  architecture: ArchitectureData;
  componentPositions: Record<string, ComponentPosition>;
  metadata: {
    id: string;
    requirement: string | null;
    generatedAt: Date;
    lastPositionUpdate: Date;
    createdAt: Date;
    updatedAt: Date;
    stackId?: string | null;
  };
}

interface StackData {
  id: string;
  name: string;
  description: string;
  technology: string;
  pros: string[];
  cons: string[];
}

interface ArchOptionsData {
  id: string;
  requirement: string | null;
  stacks: StackData[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Helper function to convert number to Roman numerals
const toRomanNumeral = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ];

  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
};

// Helper function to sanitize JSON string by removing/escaping control characters
const sanitizeJsonString = (jsonString: string): string => {
  // Remove markdown code blocks first
  let cleaned = jsonString
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  // Remove or escape control characters (except \n, \r, \t which are valid in JSON strings)
  // Control characters are characters with ASCII codes 0-31 except for \n (10), \r (13), \t (9)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  return cleaned;
};

// Helper function to safely parse JSON with error handling
const safeJsonParse = (jsonString: string | any): any => {
  // If it's already an object, return it
  if (typeof jsonString !== 'string') {
    return jsonString;
  }

  try {
    // First, try to sanitize and parse
    const sanitized = sanitizeJsonString(jsonString);
    return JSON.parse(sanitized);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Problematic JSON string:', jsonString.substring(0, 500));

    // Try to extract JSON from the string if it's embedded in text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const sanitized = sanitizeJsonString(jsonMatch[0]);
        return JSON.parse(sanitized);
      } catch (retryError) {
        console.error('Retry parse also failed:', retryError);
      }
    }

    // If all parsing fails, throw the error
    throw error;
  }
};

/** Parse chatbot result by terminatingTool; response is stringified JSON from tools. */
function parseChatbotResult(
  response: string | undefined,
  terminatingTool: TerminatingTools | string | undefined
): { kind: 'general_response'; payload: GeneralResponsePayload } | { kind: 'interview_user'; payload: InterviewPayload } | { kind: 'tier_1'; payload: Tier1Payload } | { kind: 'tier_2'; payload: Tier2Payload } | { kind: 'plain'; text: string } | null {
  if (response == null || response === '') return null;
  const tool = terminatingTool?.toLowerCase?.() ?? terminatingTool;
  if (tool === TerminatingTools.GENERAL_RESPONSE || tool === 'general_response') {
    const payload = JSON.parse(response) as GeneralResponsePayload;
    return { kind: 'general_response', payload };
  }
  if (tool === TerminatingTools.INTERVIEW_USER || tool === 'interview_user') {
    const payload = JSON.parse(response) as InterviewPayload;
    return { kind: 'interview_user', payload };
  }
  if (tool === TerminatingTools.TIER_1 || tool === 'tier_1') {
    const payload = JSON.parse(response) as Tier1Payload;
    return { kind: 'tier_1', payload };
  }
  if (tool === TerminatingTools.TIER_2 || tool === 'tier_2') {
    const payload = JSON.parse(response) as Tier2Payload;
    return { kind: 'tier_2', payload };
  }
  return { kind: 'plain', text: response };
}

/** Format interview answers as a single string for the backend when isInterviewed is true. */
function formatInterviewAnswersForApi(questions: InterviewQuestion[], answers: InterviewAnswer[]): string {
  return answers
    .map((a) => {
      const q = questions[a.questionIndex];
      const title = q?.title ?? `Question ${a.questionIndex + 1}`;
      return `${title}: ${a.selected.join(', ')}`;
    })
    .join('\n');
}

const DevPage = () => {
  const params = useParams();
  const chatId = params?.devId as string;

  const [inputMessage, setInputMessage] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [textareaHeight, setTextareaHeight] = useState('60px');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [currentStartOrNot, setCurrentStartOrNot] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'stacks' | 'context'>('architecture');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [architectureData, setArchitectureData] = useState<ArchitectureData | null>(null);
  const [isArchitectureLoading, setIsArchitectureLoading] = useState(false);
  const [architectureGenerated, setArchitectureGenerated] = useState(false);
  const [isGeneratingMainArch, setIsGeneratingMainArch] = useState(false);
  const [archOptionsHistory, setArchOptionsHistory] = useState<ArchOptionsData[]>([]);
  const [selectedArchOptionsId, setSelectedArchOptionsId] = useState<string | null>(null);
  const [archOptionsLoading, setArchOptionsLoading] = useState(false);
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);
  const [showOptionsButton, setShowOptionsButton] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  // Architecture versions state
  const [allArchitectures, setAllArchitectures] = useState<ArchitectureVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);

  // Derived state for stack IDs that already have architectures generated
  const generatedStackIds = React.useMemo(() => {
    return allArchitectures.map(arch => arch.metadata?.stackId).filter(Boolean) as string[];
  }, [allArchitectures]);

  // Component position persistence
  const [componentPositions, setComponentPositions] = useState<Record<string, ComponentPosition>>({});

  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // 30% default
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startLeftWidth, setStartLeftWidth] = useState(30);


  // New sidebar state for dev page
  const [isDevSidebarHovered, setIsDevSidebarHovered] = useState(false);
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  // Feedback dialog state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // How to dialog state
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // Character limit state
  const [showCharacterLimitDialog, setShowCharacterLimitDialog] = useState(false);
  const [showLowSoulsDialog, setShowLowSoulsDialog] = useState(false);

  // Coach mark state
  const { userSubscription, isLoadingUserSubscription, isErrorUserSubscription } = useUserSubscription();

  // Mobile responsive state
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedArchOptions = React.useMemo(
    () => archOptionsHistory.find((optionSet) => optionSet.id === selectedArchOptionsId) ?? null,
    [archOptionsHistory, selectedArchOptionsId]
  );

  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();


  const [MAX_CHARACTERS, setMAX_CHARACTERS] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Handle panel resizing
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;
        const newLeftWidth = (newX / containerWidth) * 100;

        // Constrain between 20% and 80%
        const constrainedWidth = Math.min(80, Math.max(20, newLeftWidth));
        setLeftPanelWidth(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    setMAX_CHARACTERS(userSubscription ? maxChatCharactersLimitPro : maxChatCharactersLimitFree);
  }, [userSubscription]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manage body class for mobile panel
  useEffect(() => {
    if (isMobilePanelOpen) {
      document.body.classList.add('mobile-panel-open');
    } else {
      document.body.classList.remove('mobile-panel-open');
    }

    return () => {
      document.body.classList.remove('mobile-panel-open');
    };
  }, [isMobilePanelOpen]);

  useEffect(() => {
    if (archOptionsHistory.length === 0) {
      setSelectedArchOptionsId(null);
      setSelectedStackId(null);
      return;
    }

    if (selectedArchOptionsId && !archOptionsHistory.some((optionSet) => optionSet.id === selectedArchOptionsId)) {
      setSelectedArchOptionsId(null);
    }
  }, [archOptionsHistory, selectedArchOptionsId]);

  useEffect(() => {
    if (!selectedArchOptions || !selectedStackId) return;
    const stackExists = selectedArchOptions.stacks.some((stack) => stack.id === selectedStackId);
    if (!stackExists) {
      setSelectedStackId(null);
    }
  }, [selectedArchOptions, selectedStackId]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartLeftWidth(leftPanelWidth);
  };


  // Handle component position changes with persistence
  const handlePositionChange = async (positions: Record<string, ComponentPosition>) => {
    setComponentPositions(positions);

    // Save to database with debouncing
    if (chatId && architectureGenerated) {
      await updateComponentPositionsDebounced(chatId, positions);
    }
  };

  // Helper function to calculate total characters in messages
  const calculateTotalCharacters = (messagesArray: ChatMessageType[]) => {
    if (!messagesArray || !Array.isArray(messagesArray)) {
      return 0;
    }
    return messagesArray.reduce((total, message) => {
      return total + (message?.content?.length || 0);
    }, 0);
  };

  // Handle version change
  const handleVersionChange = (versionIndex: number) => {
    if (versionIndex >= 0 && versionIndex < allArchitectures.length) {
      setSelectedVersionIndex(versionIndex);
      setArchitectureData(allArchitectures[versionIndex].architecture);
      setComponentPositions(allArchitectures[versionIndex].componentPositions || {});
      setIsVersionDropdownOpen(false);
    }
  };

  // Load chat data and architecture when component mounts
  useEffect(() => {
    const loadChatAndArchitecture = async () => {

      if (!chatId || !isSignedIn) return;


      try {
        // Check if this is a new chat from localStorage
        const isNewChat = localStorage.getItem('isNewChat');
        if (isNewChat) {
          setIsNewChat(true);
        }
        const newChatId = localStorage.getItem('newChatId');
        const firstMessage = localStorage.getItem('firstMessage');

        if (isNewChat && firstMessage) {
          // This is a new chat - create it and process the first message


          // Set up initial state
          const userMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: 'user',
            content: firstMessage,
            timestamp: new Date().toISOString()
          };

          setMessages([userMessage]);

          processInitialMessage(firstMessage, [userMessage]);

          const createResult = await createChatWithId(chatId, firstMessage);
          if (!createResult.success) {
            console.error("Failed to create chat:", createResult.error);
            localStorage.removeItem('newChatId');
            localStorage.removeItem('firstMessage');
            localStorage.removeItem('isNewChat');
            return;
          }

          // Clear localStorage
          localStorage.removeItem('newChatId');
          localStorage.removeItem('firstMessage');
          localStorage.removeItem('isNewChat');

        } else {

          setIsLoadingChat(true);
          // This is an existing chat - load from database
          const chatResult = await getChat(chatId);
          if (chatResult.success && chatResult.chat) {
            const chatMessages = chatResult.chat.messages as unknown as ChatMessageType[];
            setMessages(chatMessages);
            setIsChatMode(true);

            // Load architecture data if it exists 
            const archResult = await getArchitecture(chatId);
            if (archResult.success && archResult.architectures && archResult.architectures.length > 0) {
              // Set all architectures
              setAllArchitectures(archResult.architectures);

              // Set the latest architecture as default
              const latestIndex = archResult.architectures.length - 1;
              setSelectedVersionIndex(latestIndex);
              setArchitectureData(archResult.architectures[latestIndex].architecture);
              setComponentPositions(archResult.architectures[latestIndex].componentPositions || {});
              setArchitectureGenerated(true);
            }

            setIsLoadingChat(false);

            const archOptionsResult = await getArchOptionsHistory(chatId);
            if (archOptionsResult.success && archOptionsResult.archOptions) {
              setArchOptionsHistory(archOptionsResult.archOptions);
              setShowOptionsButton(archOptionsResult.archOptions.length > 0);
            }

          } else {
            setIsLoadingChat(false);
            console.error("Failed to load chat:", chatResult.error);
            // Clear any stale localStorage data
            localStorage.removeItem('newChatId');
            localStorage.removeItem('firstMessage');
            router.push('/');
          }
        }
      } catch (error) {
        console.error("Error loading chat:", error);
        // Clear any stale localStorage data
        localStorage.removeItem('newChatId');
        localStorage.removeItem('firstMessage');
        router.push('/');
      } finally {
        setIsLoadingChat(false);
      }
    };

    loadChatAndArchitecture();
  }, [chatId, isSignedIn, router]);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const generatedParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
    }));
    setParticles(generatedParticles);
  }, []);

  // Function to fetch user's chats
  const fetchUserChats = async () => {
    if (!isSignedIn) return;

    setChatsLoading(true);
    try {
      const result = await getUserChats(10); // Get last 10 chats
      if (result.success && result.chats) {
        setUserChats(result.chats);
      } else {
        console.error('Failed to fetch chats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching user chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  // Function to handle new chat creation
  const handleNewChat = () => {
    router.push('/');
  };

  // Function to handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || isSubmittingFeedback) return;

    setIsSubmittingFeedback(true);
    setFeedbackMessage(null);

    try {
      const result = await submitFeedback("dev/" + chatId, feedbackText);

      if (result.success) {
        setFeedbackMessage({
          type: 'success',
          text: 'Thank you for your feedback! We appreciate your input.'
        });
        setFeedbackText('');

        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setFeedbackMessage(null);
        }, 2000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'Failed to submit feedback. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Fetch chats when user is signed in
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      fetchUserChats();
    }
  }, [isSignedIn, isLoaded]);


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isArchitectureLoading, architectureData]);

  const handleStackGenerate = async (stackOption: StackData) => {
    if (!chatId || !user?.id || !selectedArchOptions) return;

    setIsGeneratingMainArch(true);
    setIsArchitectureLoading(true);
    setActiveTab('architecture');

    if (isMobile) {
      setIsMobilePanelOpen(true);
    }

    try {
      const result = await generateMainArchitecture({
        requirement: selectedArchOptions.requirement || "",
        title: stackOption.name,
        technology: stackOption.technology,
        description: stackOption.description,
        chatId: chatId,
        stackId: stackOption.id,
        userId: user.id
      });

      if (result.success && result.architecture) {
        if (result.creditsRemaining !== undefined) {
          notifyCreditsUpdate(result.creditsRemaining);
        }

        const archResult = await getArchitecture(chatId);
        if (archResult.success && archResult.architectures && archResult.architectures.length > 0) {
          setAllArchitectures(archResult.architectures);
          const latestIndex = archResult.architectures.length - 1;
          setSelectedVersionIndex(latestIndex);
          setArchitectureData(archResult.architectures[latestIndex].architecture);
          setComponentPositions(archResult.architectures[latestIndex].componentPositions || {});
        } else {
          setArchitectureData(result.architecture as unknown as ArchitectureData);
          setComponentPositions(
            (result.architecture.componentPositions as unknown as Record<string, ComponentPosition>) || {}
          );
        }
        setArchitectureGenerated(true);
      } else if (result.error === 'INSUFFICIENT_CREDITS') {
        if (result.remainingCredits !== undefined) {
          notifyCreditsUpdate(result.remainingCredits);
        }
        setShowLowSoulsDialog(true);
        setActiveTab('stacks');
      } else {
        console.error("Failed to generate main architecture:", result.error);
        setActiveTab('stacks');
      }
    } catch (error) {
      console.error("Error generating main architecture:", error);
      setActiveTab('stacks');
    } finally {
      setIsGeneratingMainArch(false);
      setIsArchitectureLoading(false);
    }
  };

  // Function to generate architecture
  const genArchitecture = async (requirement: string, conversationHistory: any[] = []) => {

    setIsArchitectureLoading(true);

    if (isMobile) {
      setIsMobilePanelOpen(true);
    }

    try {
      if (user?.id) {
        const generationId = crypto.randomUUID();

        const result = await triggerArchitectureGeneration({
          generationId,
          requirement,
          conversationHistory,
          architectureData,
          chatId,
          componentPositions,
          userId: user.id,
        });

        if (result.success) {
          // Start polling for the architecture
          pollForArchitecture(generationId);
        } else if (result.error === 'INSUFFICIENT_CREDITS') {
          if (result.remainingCredits !== undefined) {
            notifyCreditsUpdate(result.remainingCredits);
          }
          setShowLowSoulsDialog(true);
          setIsArchitectureLoading(false);
        } else {
          console.error('Failed to trigger architecture generation:', result.error);
          setIsArchitectureLoading(false);
        }
      }
    } catch (error) {
      console.error('Error generating architecture:', error);
      setIsArchitectureLoading(false);
    }
  };

  // Function to poll for architecture completion
  const pollForArchitecture = async (generationId: string) => {
    const maxAttempts = 120; // Poll for up to 10 minutes total
    let attempts = 0;
    const initialPhaseDuration = 4 * 60 * 1000; // 4 minutes in milliseconds
    const initialPollInterval = 15 * 1000; // 15 seconds for first 4 minutes
    const finalPollInterval = 5 * 1000; // 5 seconds after 4 minutes
    const startTime = Date.now();

    const poll = async () => {
      try {
        attempts++;
        const elapsedTime = Date.now() - startTime;
        const isInitialPhase = elapsedTime < initialPhaseDuration;
        const currentInterval = isInitialPhase ? initialPollInterval : finalPollInterval;

        const result = await checkArchitectureById(generationId);

        if (result.success && result.exists && result.architecture) {
          // Architecture found! Update the state

          // Reload all architectures to get the updated list
          const archResult = await getArchitecture(chatId);
          if (archResult.success && archResult.architectures && archResult.architectures.length > 0) {
            setAllArchitectures(archResult.architectures);

            // Set the latest architecture as the selected one
            const latestIndex = archResult.architectures.length - 1;
            setSelectedVersionIndex(latestIndex);
            setArchitectureData(archResult.architectures[latestIndex].architecture);
            setComponentPositions(archResult.architectures[latestIndex].componentPositions || {});
          } else {
            // Fallback to the result architecture if reload fails
            setArchitectureData(result.architecture);
            setComponentPositions(result.componentPositions || {});
          }

          setArchitectureGenerated(true);
          setIsArchitectureLoading(false);

          // Refetch credits after background job completes
          if (user?.id) {
            await refetchCredits(user.id);
          }

          return;
        }

        if (attempts >= maxAttempts) {
          console.error("Polling timeout: Architecture not found after maximum attempts");
          setIsArchitectureLoading(false);
          return;
        }

        // Continue polling with appropriate interval
        setTimeout(poll, currentInterval);

      } catch (error) {
        console.error("Error polling for architecture:", error);
        setIsArchitectureLoading(false);
      }
    };

    // Start polling
    poll();
  };

  // Shared logic: call chatbot, handle credits/parse/assistant message, update state and DB.
  const processChatbotResponse = async (
    userMessage: string,
    messagesForApi: ChatMessageType[],
    messagesWithUserMessage: ChatMessageType[],
    options?: { onError?: (messagesWithUser: ChatMessageType[]) => Promise<void>; isInterviewed?: boolean }
  ): Promise<void> => {
    try {
      const result = await chatbot(userMessage, messagesForApi, user?.id ?? null, options?.isInterviewed ?? false);

      if (typeof result === 'object' && result.error === 'INSUFFICIENT_CREDITS') {
        if (result.remainingCredits !== undefined) {
          notifyCreditsUpdate(result.remainingCredits);
        }
        setShowLowSoulsDialog(true);
        const assistantMessage: ChatMessageType = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Your souls count is low. Please upgrade or buy more souls to continue.',
          timestamp: new Date().toISOString()
        };
        const updatedMessages = [...messagesWithUserMessage, assistantMessage];
        setMessages(updatedMessages);
        setIsLoading(false);
        await updateChatMessages(chatId, updatedMessages);
        return;
      }
      if (typeof result === 'object' && result.remainingCredits !== undefined) {
        notifyCreditsUpdate(result.remainingCredits);
      }

      const response = typeof result === 'object' ? result?.response : undefined;
      const terminatingTool = typeof result === 'object' ? result?.terminatingTool : undefined;
      const parsed = parseChatbotResult(response, terminatingTool);

      if (parsed === null) {
        setIsLoading(false);
        return;
      }

      let content: string;
      let interviewPayload: ChatMessageType['interviewPayload'];
      let prompt: string | undefined;
      let tier2Context: string | undefined;
      if (parsed.kind === 'general_response') {
        content = parsed.payload.response;
      } else if (parsed.kind === 'interview_user') {
        content = 'Answer the questions below.';
        interviewPayload = parsed.payload;
      } else if (parsed.kind === 'tier_1') {
        content = parsed.payload.response;
        prompt = parsed.payload.prompt;
      } else if (parsed.kind === 'tier_2') {
        content = parsed.payload.response;
        tier2Context = parsed.payload.context;
      } else {
        content = parsed.text;
      }

      const assistantMessage: ChatMessageType = {
        id: Date.now().toString(),
        type: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        ...(interviewPayload && { interviewPayload }),
        ...(prompt !== undefined && { prompt }),
        ...(tier2Context !== undefined && { tier2Context }),
      };
      const updatedMessages = [...messagesWithUserMessage, assistantMessage];
      setMessages(updatedMessages);
      setIsLoading(false);
      await updateChatMessages(chatId, updatedMessages);

      if (tier2Context && chatId) {
        setArchOptionsLoading(true);
        try {
          setIsLoading(true);
          const optionsResult = await createArchOptionsFromTier2(chatId, tier2Context);
          setIsLoading(false);
          if (typeof optionsResult === 'object' && optionsResult.error === 'INSUFFICIENT_CREDITS') {
            if (optionsResult.remainingCredits !== undefined) {
              notifyCreditsUpdate(optionsResult.remainingCredits);
            }
            setShowLowSoulsDialog(true);
            setArchOptionsLoading(false);
            return;
          }
          if (typeof optionsResult === 'object' && optionsResult.remainingCredits !== undefined) {
            notifyCreditsUpdate(optionsResult.remainingCredits);
          }
          if (optionsResult.success && optionsResult.archOptions) {
            setArchOptionsHistory((previous) => {
              const withoutCurrent = previous.filter((optionSet) => optionSet.id !== optionsResult.archOptions.id);
              return [optionsResult.archOptions, ...withoutCurrent];
            });
            setSelectedArchOptionsId(optionsResult.archOptions.id);
            setSelectedStackId(null);
            setShowOptionsButton(true);
            setActiveTab('stacks');
            if (isMobile) {
              setIsMobilePanelOpen(true);
            }
          }
        } catch (optionsError) {
          console.error('Error creating arch options:', optionsError);
        } finally {
          setArchOptionsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error calling chatbot:', error);
      setIsLoading(false);
      await options?.onError?.(messagesWithUserMessage);
    }
  };

  // Process the initial message when loading a chat
  const processInitialMessage = async (initialMessage: string, currentMessages: ChatMessageType[]) => {
    setIsLoading(true);
    await processChatbotResponse(initialMessage, currentMessages, currentMessages);
  };

  const handleInterviewComplete = async (messageId: string, answers: InterviewAnswer[]) => {
    setIsLoading(true);
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const msg = messages[idx];
    if (!msg?.interviewPayload) return;
    const updated = messages.map((m, i) =>
      i === idx ? { ...m, interviewAnswers: answers } : m
    );
    setMessages(updated);
    await updateChatMessages(chatId, updated);

    // Build history for API: the message with interview answers must have content the backend uses as {interviewAnswers}
    const answersContent = formatInterviewAnswersForApi(msg.interviewPayload.questions, answers);
    const messagesForApi = updated.map((m, i) =>
      i === idx ? { ...m, content: answersContent } : m
    );
    await processChatbotResponse(
      'I have completed the interview.',
      messagesForApi,
      updated,
      {
        isInterviewed: true,
        onError: async (messagesWithUser) => {
          const errorMessage: ChatMessageType = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'Sorry, I encountered an error while processing your request. Please try again.',
            timestamp: new Date().toISOString()
          };
          const finalMessages = [...messagesWithUser, errorMessage];
          setMessages(finalMessages);
          try {
            await addMessageToChat(chatId, errorMessage);
          } catch (saveError) {
            console.error('Error saving error message:', saveError);
          }
        }
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (isLoadingUserSubscription) return;
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Check character limit before processing
    const currentTotalCharacters = calculateTotalCharacters(messages);
    if (currentTotalCharacters >= MAX_CHARACTERS) {
      setShowCharacterLimitDialog(true);
      return;
    }

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message and switch to chat mode
    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setIsChatMode(true);
    setIsLoading(true);

    const currentInput = inputMessage;
    setInputMessage('');
    setTextareaHeight('60px');

    if (architectureData) {
      try {
        const result = await architectureModificationBot(currentInput, messages, architectureData, user?.id ?? null);

        // Handle insufficient credits
        if (typeof result === 'object' && result.error === 'INSUFFICIENT_CREDITS') {
          if (result.remainingCredits !== undefined) {
            notifyCreditsUpdate(result.remainingCredits);
          }
          setShowLowSoulsDialog(true);
          const assistantMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: 'assistant',
            content: 'Your souls count is low. Please upgrade or buy more souls to continue.',
            timestamp: new Date().toISOString()
          };
          const updatedMessages = [...updatedMessagesWithUser, assistantMessage];
          setMessages(updatedMessages);
          setIsLoading(false);
          await updateChatMessages(chatId, updatedMessages);
          return;
        }

        // Notify credits update if available
        if (typeof result === 'object' && result.remainingCredits !== undefined) {
          notifyCreditsUpdate(result.remainingCredits);
        }

        const chatbotResponse = typeof result === 'string' ? result : result.textContent;
        const parsedClassifier = safeJsonParse(chatbotResponse);

        setCurrentStartOrNot(parsedClassifier.is_change);
        if (parsedClassifier.is_change) {
          const assistantMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: 'assistant',
            content: parsedClassifier.verification,
            timestamp: new Date().toISOString()
          };
          const updatedMessages = [...updatedMessagesWithUser, assistantMessage];
          setMessages(updatedMessages);
          setIsLoading(false);
          await genArchitecture(currentInput, messages);
          await updateChatMessages(chatId, updatedMessages);
        } else {
          const assistantMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: 'assistant',
            content: parsedClassifier.general,
            timestamp: new Date().toISOString()
          };
          const updatedMessages = [...updatedMessagesWithUser, assistantMessage];
          setMessages(updatedMessages);
          setIsLoading(false);
          await updateChatMessages(chatId, updatedMessages);
        }
      } catch (error) {
        console.error('Error processing architecture modification:', error);
        const errorMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date().toISOString()
        };
        const finalMessages = [...updatedMessagesWithUser, errorMessage];
        setMessages(finalMessages);
        try {
          await addMessageToChat(chatId, errorMessage);
        } catch (saveError) {
          console.error('Error saving error message:', saveError);
        }
        setIsLoading(false);
      }
    } else {
      await processChatbotResponse(currentInput, messages, updatedMessagesWithUser, {
        onError: async (messagesWithUser) => {
          const errorMessage: ChatMessageType = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'Sorry, I encountered an error while processing your request. Please try again.',
            timestamp: new Date().toISOString()
          };
          const finalMessages = [...messagesWithUser, errorMessage];
          setMessages(finalMessages);
          try {
            await addMessageToChat(chatId, errorMessage);
          } catch (saveError) {
            console.error('Error saving error message:', saveError);
          }
        }
      });
    }
  };

  const handleSelectOptionSet = (optionSetId: string | null) => {
    setSelectedArchOptionsId(optionSetId);
    if (optionSetId === null) {
      setSelectedStackId(null);
    }
  };

  const handleViewOptions = () => {
    setActiveTab('stacks');
    if (isMobile) {
      setIsMobilePanelOpen(true);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 180; // Maximum height in pixels (about 7-8 lines)

    if (scrollHeight <= maxHeight) {
      textarea.style.height = scrollHeight + 'px';
      setTextareaHeight(scrollHeight + 'px');
    } else {
      textarea.style.height = maxHeight + 'px';
      setTextareaHeight(maxHeight + 'px');
    }
  };

  if (isLoadingChat) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 " />
      </div>
    );
  }


  // Fullscreen Architecture view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
        {/* Header with Close button and Version dropdown */}
        <div className="absolute top-4 left-4 right-4 z-60 flex items-center justify-between">
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/40 rounded-lg transition-colors group"
          >
            <X className="h-5 w-5 text-gray-300 group-hover:text-white" />
          </button>

          {/* Version Dropdown in fullscreen */}
          {allArchitectures.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-all duration-200 border border-gray-600/40"
                title="Select Architecture Version"
              >
                <span className="font-medium">Version {toRomanNumeral(selectedVersionIndex + 1)}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isVersionDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsVersionDropdownOpen(false)}
                  />

                  {/* Dropdown content */}
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden">
                    <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                      {allArchitectures.map((arch, index) => (
                        <button
                          key={arch.metadata.id}
                          onClick={() => handleVersionChange(index)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${index === selectedVersionIndex
                            ? 'bg-red-500/20 text-white border-l-2 border-red-500'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Version {toRomanNumeral(index + 1)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(arch.metadata.createdAt).toLocaleDateString()} at {new Date(arch.metadata.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen Architecture */}
        <div className="flex-1 p-8 pt-16 overflow-hidden">
          <div className="h-full">
            <Architecture
              architectureData={architectureData || undefined}
              isLoading={isArchitectureLoading}
              isFullscreen={true}
              customPositions={componentPositions}
              onPositionsChange={handlePositionChange}
            />
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Enhanced Navbar */}
      <nav className="h-16 bg-black/90 backdrop-blur-sm border-b border-gray-800/50 flex items-center justify-between px-6 flex-shrink-0 relative">
        {/* Left side - Burger menu and Logo */}
        <div className="flex items-center space-x-4">
          {/* Burger menu indicator - hide when sidebar is open */}
          <button
            onClick={() => setIsDevSidebarHovered(!isDevSidebarHovered)}
            className={`p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200`}
            title="Open sidebar"
          >
            <Menu
              className={`h-6 w-6 text-gray-400 hover:text-white transition-colors`}
            />
          </button>


          {/* Logo - clickable to home */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
            title="Go to Home"
          >
            <Image
              src="/text01.png"
              alt="DevilDev Logo"
              width={15000}
              height={4000}
              className="h-full w-32 "
              priority
            />
          </button>
        </div>

        {/* Right side - How to, Feedback button and User avatar */}
        <div className="flex items-center space-x-3">

          {/* Soul Count */}
          <SoulCount />

          {/* <button
            onClick={() => window.open('/connect-mcp', '_blank')}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="Send Feedback"
          >
            <BrainCircuit className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              Connect MCP
            </span>
          </button> */}

          {/* Feedback button */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="Send Feedback"
          >
            <MessageSquare className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              Feedback
            </span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center">
            <Avatar className="size-9 ring-2 ring-gray-600/30 hover:ring-gray-500/50 transition-all cursor-pointer duration-200">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
              <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Hover trigger area - invisible but extends to far left */}
      {isSignedIn && (
        <div
          className="fixed top-16 left-0 w-4 h-[calc(100vh-4rem)] z-30"
          onMouseEnter={() => setIsDevSidebarHovered(true)}
        />
      )}

      {/* Hover-expandable Sidebar for signed in users */}
      {isSignedIn && (
        <div
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-black/30 backdrop-blur-md border-r border-red-500/20 transition-all duration-300 ease-in-out z-20 group ${isDevSidebarHovered ? 'w-72' : 'w-0'
            } overflow-hidden`}
          onMouseLeave={() => setIsDevSidebarHovered(false)}
        >

          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative flex flex-col h-full pt-8 pb-3">
            {/* Top navigation items */}
            <div className="px-2 space-y-2">
              <button
                onClick={handleNewChat}
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item w-full"
                title="New Chat"
              >
                <Plus className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                  New Chat
                </span>
              </button>
              <a
                href="/devlogs"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="Community"
              >
                <Users className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                  Community
                </span>
              </a>
              <a
                href="/contact"
                className="flex items-center space-x-4 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 hover:border-red-500/30 border border-transparent transition-all duration-200 group/item"
                title="Contact"
              >
                <Phone className="h-5 w-5 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-200 text-red-400" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                  Contact
                </span>
              </a>
            </div>

            {/* Elegant divider */}
            <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>

            {/* Chats section */}
            <div className="flex-1 px-2">
              <div className="flex items-center space-x-4 px-3 py-2  mb-3">
                <MessageCircle className="h-5 w-5 text-red-400/70 flex-shrink-0" />
                <span className={`text-sm font-medium text-red-400/90 whitespace-nowrap transition-all duration-300 ${isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                  Chats
                </span>
              </div>
              <div className={`space-y-1 transition-all duration-300 ${isDevSidebarHovered ? 'opacity-100' : 'opacity-0'
                } max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-red-500/20`}>
                {chatsLoading ? (
                  <div className="flex items-center justify-center px-6 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-red-400/60" />
                  </div>
                ) : userChats.length > 0 ? (
                  userChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => router.push(`/dev/${chat.id}`)}
                      className={`w-full text-left px-3 py-2.5 rounded-md border transition-all duration-200 group/chat ${chat.id === chatId
                        ? 'text-white bg-red-500/20 border-red-500/40'
                        : 'text-gray-300 hover:text-white hover:bg-black/30 hover:border-red-500/20 border-transparent'
                        }`}
                      title={chat.title || 'Untitled Chat'}
                    >
                      <div className="truncate text-sm font-medium">
                        {chat.title || 'Untitled Chat'}
                      </div>
                      <div className="text-xs text-gray-500 group-hover/chat:text-gray-400 truncate mt-1">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-xs italic">
                    No recent chats
                  </div>
                )}
              </div>
            </div>

            {/* User avatar at bottom with enhanced design */}
            <div className="px-2 mt-auto">
              <div className="flex items-center space-x-3 px-3 py-3 rounded-lg backdrop-blur-sm bg-black/20">
                <Avatar className="size-8 ring-2 ring-white">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                    {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 min-w-0 transition-all duration-300 ${isDevSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                  <p className="text-sm font-medium text-white truncate">
                    {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thin accent line on the right */}
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-red-500/40 to-transparent"></div>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={containerRef} className="flex-1 flex gap-1 p-4 min-h-0 relative pb-0 md:pb-4 h-full">
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Left Chat Panel - Resizable */}
            <div
              className="bg-black border border-gray-800 rounded-xl flex flex-col min-h-0 transition-all duration-200 ease-out"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="flex items-center px-4 py-3 rounded-t-xl border-b border-gray-800">
                <div className="flex space-x-1">
                  <button
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 text-white bg-gray-700/50`}
                  >
                    Chat
                  </button>
                </div>
              </div>
              {/* Desktop Chat Messages */}
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                isArchitectureLoading={isArchitectureLoading}
                architectureData={architectureData}
                showOptionsButton={showOptionsButton}
                isOptionsLoading={archOptionsLoading}
                userInitial={user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                onViewOptions={handleViewOptions}
                messagesEndRef={messagesEndRef}
                onInterviewComplete={handleInterviewComplete}
              />



              {/* Input Area */}
              <ChatInput
                inputMessage={inputMessage}
                textareaHeight={textareaHeight}
                isLoading={isLoading}
                isArchitectureLoading={isArchitectureLoading}
                maxLength={MAX_CHARACTERS}
                onInputChange={handleTextareaChange}
                onSubmit={handleSubmit}
              />
            </div>

            {/* Resize Handle */}
            <div
              className={`w-1 bg-transparent hover:bg-gray-500/50 cursor-col-resize transition-all duration-200 relative group ${isResizing ? 'bg-gray-500/70' : ''
                }`}
              onMouseDown={handleResizeStart}
            >
              {/* Invisible wider hit area for easier grabbing */}
              <div className="absolute inset-0 -left-2 -right-2 w-5"></div>

              {/* Visual indicator on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
              </div>
            </div>

            {/* Right Panel with Tabs */}
            <div
              className="bg-black border border-gray-800 rounded-xl flex flex-col min-h-0 transition-all duration-200 ease-out"
              style={{ width: `${100 - leftPanelWidth}%` }}
            >
              {/* Clean Tab Headers */}
              <div className="flex items-center justify-between px-4 py-3 rounded-t-xl border-b border-gray-800">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab('architecture')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'architecture'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Architecture
                  </button>

                  <button
                    onClick={() => setActiveTab('stacks')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'stacks'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Stack Options
                  </button>

                  <button
                    onClick={() => setActiveTab('context')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'context'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Docs
                  </button>
                </div>

                {/* Version dropdown and Fullscreen button - only show for architecture tab */}
                {activeTab === 'architecture' && (
                  <div className="flex items-center space-x-2">
                    {/* Version Dropdown */}
                    {allArchitectures.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-gray-700/50"
                          title="Select Architecture Version"
                        >
                          <span className="font-medium">Version {toRomanNumeral(selectedVersionIndex + 1)}</span>
                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isVersionDropdownOpen && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setIsVersionDropdownOpen(false)}
                            />

                            {/* Dropdown content */}
                            <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden">
                              <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                                {allArchitectures.map((arch, index) => (
                                  <button
                                    key={arch.metadata.id}
                                    onClick={() => handleVersionChange(index)}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${index === selectedVersionIndex
                                      ? 'bg-red-500/20 text-white border-l-2 border-red-500'
                                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">Version {toRomanNumeral(index + 1)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(arch.metadata.createdAt).toLocaleDateString()} at {new Date(arch.metadata.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Fullscreen button */}
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                      title="Fullscreen Architecture"
                    >
                      <Maximize className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden min-h-0 p-4">
                <div className={`h-full ${activeTab === 'architecture' ? 'block' : 'hidden'}`}>
                  <Architecture
                    architectureData={architectureData || undefined}
                    isLoading={isArchitectureLoading}
                    customPositions={componentPositions}
                    onPositionsChange={handlePositionChange}
                  />
                </div>

                <div className={`h-full ${activeTab === 'stacks' ? 'block' : 'hidden'}`}>
                  <StackOptions
                    optionSets={archOptionsHistory}
                    selectedOptionSetId={selectedArchOptionsId}
                    onSelectOptionSet={handleSelectOptionSet}
                    selectedStackId={selectedStackId}
                    onSelect={setSelectedStackId}
                    isLoading={archOptionsLoading}
                    isGenerating={isGeneratingMainArch}
                    onGenerate={handleStackGenerate}
                    generatedStackIds={generatedStackIds}
                  />
                </div>

                <div className={`h-full ${activeTab === 'context' ? 'block' : 'hidden'}`}>
                  <FileExplorer />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <>
            {/* Chat Panel - 85% height */}
            <div
              className="bg-black border border-gray-800 rounded-xl flex flex-col min-h-0 transition-all duration-200 ease-out w-full h-[85%]"
            >
              <div className="flex items-center px-4 py-3 rounded-t-xl border-b border-gray-800">
                <div className="flex space-x-1">
                  <button
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 text-white bg-gray-700/50`}
                  >
                    Chat
                  </button>
                </div>
              </div>

              {/* Chat Messages with refactored component */}
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                isArchitectureLoading={isArchitectureLoading}
                architectureData={architectureData}
                showOptionsButton={showOptionsButton}
                isOptionsLoading={archOptionsLoading}
                userInitial={user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                onViewOptions={handleViewOptions}
                messagesEndRef={messagesEndRef}
                onInterviewComplete={handleInterviewComplete}
              />



              {/* Input Area */}
              <ChatInput
                inputMessage={inputMessage}
                textareaHeight={textareaHeight}
                isLoading={isLoading}
                isArchitectureLoading={isArchitectureLoading}
                maxLength={MAX_CHARACTERS}
                onInputChange={handleTextareaChange}
                onSubmit={handleSubmit}
              />
            </div>
          </>
        )}

        {/* Mobile Bottom Panel */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out h-[15%]">
          {/* Minimized Panel */}
          {!isMobilePanelOpen && (
            <div className="bg-black border border-gray-800 rounded-xl mx-4 mb-4 h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setActiveTab('architecture');
                      setIsMobilePanelOpen(true);
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'architecture'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400'
                      }`}
                  >
                    Architecture
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('stacks');
                      setIsMobilePanelOpen(true);
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'stacks'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400'
                      }`}
                  >
                    Stacks
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('context');
                      setIsMobilePanelOpen(true);
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'context'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400'
                      }`}
                  >
                    Docs
                  </button>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setIsMobilePanelOpen(true)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>

              {/* Content preview area */}
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="text-gray-400 text-sm text-center">
                  {activeTab === 'architecture'
                    ? 'Tap to view architecture'
                    : activeTab === 'stacks'
                      ? 'Tap to view stack options'
                      : 'Tap to view documentation'}
                </div>
              </div>
            </div>
          )}

          {/* Full Screen Panel */}
          {isMobilePanelOpen && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-black">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('architecture')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'architecture'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400'
                      }`}
                  >
                    Architecture
                  </button>

                  <button
                    onClick={() => setActiveTab('stacks')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'stacks'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400'
                      }`}
                  >
                    Stack Options
                  </button>

                  <button
                    onClick={() => setActiveTab('context')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'context'
                      ? 'text-white bg-gray-700/50'
                      : 'text-gray-400'
                      }`}
                  >
                    Docs
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Version Dropdown for mobile */}
                  {activeTab === 'architecture' && allArchitectures.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-gray-700/50"
                        title="Select Architecture Version"
                      >
                        <span className="font-medium">V{toRomanNumeral(selectedVersionIndex + 1)}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isVersionDropdownOpen && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsVersionDropdownOpen(false)}
                          />

                          {/* Dropdown content */}
                          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden">
                            <div className="py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                              {allArchitectures.map((arch, index) => (
                                <button
                                  key={arch.metadata.id}
                                  onClick={() => handleVersionChange(index)}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${index === selectedVersionIndex
                                    ? 'bg-red-500/20 text-white border-l-2 border-red-500'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Version {toRomanNumeral(index + 1)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(arch.metadata.createdAt).toLocaleDateString()} at {new Date(arch.metadata.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    onClick={() => setIsMobilePanelOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className={`h-full ${activeTab === 'architecture' ? 'block' : 'hidden'}`}>
                  <Architecture
                    architectureData={architectureData || undefined}
                    isLoading={isArchitectureLoading}
                    customPositions={componentPositions}
                    onPositionsChange={handlePositionChange}
                  />
                </div>

                <div className={`h-full ${activeTab === 'stacks' ? 'block' : 'hidden'}`}>
                  <StackOptions
                    optionSets={archOptionsHistory}
                    selectedOptionSetId={selectedArchOptionsId}
                    onSelectOptionSet={handleSelectOptionSet}
                    selectedStackId={selectedStackId}
                    onSelect={setSelectedStackId}
                    isLoading={archOptionsLoading}
                    isGenerating={isGeneratingMainArch}
                    onGenerate={handleStackGenerate}
                    generatedStackIds={generatedStackIds}
                  />
                </div>

                <div className={`h-full ${activeTab === 'context' ? 'block' : 'hidden'}`}>
                  <FileExplorer />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

      {/* How to Dialog */}
      {isHowToOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-blue-500/30 rounded-2xl p-8 w-full max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <HelpCircle className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">How to Use DevilDev</h3>
                </div>
                <button
                  onClick={() => setIsHowToOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Start a Conversation</h4>
                      <p className="text-gray-300">Describe your project idea, features you want to build, or ask technical questions. Be as detailed as possible for better results.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">View Architecture</h4>
                      <p className="text-gray-300">DevilDev will generate a visual architecture diagram showing how your components connect and interact.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Open Docs</h4>
                      <p className="text-gray-300">Use the Docs tab to view the mock PRD context while you continue planning your architecture and implementation.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">4</div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Continue Conversation</h4>
                      <p className="text-gray-300">Ask follow-up questions, request modifications, or dive deeper into specific technical aspects of your project.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-blue-300 mb-2">💡 Pro Tips</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Be specific about your tech stack preferences</li>
                    <li>• Mention any constraints or requirements upfront</li>
                    <li>• Use the fullscreen mode for better architecture viewing</li>
                    <li>• Access your previous chats from the sidebar</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setIsHowToOpen(false)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-600 rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Send Feedback</h3>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience, report bugs, or suggest features..."
                className="w-full bg-black border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none h-32"
                maxLength={1000}
                disabled={isSubmittingFeedback}
              />

              {/* Success/Error Message */}
              {feedbackMessage && (
                <div className={`p-3 rounded-md text-sm ${feedbackMessage.type === 'success'
                  ? 'bg-green-900/50 border border-green-600/50 text-green-300'
                  : 'bg-red-900/50 border border-red-600/50 text-red-300'
                  }`}>
                  {feedbackMessage.text}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsFeedbackOpen(false);
                    setFeedbackMessage(null);
                    setFeedbackText('');
                  }}
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim() || isSubmittingFeedback}
                  className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmittingFeedback && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>{isSubmittingFeedback ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles & Animations */}
      <style jsx global>{`
        @keyframes typing {
          0%, 20% { opacity: 0; }
          25%, 75% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }
        
        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 transparent;
        }
        
        /* Disable text selection during resize */
        ${isResizing ? '*{user-select: none !important;}' : ''}
        
        /* Mobile specific styles */
        @media (max-width: 767px) {
          body {
            overflow-x: hidden;
          }
          
          /* Prevent body scroll when mobile panel is open */
          body.mobile-panel-open {
            overflow: hidden;
          }
        }
      `}</style>

      {/* Character Limit Pricing Dialog */}
      <PricingDialog
        open={showCharacterLimitDialog}
        onOpenChange={setShowCharacterLimitDialog}
        description="You've reached the maximum token limit for this chat. Upgrade to Pro to unlock extended token limits and continue your conversation."
      />

      {/* Low Souls Pricing Dialog */}
      <PricingDialog
        open={showLowSoulsDialog}
        onOpenChange={setShowLowSoulsDialog}
        description="Your souls count is low. Please upgrade or buy more souls to continue."
      />
    </div>
  );
};

export default DevPage;
