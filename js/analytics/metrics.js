/**
 * Simple Analytics Tracker for Guess The ELO
 * Sends events to Google Analytics 4 for tracking user behavior
 */

export class SimpleTracker {
  constructor() {
    this.sessionStartTime = Date.now();
    this.gameStartTime = null;
    this.correctAnswers = 0;
    this.totalRounds = 0;
    this.longestStreak = 0;
    this.currentStreak = 0;
    this.debug = false; // Set to true to see events in console
  }

  /**
   * Main tracking method - simplified to only essential dimensions
   */
  track(eventName, data = {}) {
    try {
      // Send to GA4 with only essential dimensions
      if (window.gtag) {
        gtag('event', eventName, data);

        if (this.debug) {
          console.log('📊 GA4 Event:', eventName, data);
        }
      }
    } catch (err) {
      // Silently handle errors - don't break the game for analytics failures
      if (this.debug) {
        console.warn(`Failed to track ${eventName}:`, err);
      }
    }
  }

  // Reset tracking state for new game
  resetGameState() {
    this.gameStartTime = Date.now();
    this.correctAnswers = 0;
    this.totalRounds = 0;
    this.longestStreak = 0;
    this.currentStreak = 0;
  }

  // Track game start with simplified dimensions
  trackGameStart(mode, options = {}) {
    try {
      this.resetGameState();

      this.track('game_start', {
        game_mode: mode,
        time_limit: options.timeLimit || 'none',
        evaluation_enabled: options.evaluation === 'yes'
      });
    } catch (err) {
      if (this.debug) {
        console.warn('Failed in trackGameStart:', err);
      }
    }
  }

  // Update internal state for round completion (no individual round tracking)
  trackRoundComplete(roundData) {
    try {
      this.totalRounds++;

      if (roundData.correct) {
        this.correctAnswers++;
        this.currentStreak++;
        if (this.currentStreak > this.longestStreak) {
          this.longestStreak = this.currentStreak;
        }
      } else {
        this.currentStreak = 0;
      }

      // No event sent for individual rounds - only update internal state
    } catch (err) {
      if (this.debug) {
        console.warn('Failed in trackRoundComplete:', err);
      }
    }
  }

  // Track game completion with aggregated metrics
  trackGameComplete(gameData) {
    try {
      const sessionDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const accuracyRate = this.totalRounds > 0
        ? Math.round((this.correctAnswers / this.totalRounds) * 100)
        : 0;

      this.track('game_complete', {
        game_mode: gameData.mode,
        final_score: gameData.finalScore,
        rounds_played: this.totalRounds,
        accuracy_rate: accuracyRate,
        longest_streak: this.longestStreak,
        session_duration_seconds: sessionDuration,
        game_completed: true
      });
    } catch (err) {
      if (this.debug) {
        console.warn('Failed in trackGameComplete:', err);
      }
    }
  }

  // Track game abandonment
  trackGameAbandon(mode, currentRound) {
    try {
      const sessionDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);

      this.track('game_abandon', {
        game_mode: mode,
        round_abandoned_at: currentRound,
        session_duration_seconds: sessionDuration,
        game_completed: false
      });
    } catch (err) {
      if (this.debug) {
        console.warn('Failed in trackGameAbandon:', err);
      }
    }
  }

  // Simplified daily challenge tracking
  trackDailyChallenge(data) {
    try {
      this.track('daily_complete', {
        daily_challenge_number: data.challengeNumber,
        daily_streak_count: data.streak,
        final_score: data.score,
        game_completed: true
      });
    } catch (err) {
      if (this.debug) {
        console.warn('Failed in trackDailyChallenge:', err);
      }
    }
  }

  // Minimal share tracking - just game mode and score
  trackShare(mode, score) {
    try {
      this.track('share', {
        game_mode: mode,
        final_score: score
      });
    } catch (err) {
      if (this.debug) {
        console.warn('Failed in trackShare:', err);
      }
    }
  }

  enableDebug() {
    this.debug = true;
  }

  disableDebug() {
    this.debug = false;
  }
}

// Create singleton instance
export const tracker = new SimpleTracker();