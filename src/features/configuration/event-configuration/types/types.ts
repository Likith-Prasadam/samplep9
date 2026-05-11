export interface Event {
  id?: string | number;
  event_name: string;
  user_id?: number;
  cohort_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserData {
  user_id: number;
  cohort_id: number;
}

export interface ConfirmationDialogState {
  open: boolean;
  type: 'delete' | 'update';
  title: string;
  message: string;
  onConfirm: () => void;
  eventIndex?: number;
  eventValue?: string;
}

export interface EventItemProps {
  item: Event;
  index: number;
  isEditing: boolean;
  loading: boolean;
  onEdit: (index: number, value: string) => void;
  onStartEdit: (index: number | null) => void;
  onDelete: (index: number) => void;
  onCancelEdit: () => void;
}

export interface EventListProps {
  events: Event[];
  editingIndex: number | null;
  loading: boolean;
  onEdit: (index: number, value: string) => void;
  onStartEdit: (index: number | null) => void;
  onDelete: (index: number) => void;
}

export interface EventCreatorProps {
  value: string;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAdd: () => void;
  disabled: boolean;
}

export interface ConfirmationDialogProps {
  open: boolean;
  type: 'delete' | 'update';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}
