/**
 * Authentication Module for Supabase
 *
 * Handles login, logout, session management, and route protection.
 */

const Auth = {
  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: object|null, error: object|null}>}
   */
  async signIn(email, password) {
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        return { user: null, error: error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<{error: object|null}>}
   */
  async signOut() {
    try {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        return { error: error };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: 'Failed to sign out.' } };
    }
  },

  /**
   * Get the current session
   * @returns {Promise<{session: object|null, error: object|null}>}
   */
  async getSession() {
    try {
      const { data, error } = await window.supabaseClient.auth.getSession();
      if (error) {
        return { session: null, error: error };
      }
      return { session: data.session, error: null };
    } catch (err) {
      return { session: null, error: { message: 'Failed to get session.' } };
    }
  },

  /**
   * Get the current user
   * @returns {Promise<{user: object|null, error: object|null}>}
   */
  async getUser() {
    try {
      const { data, error } = await window.supabaseClient.auth.getUser();
      if (error) {
        return { user: null, error: error };
      }
      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: { message: 'Failed to get user.' } };
    }
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const { session } = await this.getSession();
    return session !== null;
  },

  /**
   * Protect a route - redirects to login if not authenticated
   * @param {string} redirectUrl - URL to redirect to if not authenticated (default: login.html)
   */
  async requireAuth(redirectUrl = 'login.html') {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  },

  /**
   * Redirect authenticated users away from login page
   * @param {string} redirectUrl - URL to redirect to if authenticated (default: modules.html)
   */
  async redirectIfAuthenticated(redirectUrl = 'modules.html') {
    const isAuth = await this.isAuthenticated();
    if (isAuth) {
      window.location.href = redirectUrl;
      return true;
    }
    return false;
  },

  /**
   * Get user display info (name, email, initials)
   * @returns {Promise<{name: string, email: string, initials: string, role: string}>}
   */
  async getUserDisplayInfo() {
    const { user } = await this.getUser();
    if (!user) {
      return { name: 'Guest', email: '', initials: 'G', role: 'User' };
    }

    // Try to get name from user metadata or fall back to email
    const metadata = user.user_metadata || {};
    const name = metadata.full_name || metadata.name || user.email.split('@')[0];
    const email = user.email;

    // Generate initials from name
    const nameParts = name.split(' ');
    const initials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();

    // Get role from metadata (default to 'User')
    const role = metadata.role || 'User';

    return { name, email, initials, role };
  },

  /**
   * Handle logout with redirect
   * @param {string} redirectUrl - URL to redirect after logout
   */
  async handleLogout(redirectUrl = 'login.html') {
    await this.signOut();
    window.location.href = redirectUrl;
  }
};

// Make Auth available globally
window.Auth = Auth;
