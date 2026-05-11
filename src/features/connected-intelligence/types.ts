export interface ConnectedIntelligenceClip {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  imgClass?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoUrlExpiry?: string;
  sourceHash?: string;
  sourceType?: 'batch' | 'live';
}

export interface ConnectedIntelligenceCheckboxOption {
  value: string;
  label: string;
  count?: string;
}

export interface ConnectedIntelligenceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCallId?: string | null;
  toolName?: string | null;
}

export interface ConnectedIntelligenceConversationThread {
  id: string;
  title: string;
  updatedAt?: string;
  messageCount?: number;
  modality?: string;
}

export interface ConnectedIntelligenceFilters {
  zones: string[];
  city: string;
  cities: string[];
  zipcodes: string[];
  subzone: string;
  cameraNames: string;
  cameraHashes: string;
  cameraTypes: string[];
  resolutions: string[];
  ipAddress: string;
  cameraTags: string[];
  analysisTimeframe: string;
}

export interface ConnectedIntelligenceFilterOptions {
  zones: ConnectedIntelligenceCheckboxOption[];
  cities: ConnectedIntelligenceCheckboxOption[];
  zipcodes: ConnectedIntelligenceCheckboxOption[];
  cameraTypes: ConnectedIntelligenceCheckboxOption[];
  resolutions: ConnectedIntelligenceCheckboxOption[];
  cameraTags: ConnectedIntelligenceCheckboxOption[];
}

export type ConnectedIntelligenceFilterSection =
  | {
      kind: 'chips';
      title: string;
      chips: string[];
      actionLabel: string;
    }
  | {
      kind: 'input';
      title: string;
      placeholder: string;
      helperText: string;
    }
  | {
      kind: 'checkboxes';
      title: string;
      options: ConnectedIntelligenceCheckboxOption[];
    };
