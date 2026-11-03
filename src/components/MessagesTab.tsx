import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Send,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  Check,
  CheckCheck,
  Sparkles,
  Users,
  MessageSquare,
  ArrowLeft,
  MoreVertical,
  Flag,
  Ban,
  Lock,
  WifiOff,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Message, Conversation, Profile } from '../types/database';

export const MessagesTab: React.FC = () => {
  const {
    currentUser,
    partnerUser,
    couple,
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    partnerConversationId,
    communityUsers,
    blockedUserIds,
    typingUsers,
    sendMessage,
    createDirectConversation,
    acceptMessageRequest,
    declineMessageRequest,
    setTypingStatus,
    confirmAdultStatus,
    blockUser,
    reportUser,
    markConversationAsRead,
    isOnline,
  } = useApp();

  // Mode: 'partner' or 'community'
  const [activeSegment, setActiveSegment] = useState<'partner' | 'community'>('partner');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // New message input
  const [inputBody, setInputBody] = useState('');
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Modals
  const [isAdultModalOpen, setIsAdultModalOpen] = useState(false);
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  const [selectedUserForDM, setSelectedUserForDM] = useState<Profile | null>(null);
  const [initialRequestNote, setInitialRequestNote] = useState('');
  const [dmError, setDmError] = useState<string | null>(null);

  // Menu & Safety
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const currentMessages = selectedConvId ? messages[selectedConvId] || [] : [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  // When switching segments, handle active chat
  useEffect(() => {
    if (activeSegment === 'partner') {
      setSelectedConvId(partnerConversationId);
      markConversationAsRead(partnerConversationId);
    } else {
      setSelectedConvId(null);
    }
  }, [activeSegment, partnerConversationId, markConversationAsRead]);

  // Mark active chat as read when opened
  useEffect(() => {
    if (selectedConvId) {
      markConversationAsRead(selectedConvId);
    }
  }, [selectedConvId, markConversationAsRead]);

  // Community conversations (excluding partner conversation and blocked users)
  const communityConversations = conversations.filter((c) => {
    if (c.type !== 'direct') return false;
    const otherUserId = c.id.replace(`conv_dm_${currentUser.id}_`, '').replace(`conv_dm_`, '').split('_')[0];
    if (blockedUserIds.includes(otherUserId)) return false;
    return true;
  });

  const pendingRequests = communityConversations.filter(
    (c) => c.status === 'pending' && c.requester_id !== currentUser.id
  );

  const activeOrMyPendingDMs = communityConversations.filter(
    (c) => c.status !== 'declined' && !(c.status === 'pending' && c.requester_id !== currentUser.id)
  );

  // Active chat metadata
  const currentConversation = conversations.find((c) => c.id === selectedConvId);
  const isPartnerChat = selectedConvId === partnerConversationId;

  // Resolve other profile for active community chat
  let otherParticipant: Profile | undefined;
  if (!isPartnerChat && currentConversation) {
    if (currentConversation.other_user) {
      otherParticipant = currentConversation.other_user;
    } else {
      const parts = currentConversation.id.replace('conv_dm_', '').split('_');
      const targetId = parts.find((p) => p !== currentUser.id) || parts[0];
      otherParticipant = communityUsers.find((u) => u.id === targetId || targetId.includes(u.id));
    }
  }

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim() || !selectedConvId || sending) return;

    setRateLimitWarning(null);
    setSending(true);

    const res = await sendMessage(selectedConvId, inputBody);
    setSending(false);

    if (res.error) {
      setRateLimitWarning(res.error);
      setTimeout(() => setRateLimitWarning(null), 3500);
    } else {
      setInputBody('');
      setTypingStatus(selectedConvId, false);
      inputRef.current?.focus();
    }
  };

  // Handle Start Direct Message
  const handleInitiateDM = async (targetUser: Profile) => {
    setDmError(null);

    // 18+ check
    if (!currentUser.is_adult_confirmed) {
      setSelectedUserForDM(targetUser);
      setIsAdultModalOpen(true);
      return;
    }

    // Same-gender rule check
    if (targetUser.gender !== currentUser.gender) {
      setDmError(
        `Community direct messages are restricted to members of the same gender (${currentUser.gender} to ${currentUser.gender}) to maintain safety and privacy.`
      );
      return;
    }

    setSelectedUserForDM(targetUser);
    setIsNewDMModalOpen(true);
  };

  const handleConfirmStartDM = async () => {
    if (!selectedUserForDM) return;
    const res = await createDirectConversation(selectedUserForDM.id, initialRequestNote);
    if (res.error) {
      setDmError(res.error);
    } else {
      setIsNewDMModalOpen(false);
      setInitialRequestNote('');
      setSelectedUserForDM(null);
      if (res.conversation) {
        setSelectedConvId(res.conversation.id);
      }
    }
  };

  const handleConfirmAdultGate = async () => {
    await confirmAdultStatus();
    setIsAdultModalOpen(false);
    if (selectedUserForDM) {
      setIsNewDMModalOpen(true);
    }
  };

  // Submit User Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherParticipant) return;
    await reportUser(otherParticipant.id, `${reportReason}: ${reportDetails}`);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setIsReportModalOpen(false);
      setReportDetails('');
    }, 2000);
  };

  // Block Active User
  const handleBlockActiveUser = async () => {
    if (!otherParticipant) return;
    if (confirm(`Block ${otherParticipant.display_name}? You will no longer receive messages from them.`)) {
      await blockUser(otherParticipant.id);
      setIsMenuOpen(false);
      setSelectedConvId(null);
    }
  };

  return (
    <div className="pb-24 max-w-xl mx-auto w-full">
      {/* Header & Segment Switcher */}
      <div className="bg-white dark:bg-[#1E1B18] rounded-3xl p-3 shadow-xs border border-[#E8DFD5] dark:border-[#38312B] mb-3">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div>
            <h1 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA] flex items-center gap-1.5">
              <MessageSquare size={18} className="text-[#C85A32]" />
              Messages
            </h1>
            <p className="text-[11px] text-[#7A6F66] dark:text-[#A89F95]">
              Realtime couple chat & safe same-gender community connections
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF7F2] dark:bg-[#28231F] px-2.5 py-1 rounded-full border border-[#E8DFD5] dark:border-[#38312B]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-[#665D54] dark:text-[#C5BCB3]">
              {isOnline ? 'Realtime' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* Segments: Partner Chat vs Community DMs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF7F2] dark:bg-[#151312] rounded-2xl border border-[#E8DFD5] dark:border-[#2C2723]">
          <button
            onClick={() => setActiveSegment('partner')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
              activeSegment === 'partner'
                ? 'bg-white dark:bg-[#28231F] text-[#C85A32] shadow-xs'
                : 'text-[#7A6F66] dark:text-[#A89F95] hover:text-[#2D2825] dark:hover:text-[#F3EFEA]'
            }`}
          >
            <Heart size={14} className={activeSegment === 'partner' ? 'fill-[#C85A32]' : ''} />
            <span>Partner Chat</span>
          </button>

          <button
            onClick={() => setActiveSegment('community')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] relative ${
              activeSegment === 'community'
                ? 'bg-white dark:bg-[#28231F] text-[#C85A32] shadow-xs'
                : 'text-[#7A6F66] dark:text-[#A89F95] hover:text-[#2D2825] dark:hover:text-[#F3EFEA]'
            }`}
          >
            <Users size={14} />
            <span>Community DMs</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 min-w-[16px] h-4 text-[9px] font-bold bg-[#C85A32] text-white rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* PARTNER CHAT VIEW */}
      {activeSegment === 'partner' && (
        <div className="bg-white dark:bg-[#1E1B18] rounded-3xl shadow-sm border border-[#E8DFD5] dark:border-[#38312B] flex flex-col h-[65vh] overflow-hidden">
          {/* Partner Chat Top Bar */}
          <div className="p-3 border-b border-[#E8DFD5] dark:border-[#2E2824] bg-[#FAF7F2]/60 dark:bg-[#231F1C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={partnerUser.avatar_url}
                  alt={partnerUser.display_name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#C85A32]/20 shadow-xs"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E1B18]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                    {partnerUser.display_name}
                  </h2>
                  <span className="px-1.5 py-0.5 text-[9px] font-medium bg-[#C85A32]/10 text-[#C85A32] rounded-md">
                    Always Connected
                  </span>
                </div>
                <p className="text-[10px] text-[#7A6F66] dark:text-[#A89F95]">
                  {partnerUser.city} • {partnerUser.timezone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-medium text-[#7A6F66] dark:text-[#A89F95] block">
                {couple.name}
              </span>
              <span className="text-[9px] text-[#C85A32] font-semibold">
                Private & Encrypted
              </span>
            </div>
          </div>

          {/* Messages Bubble Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]/30 dark:bg-[#171513]">
            <div className="text-center my-2">
              <span className="px-3 py-1 rounded-full text-[10px] bg-[#EFE9DF] dark:bg-[#2A2420] text-[#7A6F66] dark:text-[#A89F95] font-medium">
                Our Private Space • Partner messages are never shown outside
              </span>
            </div>

            {currentMessages.map((msg) => {
              const isMe = msg.sender_id === currentUser.id;
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs select-text ${
                      isMe
                        ? 'bg-[#C85A32] text-white rounded-tr-xs'
                        : 'bg-white dark:bg-[#28231F] text-[#2D2825] dark:text-[#F3EFEA] rounded-tl-xs border border-[#E8DFD5] dark:border-[#38312B]'
                    }`}
                  >
                    {msg.body}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[9px] text-[#9C8F85]">{timeStr}</span>
                    {isMe && (
                      <span title={msg.is_pending_sync ? 'Offline: queued to sync' : msg.read_at ? 'Read' : 'Delivered'}>
                        {msg.is_pending_sync ? (
                          <Clock size={11} className="text-[#9C8F85]" />
                        ) : msg.read_at ? (
                          <CheckCheck size={12} className="text-[#C85A32]" />
                        ) : (
                          <Check size={11} className="text-[#9C8F85]" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Partner Typing Indicator */}
            {typingUsers[partnerConversationId] && (
              <div className="flex items-center gap-2 text-xs text-[#7A6F66] dark:text-[#A89F95] italic py-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32]" />
                <span>{typingUsers[partnerConversationId]} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Rate limit pill warning */}
          {rateLimitWarning && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900 px-3 py-1.5 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={13} />
                {rateLimitWarning}
              </span>
            </div>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-2.5 bg-white dark:bg-[#1E1B18] border-t border-[#E8DFD5] dark:border-[#2E2824] flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputBody}
              onChange={(e) => {
                setInputBody(e.target.value);
                setTypingStatus(partnerConversationId, e.target.value.length > 0);
              }}
              placeholder={`Message ${partnerUser.display_name}...`}
              className="flex-1 bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3.5 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!inputBody.trim() || sending}
              aria-label="Send message"
              className="w-11 h-11 bg-[#C85A32] disabled:opacity-40 hover:bg-[#B34E29] text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* COMMUNITY DMs VIEW */}
      {activeSegment === 'community' && (
        <div>
          {/* Active Community Conversation View */}
          {selectedConvId && currentConversation ? (
            <div className="bg-white dark:bg-[#1E1B18] rounded-3xl shadow-sm border border-[#E8DFD5] dark:border-[#38312B] flex flex-col h-[65vh] overflow-hidden">
              {/* Chat Top Bar with Safety & More Options */}
              <div className="p-3 border-b border-[#E8DFD5] dark:border-[#2E2824] bg-[#FAF7F2]/60 dark:bg-[#231F1C] flex items-center justify-between relative">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedConvId(null)}
                    aria-label="Back to conversations list"
                    className="p-1.5 -ml-1 text-[#7A6F66] dark:text-[#A89F95] hover:text-[#2D2825] rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <img
                    src={otherParticipant?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={otherParticipant?.display_name || 'User'}
                    className="w-9 h-9 rounded-2xl object-cover ring-1 ring-[#C85A32]/20"
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                        {otherParticipant?.display_name || 'Community Member'}
                      </h2>
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
                        {otherParticipant?.gender || currentUser.gender}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7A6F66] dark:text-[#A89F95]">
                      {otherParticipant?.city} • Same-gender verified
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Conversation options"
                    className="p-2 text-[#7A6F66] dark:text-[#A89F95] hover:text-[#2D2825] rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  >
                    <MoreVertical size={17} />
                  </button>

                  {/* Options Menu: Report & Block */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-12 z-50 w-44 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B] shadow-lg py-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsReportModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#7A6F66] dark:text-[#A89F95] hover:bg-[#FAF7F2] dark:hover:bg-[#322C28] cursor-pointer"
                      >
                        <Flag size={14} className="text-amber-500" />
                        <span>Report Member</span>
                      </button>
                      <button
                        onClick={handleBlockActiveUser}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                      >
                        <Ban size={14} />
                        <span>Block Member</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Request Banner */}
              {currentConversation.status === 'pending' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60">
                  {currentConversation.requester_id === currentUser.id ? (
                    <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                      <Clock size={15} className="shrink-0" />
                      <span>Message request sent. Awaiting approval before further chatting.</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2">
                        {otherParticipant?.display_name} sent you a message request.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => acceptMessageRequest(currentConversation.id)}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs min-h-[38px] cursor-pointer"
                        >
                          Accept Request
                        </button>
                        <button
                          onClick={() => declineMessageRequest(currentConversation.id)}
                          className="flex-1 py-1.5 px-3 bg-white dark:bg-[#28231F] border border-[#D9D0C5] text-rose-600 rounded-xl text-xs font-semibold shadow-xs min-h-[38px] cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]/30 dark:bg-[#171513]">
                <div className="text-center my-1">
                  <span className="px-3 py-1 rounded-full text-[10px] bg-[#EFE9DF] dark:bg-[#2A2420] text-[#7A6F66] dark:text-[#A89F95] font-medium inline-flex items-center gap-1.5">
                    <Shield size={11} className="text-emerald-600" />
                    Same-gender DM • Email addresses are never exposed
                  </span>
                </div>

                {currentMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs select-text ${
                          isMe
                            ? 'bg-[#C85A32] text-white rounded-tr-xs'
                            : 'bg-white dark:bg-[#28231F] text-[#2D2825] dark:text-[#F3EFEA] rounded-tl-xs border border-[#E8DFD5] dark:border-[#38312B]'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[9px] text-[#9C8F85]">{timeStr}</span>
                        {isMe && (
                          <span title={msg.is_pending_sync ? 'Offline: queued to sync' : msg.read_at ? 'Read' : 'Delivered'}>
                            {msg.is_pending_sync ? (
                              <Clock size={11} className="text-[#9C8F85]" />
                            ) : msg.read_at ? (
                              <CheckCheck size={12} className="text-[#C85A32]" />
                            ) : (
                              <Check size={11} className="text-[#9C8F85]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Rate limit warning */}
              {rateLimitWarning && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900 px-3 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                  {rateLimitWarning}
                </div>
              )}

              {/* Send Bar */}
              {currentConversation.status === 'accepted' ? (
                <form onSubmit={handleSend} className="p-2.5 bg-white dark:bg-[#1E1B18] border-t border-[#E8DFD5] dark:border-[#2E2824] flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputBody}
                    onChange={(e) => setInputBody(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#FAF7F2] dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 px-3.5 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={!inputBody.trim() || sending}
                    aria-label="Send message"
                    className="w-11 h-11 bg-[#C85A32] disabled:opacity-40 hover:bg-[#B34E29] text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-[#FAF7F2] dark:bg-[#201C19] border-t border-[#E8DFD5] dark:border-[#2E2824] text-center text-xs text-[#7A6F66] dark:text-[#A89F95]">
                  Messaging unlocks once the recipient accepts this request.
                </div>
              )}
            </div>
          ) : (
            /* Community DMs List View */
            <div className="space-y-4">
              {/* Safety notice & Rules card */}
              <div className="p-3.5 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Safe Same-Gender Community DMs
                    </h2>
                    <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                      To safeguard couple spaces and prevent unwanted advances, direct messaging across couples is allowed <strong className="font-semibold underline">only between people of the same gender</strong> ({currentUser.gender} ⇄ {currentUser.gender}), and requires request approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                <div className="bg-white dark:bg-[#1E1B18] rounded-3xl p-4 shadow-xs border border-[#E8DFD5] dark:border-[#38312B]">
                  <h2 className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#C85A32]" />
                    Message Requests ({pendingRequests.length})
                  </h2>

                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => {
                      const otherUser = req.other_user || communityUsers.find((u) => req.id.includes(u.id));
                      const reqMessages = messages[req.id] || [];
                      const lastMsg = reqMessages[reqMessages.length - 1];

                      return (
                        <div
                          key={req.id}
                          className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B] flex flex-col gap-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={otherUser?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
                              alt={otherUser?.display_name || 'Requester'}
                              className="w-10 h-10 rounded-2xl object-cover ring-1 ring-[#C85A32]/20 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA] truncate">
                                  {otherUser?.display_name || 'Community Member'}
                                </h3>
                                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
                                  {otherUser?.gender || currentUser.gender}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#7A6F66] dark:text-[#A89F95] truncate">
                                {otherUser?.city}
                              </p>
                            </div>
                          </div>

                          {lastMsg && (
                            <p className="text-xs text-[#4A423C] dark:text-[#C5BCB3] bg-white dark:bg-[#1E1B18] p-2 rounded-xl italic border border-[#E8DFD5] dark:border-[#38312B]">
                              "{lastMsg.body}"
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              onClick={() => acceptMessageRequest(req.id)}
                              className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs min-h-[40px] cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => declineMessageRequest(req.id)}
                              className="py-2 bg-white dark:bg-[#1E1B18] border border-[#D9D0C5] dark:border-[#403833] text-rose-600 rounded-xl text-xs font-semibold shadow-xs min-h-[40px] cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conversations List */}
              <div className="bg-white dark:bg-[#1E1B18] rounded-3xl p-4 shadow-xs border border-[#E8DFD5] dark:border-[#38312B]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                    Direct Conversations
                  </h2>
                  <button
                    onClick={() => {
                      if (!currentUser.is_adult_confirmed) {
                        setIsAdultModalOpen(true);
                      } else {
                        setIsNewDMModalOpen(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#C85A32] hover:bg-[#B34E29] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[38px]"
                  >
                    <UserPlus size={13} />
                    <span>New DM</span>
                  </button>
                </div>

                {activeOrMyPendingDMs.length === 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-[#D9D0C5] dark:border-[#403833] rounded-2xl">
                    <Users size={28} className="mx-auto text-[#9C8F85] mb-2" />
                    <p className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                      No community direct messages yet
                    </p>
                    <p className="text-[11px] text-[#7A6F66] dark:text-[#A89F95] mt-1 max-w-xs mx-auto">
                      Connect with other {currentUser.gender.toLowerCase()} partners in long-distance relationships to share advice and encouragement.
                    </p>
                    <button
                      onClick={() => {
                        if (!currentUser.is_adult_confirmed) {
                          setIsAdultModalOpen(true);
                        } else {
                          setIsNewDMModalOpen(true);
                        }
                      }}
                      className="mt-3 px-4 py-2 bg-[#C85A32] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Start a Same-Gender DM
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeOrMyPendingDMs.map((conv) => {
                      const otherUser = conv.other_user || communityUsers.find((u) => conv.id.includes(u.id));
                      const convMessages = messages[conv.id] || [];
                      const lastMsg = convMessages[convMessages.length - 1];
                      const unread = convMessages.filter(
                        (m) => m.sender_id !== currentUser.id && !m.read_at
                      ).length;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className="w-full text-left p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#28231F] hover:bg-[#F2ECE3] dark:hover:bg-[#322C28] transition-all flex items-center gap-3 cursor-pointer border border-transparent hover:border-[#C85A32]/30 min-h-[54px]"
                        >
                          <img
                            src={otherUser?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
                            alt={otherUser?.display_name || 'Member'}
                            className="w-10 h-10 rounded-2xl object-cover ring-1 ring-[#C85A32]/20 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA] truncate">
                                {otherUser?.display_name || 'Community Member'}
                              </span>
                              <span className="text-[10px] text-[#9C8F85] shrink-0">
                                {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <p className="text-[11px] text-[#7A6F66] dark:text-[#A89F95] truncate">
                                {conv.status === 'pending'
                                  ? 'Request pending approval...'
                                  : (lastMsg?.body || 'No messages yet')}
                              </p>
                              {unread > 0 && (
                                <span className="px-1.5 py-0.2 min-w-[16px] h-4 text-[9px] font-bold bg-[#C85A32] text-white rounded-full flex items-center justify-center shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 18+ AGE CONFIRMATION GATE MODAL */}
      {isAdultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
              <ShieldAlert size={26} />
            </div>
            <h3 className="text-base font-bold text-[#2D2825] dark:text-[#F3EFEA]">
              18+ Community Safety Confirmation
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-2 mb-5 leading-relaxed">
              To keep our community safe, respectful, and appropriate, community direct messaging is exclusively available to adults aged 18 and older.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleConfirmAdultGate}
                className="w-full bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-xs cursor-pointer min-h-[44px]"
              >
                I confirm I am 18 or older
              </button>
              <button
                onClick={() => setIsAdultModalOpen(false)}
                className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] text-[#7A6F66] dark:text-[#D5CCC1] py-2.5 rounded-2xl text-xs font-medium cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SAME-GENDER DM MODAL */}
      {isNewDMModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B]">
            <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1">
              Start Community Direct Message
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Select a member of your same gender ({currentUser.gender}) to send a message request.
            </p>

            {dmError && (
              <div className="mb-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{dmError}</span>
              </div>
            )}

            {!selectedUserForDM ? (
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {communityUsers
                  .filter((u) => u.id !== currentUser.id && !blockedUserIds.includes(u.id))
                  .map((user) => {
                    const isSameGender = user.gender === currentUser.gender;
                    return (
                      <div
                        key={user.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isSameGender
                            ? 'bg-white dark:bg-[#28231F] border-[#E8DFD5] dark:border-[#38312B]'
                            : 'bg-gray-50/50 dark:bg-[#181615] border-gray-200 dark:border-gray-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA]">
                                {user.display_name}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 text-[9px] font-semibold rounded-md ${
                                  isSameGender
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                {user.gender}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#7A6F66] dark:text-[#A89F95]">
                              {user.city}
                            </span>
                          </div>
                        </div>

                        {isSameGender ? (
                          <button
                            onClick={() => setSelectedUserForDM(user)}
                            className="px-3 py-1.5 bg-[#C85A32] text-white rounded-xl text-xs font-semibold hover:bg-[#B34E29] cursor-pointer min-h-[38px]"
                          >
                            Select
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#9C8F85] italic font-medium">
                            Different gender
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="mb-4">
                <div className="p-3 rounded-2xl bg-white dark:bg-[#28231F] border border-[#E8DFD5] dark:border-[#38312B] flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedUserForDM.avatar_url}
                      alt={selectedUserForDM.display_name}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#2D2825] dark:text-[#F3EFEA] block">
                        Sending request to {selectedUserForDM.display_name}
                      </span>
                      <span className="text-[10px] text-[#7A6F66] dark:text-[#A89F95]">
                        {selectedUserForDM.gender} • {selectedUserForDM.city}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUserForDM(null)}
                    className="text-xs text-[#C85A32] font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                  Introduction Note (Message Request)
                </label>
                <textarea
                  rows={3}
                  value={initialRequestNote}
                  onChange={(e) => setInitialRequestNote(e.target.value)}
                  placeholder="Introduce yourself and explain what you’d like to discuss..."
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsNewDMModalOpen(false);
                  setSelectedUserForDM(null);
                  setDmError(null);
                }}
                className="py-2.5 px-4 bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] text-[#7A6F66] dark:text-[#D5CCC1] rounded-2xl text-xs font-medium cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              {selectedUserForDM && (
                <button
                  onClick={handleConfirmStartDM}
                  className="py-2.5 px-5 bg-[#C85A32] hover:bg-[#B34E29] text-white rounded-2xl text-xs font-semibold shadow-xs cursor-pointer min-h-[44px]"
                >
                  Send Message Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT MEMBER MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B]">
            <h3 className="text-sm font-bold text-[#2D2825] dark:text-[#F3EFEA] mb-1 flex items-center gap-1.5">
              <Flag size={15} className="text-amber-500" />
              Report Member
            </h3>
            <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mb-4">
              Help us keep the community safe. All reports are confidential.
            </p>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs text-center font-semibold mb-3">
                Report submitted successfully. Thank you for looking out for our community.
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none min-h-[44px]"
                  >
                    <option value="Harassment">Harassment or bullying</option>
                    <option value="Inappropriate Content">Inappropriate content or messages</option>
                    <option value="Spam">Spam or commercial promotion</option>
                    <option value="Underage Concern">Suspicion of underage member</option>
                    <option value="Other">Other safety concern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                    Details (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context..."
                    className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2 px-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="py-2.5 px-4 bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] text-[#7A6F66] dark:text-[#D5CCC1] rounded-2xl text-xs font-medium cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-semibold shadow-xs cursor-pointer min-h-[44px]"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
