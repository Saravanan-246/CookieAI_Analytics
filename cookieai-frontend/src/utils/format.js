// Formatting utilities for dates, numbers, and data display

// Date formatting utilities
export const formatDate = (date, format = 'default') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    default: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { month: 'short', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    },
    iso: { year: 'numeric', month: '2-digit', day: '2-digit' },
  };

  return d.toLocaleDateString('en-US', options[format] || options.default);
};

// Relative time formatting
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
};

// Duration formatting
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
};

// Number formatting utilities
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Compact number formatting (1K, 1M, 1B)
export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return '';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return formatNumber(num);
};

// Currency formatting
export const formatCurrency = (amount, currency = 'USD', decimals = 2) => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

// Percentage formatting
export const formatPercentage = (value, decimals = 1, includeSymbol = true) => {
  if (value === null || value === undefined) return '';
  
  const formatted = Number(value).toFixed(decimals);
  return includeSymbol ? `${formatted}%` : formatted;
};

// Growth rate formatting
export const formatGrowthRate = (current, previous, decimals = 1) => {
  if (previous === 0 || previous === null || previous === undefined) return 'N/A';
  if (current === null || current === undefined) return 'N/A';
  
  const growth = ((current - previous) / previous) * 100;
  const formatted = formatPercentage(growth, decimals);
  
  return growth >= 0 ? `+${formatted}` : formatted;
};

// Data size formatting
export const formatDataSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

// Rate formatting (per second, per minute, etc.)
export const formatRate = (value, period = 'second', decimals = 1) => {
  if (value === null || value === undefined) return '';
  
  const periods = {
    second: '/s',
    minute: '/min',
    hour: '/hr',
    day: '/day',
    month: '/mo',
    year: '/yr'
  };
  
  return `${formatNumber(value, decimals)}${periods[period] || '/s'}`;
};

// Ratio formatting
export const formatRatio = (numerator, denominator, decimals = 2) => {
  if (denominator === 0 || denominator === null || denominator === undefined) return 'N/A';
  if (numerator === null || numerator === undefined) return 'N/A';
  
  const ratio = numerator / denominator;
  return formatNumber(ratio, decimals);
};

// Phone number formatting
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if format is unrecognized
};

// Credit card formatting
export const formatCreditCard = (cardNumber) => {
  if (!cardNumber) return '';
  
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/\d{4}/g);
  
  if (groups) {
    return groups.join(' ');
  }
  
  return cleaned;
};

// Social security number formatting
export const formatSSN = (ssn) => {
  if (!ssn) return '';
  
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  
  return ssn;
};

// Time formatting
export const formatTime = (time, format = '12h') => {
  if (!time) return '';
  
  const date = new Date(time);
  if (isNaN(date.getTime())) return '';
  
  if (format === '24h') {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Timezone formatting
export const formatTimezone = (timezone = 'UTC') => {
  const date = new Date();
  const options = {
    timeZone: timezone,
    timeZoneName: 'short'
  };
  
  return date.toLocaleTimeString('en-US', options).split(' ').pop();
};

// Address formatting
export const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return '';
  
  const parts = [];
  
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zip) parts.push(address.zip);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};

// Name formatting
export const formatName = (firstName, lastName, format = 'full') => {
  if (!firstName && !lastName) return '';
  
  switch (format) {
    case 'first':
      return firstName || '';
    case 'last':
      return lastName || '';
    case 'initials':
      return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    case 'last_first':
      return `${lastName}, ${firstName}`;
    default:
      return `${firstName} ${lastName}`.trim();
  }
};

// List formatting
export const formatList = (items, conjunction = 'and') => {
  if (!Array.isArray(items) || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
};

// Key-value pair formatting
export const formatKeyValue = (obj, separator = ': ', pairSeparator = ', ') => {
  if (!obj || typeof obj !== 'object') return '';
  
  return Object.entries(obj)
    .map(([key, value]) => `${key}${separator}${value}`)
    .join(pairSeparator);
};

// Truncate with ellipsis
export const formatTruncate = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// Mask sensitive data
export const formatMask = (data, visibleChars = 4, maskChar = '*') => {
  if (!data) return '';
  
  const str = String(data);
  if (str.length <= visibleChars) return str;
  
  const visible = str.slice(0, visibleChars);
  const masked = maskChar.repeat(str.length - visibleChars);
  
  return visible + masked;
};

// URL formatting
export const formatUrl = (url, maxLength = 50) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const display = urlObj.hostname + urlObj.pathname;
    return display.length > maxLength ? 
      display.substring(0, maxLength - 3) + '...' : 
      display;
  } catch {
    return url.length > maxLength ? 
      url.substring(0, maxLength - 3) + '...' : 
      url;
  }
};
