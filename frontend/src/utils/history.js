const MAX_HISTORY_ITEMS = 6;

export const loadHistory = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

export const saveHistoryItem = (key, item) => {
  const current = loadHistory(key);
  const next = [
    {
      ...item,
      id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: item.timestamp || Date.now(),
    },
    ...current,
  ].slice(0, MAX_HISTORY_ITEMS);

  localStorage.setItem(key, JSON.stringify(next));
  return next;
};

export const clearHistory = (key) => {
  localStorage.removeItem(key);
  return [];
};
