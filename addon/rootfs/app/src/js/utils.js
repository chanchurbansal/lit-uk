/**
 * Utility Functions
 * Shared utilities for the Britizen Quiz Application
 */

class Utils {
    /**
     * Escape HTML to prevent XSS (optimized with caching)
     */
    static escapeHtml(text) {
        // Use a static cache for frequently escaped strings
        if (!Utils.escapeCache) {
            Utils.escapeCache = new Map();
        }

        if (Utils.escapeCache.has(text)) {
            return Utils.escapeCache.get(text);
        }

        const div = document.createElement('div');
        div.textContent = text;
        const escaped = div.innerHTML;

        // Cache with size limit
        if (Utils.escapeCache.size < 100) {
            Utils.escapeCache.set(text, escaped);
        }

        return escaped;
    }

    /**
     * Debounce function to limit function calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function to limit function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Format relative time for display
     */
    static formatRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
}

// Export for use in other modules
window.Utils = Utils;
