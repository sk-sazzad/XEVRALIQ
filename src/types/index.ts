export type Platform = "FACEBOOK" | "INSTAGRAM";
export type ConvoStatus = "OPEN" | "CLOSED";
export type Direction = "INCOMING" | "OUTGOING";
export type UserRole = "ADMIN" | "AGENT";

export interface ConnectedAccountSummary {
  id: string;
  platform: Platform;
  pageId: string;
  pageName: string;
  profilePic: string | null;
  isActive: boolean;
}

export interface ConversationSummary {
  id: string;
  customerName: string | null;
  customerPic: string | null;
  customerId: string;
  status: ConvoStatus;
  lastMessageAt: Date | null;
  account: ConnectedAccountSummary;
  lastMessage?: MessageSummary;
}

export interface MessageSummary {
  id: string;
  text: string | null;
  direction: Direction;
  sentAt: Date;
}
