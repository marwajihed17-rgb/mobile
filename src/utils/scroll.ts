/**
 * Smoothly scrolls the window to the top of the page
 * Used after data updates to ensure users see the latest changes
 */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Instantly scrolls to the top without animation
 * Useful when immediate positioning is needed
 */
export function scrollToTopInstant() {
  window.scrollTo(0, 0);
}
