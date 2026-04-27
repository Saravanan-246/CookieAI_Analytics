// Debounce (🔥 FIX: preserve this context)
export const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
};

// Throttle (🔥 FIX: better timing)
export const throttle = (func, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

// Deep clone (🔥 FIX: faster modern)
export const deepClone = (obj) => {
  try {
    return structuredClone(obj); // 🔥 modern
  } catch {
    return JSON.parse(JSON.stringify(obj)); // fallback
  }
};

// Truncate (🔥 FIX: correct length)
export const truncate = (str, length, suffix = "...") => {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

// isMobile (🔥 FIX: SSR safe)
export const isMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
};