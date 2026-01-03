// Onboarding Modal for GURMAO.cz
// © 2025 GURMAO.cz

class OnboardingManager {
  constructor() {
    this.storageKey = 'gurmao_onboarding_completed';
    this.modal = null;
  }

  hasCompletedOnboarding() {
    return localStorage.getItem(this.storageKey) === 'true';
  }

  markAsCompleted() {
    localStorage.setItem(this.storageKey, 'true');
  }

  show() {
    if (this.hasCompletedOnboarding()) return;

    this.createModal();
    this.showModal();
  }

  createModal() {
    const modalHTML = `
      <div id="onboardingModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" style="background: rgba(11, 11, 13, 0.95); backdrop-filter: blur(8px);">
        <div class="bg-gurmaoblack border border-white/20 rounded-3xl max-w-2xl w-full shadow-2xl animate-fadeIn">
          <!-- Header -->
          <div class="p-8 pb-6 text-center border-b border-white/10">
            <div class="text-6xl mb-4">👋</div>
            <h2 class="text-3xl font-bold mb-2">Vítej v <span class="text-gurmaogold">GURMAO</span></h2>
            <p class="text-white/60">Kurátorovaný svět gastronomie. Nejez. Prožij.</p>
          </div>

          <!-- Steps -->
          <div class="p-8 space-y-6">
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gurmaogold/20 flex items-center justify-center text-2xl">
                1️⃣
              </div>
              <div>
                <h3 class="text-xl font-semibold mb-1">Prohlížej feed podle nálady</h3>
                <p class="text-white/60 text-sm">Filtruj restaurace podle vibes: 🍷 LUXE, 🔥 DRAMA, 🌮 CHAOS...</p>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gurmaogold/20 flex items-center justify-center text-2xl">
                2️⃣
              </div>
              <div>
                <h3 class="text-xl font-semibold mb-1">Ukládej do sbírek</h3>
                <p class="text-white/60 text-sm">Klikni na 🤍 a restaurace se ti uloží. Tvoje chuťová paměť.</p>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gurmaogold/20 flex items-center justify-center text-2xl">
                3️⃣
              </div>
              <div>
                <h3 class="text-xl font-semibold mb-1">Přihlásit se (volitelně)</h3>
                <p class="text-white/60 text-sm">Synchronizuj sbírky napříč zařízeními a získej AI doporučení.</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-8 pt-6 border-t border-white/10 flex gap-3">
            <button 
              id="skipOnboarding" 
              class="flex-1 px-6 py-3 rounded-full border border-white/20 hover:border-white/40 transition"
            >
              Přeskočit
            </button>
            <button 
              id="startOnboarding" 
              class="flex-1 px-6 py-3 rounded-full bg-gurmaogold text-black font-semibold hover:scale-105 transition shadow-glow"
            >
              Začít prozkoumat 🚀
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('onboardingModal');

    // Event listeners
    document.getElementById('skipOnboarding')?.addEventListener('click', () => {
      this.markAsCompleted();
      this.hideModal();
    });

    document.getElementById('startOnboarding')?.addEventListener('click', () => {
      this.markAsCompleted();
      this.hideModal();
      window.location.href = 'feed.html';
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal) {
        this.markAsCompleted();
        this.hideModal();
      }
    });
  }

  showModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  hideModal() {
    if (this.modal) {
      this.modal.style.opacity = '0';
      setTimeout(() => {
        this.modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  }

  // Reset onboarding (for testing)
  reset() {
    localStorage.removeItem(this.storageKey);
  }
}

// Global instance
window.onboarding = new OnboardingManager();

// Auto-show on homepage
if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
  // Show after short delay for better UX
  setTimeout(() => {
    window.onboarding.show();
  }, 500);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  #onboardingModal {
    transition: opacity 0.3s ease-out;
  }
`;
document.head.appendChild(style);
