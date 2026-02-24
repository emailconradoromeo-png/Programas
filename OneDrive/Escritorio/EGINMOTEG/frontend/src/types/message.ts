export interface Conversation {
  id: string;
  listing: { id: string; property: { title: string } } | null;
  participants: { id: string; username: string; first_name: string; last_name: string }[];
  last_message: Message | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  sender: { id: string; username: string; first_name: string; last_name: string };
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  type: 'mensaje' | 'oferta' | 'verificacion' | 'pago' | 'sistema';
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}
