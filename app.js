// GURMAO.cz - Shared JavaScript
// © 2025 GURMAO.cz

// ======================
// MOBILE MENU
// ======================
(function initMobileMenu() {
  const btn = document.getElementById('menuBtn');
  const close = document.getElementById('menuClose');
  const backdrop = document.getElementById('menuBackdrop');
  const menu = document.getElementById('mobileMenu');
  
  if (!btn || !close || !backdrop || !menu) return;
  
  const open = () => {
    backdrop.classList.remove('hidden');
    menu.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
  
  const shut = () => {
    backdrop.classList.add('hidden');
    menu.classList.add('hidden');
    document.body.style.overflow = '';
  };
  
  btn.addEventListener('click', open);
  close.addEventListener('click', shut);
  backdrop.addEventListener('click', shut);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') shut();
  });
  
  // Close menu when clicking any link
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', shut);
  });
})();

// ======================
// SAVE TO COLLECTIONS
// ======================
const GurmaoCollections = {
  storageKey: 'gurmao_saved',
  
  getSaved() {
    return new Set(JSON.parse(localStorage.getItem(this.storageKey) || '[]'));
  },
  
  save(id) {
    const saved = this.getSaved();
    saved.add(id);
    localStorage.setItem(this.storageKey, JSON.stringify([...saved]));
    return true;
  },
  
  remove(id) {
    const saved = this.getSaved();
    saved.delete(id);
    localStorage.setItem(this.storageKey, JSON.stringify([...saved]));
    return true;
  },
  
  toggle(id) {
    const saved = this.getSaved();
    if (saved.has(id)) {
      this.remove(id);
      return false;
    } else {
      this.save(id);
      return true;
    }
  },
  
  isSaved(id) {
    return this.getSaved().has(id);
  }
};

// Initialize save buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-save]').forEach(btn => {
    const id = btn.getAttribute('data-save');
    
    // Update button state
    if (GurmaoCollections.isSaved(id)) {
      btn.textContent = '❤️';
      btn.classList.add('saved');
    }
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isSaved = GurmaoCollections.toggle(id);
      btn.textContent = isSaved ? '❤️' : '🤍';
      
      if (isSaved) {
        btn.classList.add('saved');
        showToast('Uloženo do sbírek ✓');
      } else {
        btn.classList.remove('saved');
        showToast('Odebráno ze sbírek');
      }
    });
  });
});

// ======================
// TOAST NOTIFICATIONS
// ======================
function showToast(message, duration = 2000) {
  const existing = document.getElementById('gurmao-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'gurmao-toast';
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-gurmaogold text-black font-semibold shadow-glow animate-fade-in';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ======================
// CATALOG DATA (MVP)
// ======================
const GurmaoCatalog = {
  restaurants: [
    {
      id: 'noir-table',
      vibe: '🍷 LUXE',
      name: 'Noir Table',
      city: 'Praha',
      tag: 'fine dining',
      href: 'restaurace-noir-table.html',
      img: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
      description: 'Místo, kde se čas zpomalí. Oheň, ticho, precizní servis.'
    },
    {
      id: 'ember-steak',
      vibe: '🔥 DRAMA',
      name: 'Ember Steak',
      city: 'Brno',
      tag: 'steakhouse',
      href: 'restaurace-noir-table.html',
      img: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80',
      description: 'Oheň, kouř, maso. Žádné výmluvy.'
    },
    {
      id: 'la-calle',
      vibe: '🌮 CHAOS',
      name: 'La Calle',
      city: 'Ostrava',
      tag: 'street food',
      href: 'restaurace-noir-table.html',
      img: 'https://images.unsplash.com/photo-1529692236671-f1dc2c0f2c0e?auto=format&fit=crop&w=1200&q=80',
      description: 'Chaos, kyselost, šťáva. Ulice na talíři.'
    }
  ],
  
  chefs: [
    {
      id: 'adam-noir',
      vibe: '🧑‍🍳 Head Chef · 🍷 LUXE',
      name: 'Adam Noir',
      style: 'Minimalismus · oheň · ticho',
      href: 'kuchar-adam-noir.html',
      img: 'https://images.unsplash.com/photo-1600891965050-dc6c28c5a12b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'marek-ember',
      vibe: '🧑‍🍳 Grill Master · 🔥 DRAMA',
      name: 'Marek Ember',
      style: 'Oheň · maso · kouř',
      href: 'kuchar-adam-noir.html',
      img: 'https://images.unsplash.com/photo-1604908177074-9c0d0f1f216c?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'sofia-calle',
      vibe: '🧑‍🍳 Street Artist · 🌮 CHAOS',
      name: 'Sofia Calle',
      style: 'Chaos · kyselost · šťáva',
      href: 'kuchar-adam-noir.html',
      img: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  
  gear: [
    {
      id: 'gyuto-240',
      users: '18 kuchařů',
      name: 'Gyuto 240 mm',
      description: 'Preciznost bez kompromisů',
      img: 'https://images.unsplash.com/photo-1600180758895-7f9a5c0a0f94?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'cast-iron',
      users: '11 restaurací',
      name: 'Litinová pánev',
      description: 'Chuť, která drží',
      img: 'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'binchotan',
      users: 'Noir Table',
      name: 'Uhlí Binchotan',
      description: 'Oheň bez kouře',
      img: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&w=1200&q=80'
    }
  ]
};

// ======================
// SMOOTH SCROLL
// ======================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
