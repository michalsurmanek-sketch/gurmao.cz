/**
 * AI Recommendations Engine for GURMAO
 * Smart restaurant recommendations based on mood, occasion, and preferences
 */

// Import Supabase client
import { supabase } from './supabase-client.js';

class AIRecommendationEngine {
  constructor() {
    this.restaurants = [];
    this.loaded = false;
    
    // City proximity map (which cities are "close" to each other)
    this.cityProximity = {
      'Praha': ['Kutná Hora', 'Karlštejn'],
      'Brno': ['Znojmo', 'Kroměříž'],
      'Ostrava': ['Olomouc'],
      'Plzeň': ['Karlovy Vary'],
      'Liberec': ['Jablonec nad Nisou']
    };
    
    this.moodProfiles = {
      'romantika': { vibes: ['🍷 LUXE', '🌿 PURE'], groupSize: 2, atmosphere: ['intimní', 'klidná', 'elegantní'] },
      'oslava': { vibes: ['🔥 DRAMA', '🌮 CHAOS'], groupSize: [4, 6, 8], atmosphere: ['živá', 'energická'] },
      'business': { vibes: ['🍷 LUXE', '🌿 PURE'], groupSize: [2, 4], atmosphere: ['klidná', 'elegantní'] },
      'kamarádi': { vibes: ['🔥 DRAMA', '🌮 CHAOS'], groupSize: [4, 6], atmosphere: ['živá', 'casual'] },
      'rychle': { vibes: ['🌮 CHAOS'], priceLevel: [1, 2], atmosphere: ['casual', 'rušná'] },
      'klid': { vibes: ['🌿 PURE', '🍷 LUXE'], groupSize: [1, 2], atmosphere: ['klidná', 'intimní'] }
    };

    this.occasionProfiles = {
      'rande': { mood: 'romantika', vibes: ['🍷 LUXE'], priceLevel: [3, 4] },
      'výročí': { mood: 'romantika', vibes: ['🍷 LUXE'], priceLevel: [4] },
      'narozeniny': { mood: 'oslava', vibes: ['🔥 DRAMA', '🌮 CHAOS'], groupSize: [4, 6, 8] },
      'business dinner': { mood: 'business', vibes: ['🍷 LUXE', '🌿 PURE'], priceLevel: [3, 4] },
      'oběd': { mood: 'rychle', vibes: ['🌮 CHAOS'], priceLevel: [1, 2] },
      'páteční večer': { mood: 'kamarádi', vibes: ['🔥 DRAMA'], groupSize: [4, 6] },
      'party': { mood: 'oslava', vibes: ['🌮 CHAOS', '🔥 DRAMA'], groupSize: [6, 8] }
    };
  }
  
  /**
   * Load restaurants from Supabase
   */
  async loadRestaurants() {
    if (this.loaded) return;
    
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*');
      
      if (error) throw error;
      
      // Transform to AI format
      this.restaurants = restaurants.map(r => ({
        id: r.slug,
        name: r.name,
        vibe: r.vibe,
        city: r.city,
        tag: r.tag,
        description: r.description || '',
        href: `restaurace-${r.slug}.html`,
        image_url: r.image_url,
        // Estimate price level based on vibe
        priceLevel: this.estimatePriceLevel(r.vibe, r.tag),
        // Extract keywords from tag and description
        keywords: this.extractKeywords(r.tag, r.description),
        // Assign group sizes based on vibe
        groupSize: this.estimateGroupSize(r.vibe),
        // Assign occasions based on vibe and tag
        occasion: this.estimateOccasions(r.vibe, r.tag),
        atmosphere: this.estimateAtmosphere(r.vibe)
      }));
      
      this.loaded = true;
      console.log('Loaded', this.restaurants.length, 'restaurants for AI');
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  }
  
  estimatePriceLevel(vibe, tag) {
    if (vibe === '🍷 LUXE' || tag.includes('fine dining')) return 4;
    if (vibe === '🔥 DRAMA' || tag.includes('steak')) return 3;
    if (vibe === '🖤 DARK') return 3;
    if (vibe === '🌿 PURE') return 2;
    if (vibe === '🌮 CHAOS') return 2;
    return 2;
  }
  
