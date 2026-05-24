/** A notification as rendered in the in-app inbox (read state merged in). */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  url: string | null;
  icon: string | null;
  type: string;
  createdAt: string;
  read: boolean;
}
