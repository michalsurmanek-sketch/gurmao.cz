// Uvítací karta byla z GURMAO odstraněna.
// Soubor zůstává jako bezpečný no-op kvůli existujícím odkazům ve stránkách.

class OnboardingManager {
  constructor() {
    this.storageKey = 'gurmao_onboarding_completed';
  }

  hasCompletedOnboarding() {
    return true;
  }

  markAsCompleted() {
    try {
      localStorage.setItem(this.storageKey, 'true');
    } catch (error) {
      console.warn('Nepodařilo se uložit stav onboardingu:', error);
    }
  }

  show() {
    // Záměrně prázdné – uvítací karta se již nezobrazuje.
  }

  hideModal() {
    document.getElementById('onboardingModal')?.remove();
    document.body.style.overflow = '';
  }

  reset() {
    this.markAsCompleted();
    this.hideModal();
  }
}

window.onboarding = new OnboardingManager();
window.onboarding.markAsCompleted();
window.onboarding.hideModal();
