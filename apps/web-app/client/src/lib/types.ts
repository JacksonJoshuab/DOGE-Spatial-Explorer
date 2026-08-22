// DOGE Spatial Explorer — Core TypeScript Types
// Design: Spatial Intelligence Command Center

export type ISODate = string;

export type ItemStatus = "draft" | "active" | "archived";

export type User = {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
};

export type Session = {
  accessToken?: string; // omit if cookie-based
  expiresAt: ISODate;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export type PagedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type Item = {
  id: string;
  name: string;
  status: ItemStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  ownerId: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  permission?: string;
};

export type AuthState = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
