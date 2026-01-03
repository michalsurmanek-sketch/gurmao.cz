// Social Sharing for GURMAO.cz
// © 2025 GURMAO.cz

class SocialShareManager {
  constructor() {
    this.baseUrl = 'https://gurmao.cz';
  }

  // Check if Web Share API is available
  canUseNativeShare() {
    return navigator.share !== undefined;
  }

  // Share using native Web Share API (mobile devices)
  async nativeShare(data) {
    if (!this.canUseNativeShare()) {
      throw new Error('Native sharing not supported');
    }

    try {
      await navigator.share({
        title: data.title || 'GURMAO',
        text: data.text || 'Podívej se na tuto restauraci!',
        url: data.url || window.location.href
      });
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled - not an error
        return false;
      }
      throw error;
    }
  }

  // Share restaurant
  async shareRestaurant(restaurant) {
    const shareData = {
      title: `${restaurant.name} – GURMAO`,
      text: `${restaurant.vibe} ${restaurant.name} v ${restaurant.city}. ${restaurant.tag}. Nejez. Prožij.`,
      url: `${this.baseUrl}/${restaurant.href || 'feed.html'}`
    };

    // Try native share first (mobile)
    if (this.canUseNativeShare()) {
      try {
        const shared = await this.nativeShare(shareData);
        if (shared && window.toastSuccess) {
          window.toastSuccess('✅ Sdíleno!');
        }
        return;
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }

    // Fallback: Show share modal with options
    this.showShareModal(shareData, restaurant);
  }

  // Show share modal with social media options
  showShareModal(shareData, restaurant) {
    const existingModal = document.getElementById('shareModal');
    if (existingModal) existingModal.remove();

    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedText = encodeURIComponent(shareData.text);
    const encodedTitle = encodeURIComponent(shareData.title);

    const modalHTML = `
      <div id="shareModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn" style="background: rgba(11, 11, 13, 0.95); backdrop-filter: blur(8px);">
        <div class="bg-gurmaoblack border border-white/20 rounded-3xl max-w-md w-full shadow-2xl">
          <!-- Header -->
          <div class="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold">Sdílet restauraci</h3>
              <p class="text-white/60 text-sm mt-1">${restaurant.name}</p>
            </div>
            <button id="closeShareModal" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition">
              ✕
            </button>
          </div>

          <!-- Share Options -->
          <div class="p-6 space-y-3">
            <!-- WhatsApp -->
            <a 
              href="https://wa.me/?text=${encodedText}%20${encodedUrl}"
              target="_blank"
              class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-[#25D366]/20 hover:border-[#25D366] border border-white/10 transition group"
            >
              <div class="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                💬
              </div>
              <div class="flex-1">
                <div class="font-semibold">WhatsApp</div>
                <div class="text-white/60 text-sm">Sdílet s přáteli</div>
              </div>
              <div class="text-white/40">→</div>
            </a>

            <!-- Facebook -->
            <a 
              href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"
              target="_blank"
              class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-[#1877F2]/20 hover:border-[#1877F2] border border-white/10 transition group"
            >
              <div class="w-12 h-12 rounded-full bg-[#1877F2]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                📘
              </div>
              <div class="flex-1">
                <div class="font-semibold">Facebook</div>
                <div class="text-white/60 text-sm">Sdílet na Facebooku</div>
              </div>
              <div class="text-white/40">→</div>
            </a>

            <!-- Twitter/X -->
            <a 
              href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}"
              target="_blank"
              class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/20 hover:border-white border border-white/10 transition group"
            >
              <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                🐦
              </div>
              <div class="flex-1">
                <div class="font-semibold">Twitter / X</div>
                <div class="text-white/60 text-sm">Tweet o restauraci</div>
              </div>
              <div class="text-white/40">→</div>
            </a>

            <!-- Copy Link -->
            <button 
              id="copyLinkBtn"
              data-url="${shareData.url}"
              class="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-gurmaogold/20 hover:border-gurmaogold border border-white/10 transition group"
            >
              <div class="w-12 h-12 rounded-full bg-gurmaogold/20 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                🔗
              </div>
              <div class="flex-1 text-left">
                <div class="font-semibold">Zkopírovat odkaz</div>
                <div class="text-white/60 text-sm">Sdílet odkaz manuálně</div>
              </div>
              <div class="text-white/40">→</div>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    // Event listeners
    const modal = document.getElementById('shareModal');
    
    document.getElementById('closeShareModal')?.addEventListener('click', () => {
      this.closeShareModal();
    });

    document.getElementById('copyLinkBtn')?.addEventListener('click', async (e) => {
      const url = e.currentTarget.dataset.url;
      try {
        await navigator.clipboard.writeText(url);
        if (window.toastSuccess) {
          window.toastSuccess('✅ Odkaz zkopírován!');
        }
        this.closeShareModal();
      } catch (error) {
        if (window.toastError) {
          window.toastError('❌ Nepodařilo se zkopírovat');
        }
      }
    });

    // Close on backdrop click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeShareModal();
      }
    });

    // Close on ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeShareModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
      }, 200);
    }
  }

  // Generate share button HTML
  renderShareButton(restaurant, size = 'md') {
    const sizeClasses = {
      sm: 'w-9 h-9 text-sm',
      md: 'w-11 h-11 text-base',
      lg: 'w-12 h-12 text-lg'
    };

    return `
      <button 
        class="share-btn ${sizeClasses[size]} rounded-full bg-white/5 border border-white/15 hover:border-gurmaogold hover:text-gurmaogold transition flex items-center justify-center"
        data-restaurant='${JSON.stringify(restaurant)}'
        title="Sdílet"
      >
        📤
      </button>
    `;
  }

  // Initialize share button listeners
  initializeShareButtons() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.share-btn');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      try {
        const restaurant = JSON.parse(btn.dataset.restaurant);
        await this.shareRestaurant(restaurant);
      } catch (error) {
        console.error('Share error:', error);
        if (window.toastError) {
          window.toastError('❌ Nepodařilo se sdílet');
        }
      }
    });
  }
}

// Global instance
window.socialShare = new SocialShareManager();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.socialShare.initializeShareButtons();
});

// Convenience function
window.shareRestaurant = (restaurant) => window.socialShare.shareRestaurant(restaurant);