  extractKeywords(tag, description) {
    const keywords = [];
    const text = `${tag} ${description}`.toLowerCase();
    
    // Common keywords
    const keywordMap = {
      'steak': ['maso', 'steak', 'hovězí'],
      'sushi': ['sushi', 'rybí', 'japonská'],
      'pizza': ['pizza', 'italská'],
      'burger': ['burger', 'grill'],
      'víno': ['víno', 'wine', 'vinný'],
      'pivo': ['pivo', 'pivnice', 'beer'],
      'vegetarian': ['vegetariánská', 'vegan'],
      'asijská': ['asijská', 'thai', 'vietnam', 'čína']
    };
    
    for (const [key, values] of Object.entries(keywordMap)) {
      if (values.some(v => text.includes(v))) {
        keywords.push(key);
      }
    }
    
    return keywords;
  }
  
  estimateGroupSize(vibe) {
    if (vibe === '🍷 LUXE' || vibe === '🖤 DARK') return [1, 2, 4];
    if (vibe === '🔥 DRAMA') return [2, 4, 6, 8];
    if (vibe === '🌮 CHAOS') return [2, 4, 6, 8];
    if (vibe === '🌿 PURE') return [1, 2, 4];
    return [2, 4];
  }
  
  estimateOccasions(vibe, tag) {
    const occasions = [];
    
    if (vibe === '🍷 LUXE') occasions.push('rande', 'výročí', 'business dinner');
    if (vibe === '🔥 DRAMA') occasions.push('narozeniny', 'páteční večer');
    if (vibe === '🌮 CHAOS') occasions.push('oběd', 'party', 'páteční večer');
    if (vibe === '🌿 PURE') occasions.push('oběd', 'rande');
    if (vibe === '🖤 DARK') occasions.push('rande', 'výročí');
    
    return occasions;
  }
  
  estimateAtmosphere(vibe) {
    if (vibe === '🍷 LUXE') return ['elegantní', 'klidná', 'intimní'];
    if (vibe === '🔥 DRAMA') return ['živá', 'energická', 'dominantní'];
    if (vibe === '🌮 CHAOS') return ['rušná', 'casual', 'energická'];
    if (vibe === '🌿 PURE') return ['klidná', 'čistá', 'harmonická'];
    if (vibe === '🖤 DARK') return ['intimní', 'tlumená', 'tajemná'];
    return ['příjemná'];
  }

  /**
   * Check if two cities are nearby
   */
  isNearbyCity(requestedCity, restaurantCity) {
    const requested = requestedCity.toLowerCase();
    const restaurant = restaurantCity.toLowerCase();
    
    // Check both directions
    const nearby1 = this.cityProximity[requestedCity] || [];
    const nearby2 = this.cityProximity[restaurantCity] || [];
    
    return nearby1.some(c => c.toLowerCase() === restaurant) ||
           nearby2.some(c => c.toLowerCase() === requested);
  }

