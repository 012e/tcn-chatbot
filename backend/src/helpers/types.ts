export type CursorPage<T> = {
  items: T[];
  nextCursor?: string | null;
};

export type CursorQuery = {
  cursor?: string | null;
  limit?: number | string | null;
};
