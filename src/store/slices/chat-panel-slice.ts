import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

interface ChatPanelState {
  activeChatId: string | null;
  draft: string;
  isNewConversation: boolean;
}

interface ChatPanelsState {
  panels: Record<string, ChatPanelState>;
}

const CHAT_PANELS_STORAGE_KEY = 'spectra-chat-panels-v1';

const initialPanelState: ChatPanelState = {
  activeChatId: null,
  draft: '',
  isNewConversation: false,
};

const persistPanelsState = (state: ChatPanelsState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAT_PANELS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors to keep chat functional.
  }
};

const loadPanelsState = (): ChatPanelsState => {
  if (typeof window === 'undefined') {
    return { panels: {} };
  }

  try {
    const raw = window.localStorage.getItem(CHAT_PANELS_STORAGE_KEY);
    if (!raw) return { panels: {} };

    const parsed = JSON.parse(raw) as Partial<ChatPanelsState>;
    if (!parsed || typeof parsed !== 'object' || !parsed.panels) {
      return { panels: {} };
    }

    return {
      panels: Object.fromEntries(
        Object.entries(parsed.panels).map(([panelKey, panelState]) => [
          panelKey,
          {
            ...initialPanelState,
            ...panelState,
          },
        ])
      ),
    };
  } catch {
    return { panels: {} };
  }
};

const initialState: ChatPanelsState = loadPanelsState();

const chatPanelSlice = createSlice({
  name: 'chatPanels',
  initialState,
  reducers: {
    setChatPanelActiveChat: (
      state,
      action: PayloadAction<{ panelKey: string; activeChatId: string | null }>
    ) => {
      const current =
        state.panels[action.payload.panelKey] ||
        (state.panels[action.payload.panelKey] = { ...initialPanelState });
      current.activeChatId = action.payload.activeChatId;
      current.isNewConversation = action.payload.activeChatId === null;
      persistPanelsState(state);
    },
    setChatPanelNewConversation: (
      state,
      action: PayloadAction<{ panelKey: string; isNewConversation: boolean }>
    ) => {
      const current =
        state.panels[action.payload.panelKey] ||
        (state.panels[action.payload.panelKey] = { ...initialPanelState });
      current.isNewConversation = action.payload.isNewConversation;
      persistPanelsState(state);
    },
    setChatPanelDraft: (
      state,
      action: PayloadAction<{ panelKey: string; draft: string }>
    ) => {
      const current =
        state.panels[action.payload.panelKey] ||
        (state.panels[action.payload.panelKey] = { ...initialPanelState });
      current.draft = action.payload.draft;
      persistPanelsState(state);
    },
    resetChatPanel: (state, action: PayloadAction<{ panelKey: string }>) => {
      delete state.panels[action.payload.panelKey];
      persistPanelsState(state);
    },
  },
});

export const {
  setChatPanelActiveChat,
  setChatPanelDraft,
  resetChatPanel,
  setChatPanelNewConversation,
} = chatPanelSlice.actions;

export const selectChatPanelState = (state: RootState, panelKey: string) =>
  state.chatPanels.panels[panelKey] || { ...initialPanelState };

export default chatPanelSlice.reducer;