  /**
   * Get AI recommendations based on user input
   */
  async getRecommendations(query) {
    // Ensure restaurants are loaded
    await this.loadRestaurants();
    
    const {
      mood = null,
      occasion = null,
      groupSize = null,
      city = null,
      priceLevel = null,
      freeText = ''
    } = query;

    let scored = this.restaurants.map(restaurant => {
      let score = 0;
      let reasons = [];

      // Mood matching
      if (mood && this.moodProfiles[mood]) {
        const profile = this.moodProfiles[mood];
        if (profile.vibes.includes(restaurant.vibe)) {
          score += 30;
          reasons.push(`Perfektní ${restaurant.vibe} vibe pro ${mood}`);
        }
        if (profile.groupSize && (Array.isArray(profile.groupSize) 
            ? profile.groupSize.includes(groupSize) 
            : profile.groupSize === groupSize)) {
          score += 15;
        }
        if (profile.atmosphere && restaurant.atmosphere.some(a => profile.atmosphere.includes(a))) {
          score += 20;
          reasons.push(`Atmosféra sedí`);
        }
      }

      // Occasion matching
      if (occasion && this.occasionProfiles[occasion]) {
        const profile = this.occasionProfiles[occasion];
        if (restaurant.occasion.includes(occasion)) {
          score += 35;
          reasons.push(`Doporučeno pro ${occasion}`);
        }
        if (profile.vibes.includes(restaurant.vibe)) {
          score += 25;
        }
      }

      // Group size matching
      if (groupSize && restaurant.groupSize.includes(groupSize)) {
        score += 20;
        reasons.push(`Ideální pro ${groupSize} ${groupSize === 2 ? 'lidi' : 'lidí'}`);
      }

      // City matching - high priority
      if (city) {
        if (restaurant.city.toLowerCase() === city.toLowerCase()) {
          score += 100; // Very high bonus for exact city match
          reasons.push(`V ${city}`);
        } else {
          score -= 50; // Penalty for wrong city, but not too harsh
        }
      }

      // Price level matching
      if (priceLevel && Math.abs(restaurant.priceLevel - priceLevel) === 0) {
        score += 15;
        reasons.push('Cenová relace sedí');
      }

      // Free text keyword matching
      if (freeText) {
        const lowerText = freeText.toLowerCase();
        let keywordMatches = 0;
        
        restaurant.keywords.forEach(keyword => {
          if (lowerText.includes(keyword.toLowerCase())) {
            keywordMatches++;
            score += 10;
          }
        });

        if (keywordMatches > 0) {
          reasons.push(`${keywordMatches} keyword ${keywordMatches === 1 ? 'match' : 'matches'}`);
        }

        // Check description
        if (restaurant.description.toLowerCase().includes(lowerText.split(' ')[0])) {
          score += 5;
        }
      }

      // Base score for variety
      score += Math.random() * 5;

      return {
        ...restaurant,
        score: Math.round(score),
        matchReasons: reasons.slice(0, 3) // Top 3 reasons
      };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Generate AI-style explanation for recommendation
   */
  generateExplanation(query, topPick) {
    const { mood, occasion, groupSize } = query;
    
    let explanation = "Na základě tvých preferencí ";
    
    if (mood) explanation += `(nálada: ${mood}) `;
    if (occasion) explanation += `a příležitosti "${occasion}" `;
    if (groupSize) explanation += `pro ${groupSize} ${groupSize === 2 ? 'lidi' : 'lidí'} `;
    
    explanation += `ti doporučuji **${topPick.name}** v ${topPick.city}. `;
    
    if (topPick.matchReasons.length > 0) {
      explanation += `Důvody: ${topPick.matchReasons.join(', ')}.`;
    }

    return explanation;
  }

  /**
   * Get confidence level based on score
   */
  getConfidence(score) {
    if (score >= 80) return { level: 'Vysoká', color: 'text-green-400', emoji: '💚' };
    if (score >= 60) return { level: 'Střední', color: 'text-yellow-400', emoji: '💛' };
    if (score >= 40) return { level: 'Nízká', color: 'text-orange-400', emoji: '🧡' };
    return { level: 'Velmi nízká', color: 'text-red-400', emoji: '❤️' };
  }

  /**
   * Render recommendation card
   */
  renderRecommendationCard(restaurant, index) {
    const confidence = this.getConfidence(restaurant.score);
    const isTopPick = index === 0;

    return `
      <div class="bg-white/5 rounded-2xl border ${isTopPick ? 'border-gurmaogold shadow-glow' : 'border-white/10'} p-6 hover:bg-white/10 transition">
        ${isTopPick ? '<div class="inline-block px-3 py-1 rounded-full bg-gurmaogold text-black text-xs font-bold mb-3">🏆 TOP PICK</div>' : ''}
        
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="text-xs text-gurmaogold mb-1">${restaurant.vibe}</div>
            <h3 class="text-xl font-bold">${restaurant.name}</h3>
            <div class="text-white/60 text-sm mt-1">${restaurant.city} · ${restaurant.tag}</div>
          </div>
          <div class="text-right">
            <div class="${confidence.color} text-sm font-semibold">${confidence.emoji} ${confidence.level}</div>
            <div class="text-white/40 text-xs mt-1">Score: ${restaurant.score}</div>
          </div>
        </div>

        <p class="text-white/80 text-sm mb-4">${restaurant.description}</p>

        ${restaurant.matchReasons.length > 0 ? `
          <div class="mb-4 space-y-1">
            ${restaurant.matchReasons.map(reason => `
              <div class="text-xs text-white/60 flex items-center gap-2">
                <span class="text-gurmaogold">✓</span>
                ${reason}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="flex gap-2">
          <a href="${restaurant.href}" class="flex-1 px-4 py-2 rounded-full ${isTopPick ? 'bg-gurmaogold text-black' : 'bg-white/10 text-white'} text-center text-sm font-semibold hover:scale-105 transition">
            Zobrazit detail →
    
    if (!recommendations || recommendations.length === 0) {
      return '<div class="text-center text-white/60 py-12">Žádné doporučení nenalezeno. Zkus změnit filtry.</div>';
    }

    // Separate by city if city was specified
    let mainResults = recommendations;
    let nearbyResults = [];
    
    if (query.city) {
      mainResults = recommendations.filter(r => 
        r.city.toLowerCase() === query.city.toLowerCase()
      );
      nearbyResults = recommendations.filter(r => 
        r.city.toLowerCase() !== query.city.toLowerCase() && r.score > 0
      ).slice(0, 3);
    }

    // If no results in main city, show message
    if (mainResults.length === 0 && query.city) {
      return `
        <div class="text-center py-12">
          <div class="text-5xl mb-4">🤷</div>
          <p class="text-white/80 mb-2">V ${query.city} jsme bohužel nenašli odpovídající restaurace.</p>
          ${nearbyResults.length > 0 ? `
            <p class="text-white/60 text-sm mb-6">Máme pro tebe ale tipy z okolí:</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              ${nearbyResults.map((r, i) => this.renderRecommendationCard(r, i)).join('')}
            </div>
          ` : '<p class="text-white/60 text-sm">Zkus změnit filtry nebo jiné město.</p>'}
        </div>
      `;
    }

    const topPick = mainResults[0];
    const explanation = this.generateExplanation(query, topPick);

    let html = `
      <div class="mb-8 p-6 bg-gradient-to-br from-gurmaogold/20 to-gurmaored/20 rounded-2xl border border-gurmaogold/30">
        <div class="flex items-start gap-3">
          <div class="text-3xl">🤖</div>
          <div class="flex-1">
            <h3 class="font-bold mb-2">AI Doporučení</h3>
            <p class="text-white/90 text-sm leading-relaxed">${explanation}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${mainResults.slice(0, 6).map((r, i) => this.renderRecommendationCard(r, i)).join('')}
      </div>
    `;

    // Add nearby alternatives if applicable
    if (query.city && nearbyResults.length > 0 && mainResults.length < 3) {
      html += `
        <div class="mt-12">
          <h3 class="text-xl font-bold mb-4 text-white/80">💡 Alternativy z okolí</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${nearbyResults.map((r, i) => this.renderRecommendationCard(r, i + 100)).join('')}
          </div>
        </div>
      `;
    }

    return html
    return `
      <div class="mb-8 p-6 bg-gradient-to-br from-gurmaogold/20 to-gurmaored/20 rounded-2xl border border-gurmaogold/30">
        <div class="flex items-start gap-3">
          <div class="text-3xl">🤖</div>
          <div class="flex-1">
            <h3 class="font-bold mb-2">AI Doporučení</h3>
            <p class="text-white/90 text-sm leading-relaxed">${explanation}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${recommendations.map((r, i) => this.renderRecommendationCard(r, i)).join('')}
      </div>
    `;
  }
}

// Initialize and expose globally
window.aiEngine = new AIRecommendationEngine();

// Auto-initialize form handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('aiRecommendationForm');
  const resultsContainer = document.getElementById('aiResults');

  if (form && resultsContainer) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Show loading
      resultsContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-block animate-spin text-4xl mb-4">🤖</div>
          <div class="text-white/60">AI přemýšlí...</div>
        </div>
      `;

      // Simulate AI processing delay
      setTimeout(async () => {
        const formData = new FormData(form);
        const query = {
          mood: formData.get('mood') || null,
          occasion: formData.get('occasion') || null,
          groupSize: parseInt(formData.get('groupSize')) || null,
          city: formData.get('city') || null,
          priceLevel: parseInt(formData.get('priceLevel')) || null,
          freeText: formData.get('freeText') || ''
        };

        const html = await window.aiEngine.renderRecommendations(query);
        resultsContainer.innerHTML = html;

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1200);
    });

    // Reset button
    const resetBtn = document.getElementById('resetForm');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        resultsContainer.innerHTML = '';
      });
    }
  }
});
