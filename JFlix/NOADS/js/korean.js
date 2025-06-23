// API Configuration
const API_KEY = '84549ba3644ea15176802ec153bd9442';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const BACKDROP_SIZE = '/original';
const POSTER_SIZE = '/w500';

// Global variables
let topRatedOngoingKoreanDramas = [];
let currentBannerKoreanDramaIndex = 0;
let bannerRotationIntervalIdKorean;
const BANNER_ROTATION_DELAY_KOREAN = 7000; // 7 seconds
let currentMediaType = 'tv';
let currentMediaId = null;
let searchTimeout = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchModal = document.getElementById('search-modal');
const modal = document.getElementById('modal');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  initializePage();
});

// Initialize the page with Korean TV content
async function initializePage() {
  try {
    // Show loading indicators
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Loading content...</p></div>';
    });
    
    // Initialize banner with a featured Korean drama
    await initializeBanner();
    
    // Load Korean TV lists
    await Promise.all([
      loadPopularKoreanTV(),
      loadTopRatedKoreanTV(),
      loadRecentKoreanTV(),
      loadOnAirKoreanTV()
    ]);
  } catch (error) {
    console.error('Error initializing page:', error);
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="error-message">Failed to load content. Please try again later.</div>';
    });
  }
}

// Function to display a specific Korean drama in the banner
function displayBannerKoreanDrama(dramaIndex) {
  if (!topRatedOngoingKoreanDramas || topRatedOngoingKoreanDramas.length === 0) return;

  const drama = topRatedOngoingKoreanDramas[dramaIndex];
  const bannerElement = document.getElementById('banner');
  
  if (drama && drama.backdrop_path) {
    bannerElement.style.backgroundImage = `url('${IMAGE_BASE_URL}${BACKDROP_SIZE}${drama.backdrop_path}')`;
  } else {
    bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))'; 
  }
  bannerElement.dataset.id = drama.id;
  bannerElement.dataset.type = 'tv'; // Korean dramas are 'tv' type
  
  document.getElementById('banner-title').textContent = drama.name || 'Korean Drama Title Unavailable';
  document.getElementById('banner-overview').textContent = drama.overview ? (drama.overview.length > 200 ? drama.overview.substring(0, 200) + '...' : drama.overview) : 'Overview not available.';
}

// Function to rotate to the next banner Korean drama
function rotateBannerKoreanDrama() {
  currentBannerKoreanDramaIndex++;
  if (currentBannerKoreanDramaIndex >= topRatedOngoingKoreanDramas.length) {
    currentBannerKoreanDramaIndex = 0;
  }
  displayBannerKoreanDrama(currentBannerKoreanDramaIndex);
}

// Initialize the banner with a rotating display of top-rated and ongoing Korean dramas
async function initializeBanner() {
  try {
    // Fetch top-rated and ongoing Korean dramas
    const data = await fetchFromTMDB('discover/tv', {
      with_original_language: 'ko',
      with_genres: 18, // Drama
      // TMDB API uses 'or' logic for multiple statuses if separated by a pipe |
      // However, it's safer to fetch a broader set and filter, or make two calls if specific 'AND' logic for status is needed.
      // For simplicity, let's fetch top-rated dramas and assume many popular ones are ongoing or recent.
      // A more robust solution might involve checking 'status' or 'last_air_date' from results.
      // Let's prioritize top-rated and recent for now.
      sort_by: 'vote_average.desc',
      'vote_count.gte': 150, // Higher vote count for more reliable rating
      'first_air_date.gte': new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0], // Air date within the last 2 years
      page: 1
    });

    if (!data.results || data.results.length === 0) {
      console.error('No top-rated/ongoing Korean dramas found for banner');
      // Fallback display
      const bannerElement = document.getElementById('banner');
      bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
      document.getElementById('banner-title').textContent = 'Welcome to JFlix Korean TV';
      document.getElementById('banner-overview').textContent = 'Explore the best Korean dramas and TV shows.';
      return;
    }

    topRatedOngoingKoreanDramas = data.results.slice(0, 10); // Take top 10 for rotation

    if (topRatedOngoingKoreanDramas.length > 0) {
      currentBannerKoreanDramaIndex = 0;
      displayBannerKoreanDrama(currentBannerKoreanDramaIndex);
      
      if (bannerRotationIntervalIdKorean) {
        clearInterval(bannerRotationIntervalIdKorean);
      }
      bannerRotationIntervalIdKorean = setInterval(rotateBannerKoreanDrama, BANNER_ROTATION_DELAY_KOREAN);
    } else {
      // Fallback if, after slicing, no dramas are available
      const bannerElement = document.getElementById('banner');
      bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
      document.getElementById('banner-title').textContent = 'Welcome to JFlix Korean TV';
      document.getElementById('banner-overview').textContent = 'Explore the best Korean dramas and TV shows.';
    }
  } catch (error) {
    console.error('Error initializing banner:', error);
    const bannerElement = document.getElementById('banner');
    bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
    document.getElementById('banner-title').textContent = 'Welcome to JFlix Korean TV';
    document.getElementById('banner-overview').textContent = 'Explore the best Korean dramas and TV shows.';
  }
}

// Load popular Korean TV shows
async function loadPopularKoreanTV() {
  try {
    const data = await fetchFromTMDB('discover/tv', { 
      with_original_language: 'ko',
      sort_by: 'popularity.desc'
    });
    displayList(data.results, 'popular-list');
  } catch (error) {
    console.error('Error loading popular Korean TV shows:', error);
    document.getElementById('popular-list').innerHTML = '<div class="error-message">Failed to load popular Korean TV shows.</div>';
  }
}

// Load top rated Korean TV shows
async function loadTopRatedKoreanTV() {
  try {
    const data = await fetchFromTMDB('discover/tv', { 
      with_original_language: 'ko',
      sort_by: 'vote_average.desc',
      vote_count_gte: 100
    });
    displayList(data.results, 'top-rated-list');
  } catch (error) {
    console.error('Error loading top rated Korean TV shows:', error);
    document.getElementById('top-rated-list').innerHTML = '<div class="error-message">Failed to load top rated Korean TV shows.</div>';
  }
}

// Load recent Korean TV shows
async function loadRecentKoreanTV() {
  try {
    const data = await fetchFromTMDB('discover/tv', { 
      with_original_language: 'ko',
      sort_by: 'first_air_date.desc'
    });
    displayList(data.results, 'recent-list');
  } catch (error) {
    console.error('Error loading recent Korean TV shows:', error);
    document.getElementById('recent-list').innerHTML = '<div class="error-message">Failed to load recent Korean TV shows.</div>';
  }
}

// Load on air Korean TV shows
async function loadOnAirKoreanTV() {
  try {
    // Get current date
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    // Format dates for API
    const todayStr = today.toISOString().split('T')[0];
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
    
    const data = await fetchFromTMDB('discover/tv', { 
      with_original_language: 'ko',
      air_date_gte: oneMonthAgoStr,
      air_date_lte: todayStr
    });
    displayList(data.results, 'on-air-list');
  } catch (error) {
    console.error('Error loading on air Korean TV shows:', error);
    document.getElementById('on-air-list').innerHTML = '<div class="error-message">Failed to load on air Korean TV shows.</div>';
  }
}

// Fetch data from TMDB API
async function fetchFromTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params
  }).toString();
  
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return { results: [] };
  }
}

// Display a list of media items
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear the container
  container.innerHTML = '';
  
  // Check if items exist and have length
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="no-content">No content available</div>';
    return;
  }
  
  // Add class if few items
  if (items.length < 5) {
    container.classList.add('few-items');
  } else {
    container.classList.remove('few-items');
  }
  
  // Create and append cards
  let cardsAdded = 0;
  items.forEach(item => {
    const card = createMediaCard(item);
    if (card) {
      container.appendChild(card);
      cardsAdded++;
    }
  });
  
  // If no cards were added (e.g., all items had no poster), show message
  if (cardsAdded === 0) {
    container.innerHTML = '<div class="no-content">No content available</div>';
  }
}

// Create a media card
function createMediaCard(item) {
  if (!item.poster_path) return null;
  
  // Clone the template
  const template = document.getElementById('media-card-template');
  const card = template.content.cloneNode(true);
  
  // Set card data
  card.querySelector('.media-card').dataset.id = item.id;
  card.querySelector('.media-card').dataset.type = 'tv';
  
  // Set poster image
  const posterUrl = `${IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}`;
  card.querySelector('.card-poster').src = posterUrl;
  card.querySelector('.card-poster').alt = item.name;
  
  // Set title
  card.querySelector('.card-title').textContent = item.name;
  
  // Set year
  const firstAirDate = item.first_air_date;
  if (firstAirDate) {
    const year = new Date(firstAirDate).getFullYear();
    card.querySelector('.card-year').textContent = year;
  } else {
    card.querySelector('.card-year').textContent = 'Unknown';
  }
  
  // Set rating
  const rating = Math.round(item.vote_average * 10) / 10;
  const ratingElement = card.querySelector('.card-rating');
  if (rating > 0) {
    const stars = Math.round(rating / 2);
    ratingElement.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const starIcon = document.createElement('i');
      if (i < stars) {
        starIcon.className = 'fas fa-star';
      } else {
        starIcon.className = 'far fa-star';
      }
      ratingElement.appendChild(starIcon);
    }
    ratingElement.innerHTML += ` <span class="rating-number">${rating}</span>`;
  } else {
    ratingElement.innerHTML = '<span class="no-rating">Not rated</span>';
  }
  
  // Add event listeners
  card.querySelector('.watch-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    watchMedia(item.id, 'tv');
  });
  
  card.querySelector('.details-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    viewMediaDetails(item.id, 'tv');
  });
  
  card.querySelector('.media-card').addEventListener('click', () => {
    showQuickView(item.id, 'tv');
  });
  
  return card;
}

// Watch a Korean TV show
function watchMedia(id, type) {
  window.location.href = `player.html?id=${id}&type=${type}`;
}

// View Korean TV show details
function viewMediaDetails(id, type) {
  window.location.href = `details.html?id=${id}&type=${type}`;
}

// Show quick view modal
async function showQuickView(id, type) {
  try {
    currentMediaId = id;
    currentMediaType = type;
    
    // Show loading state
    modal.classList.add('show');
    document.getElementById('modal-image').src = '';
    document.getElementById('modal-title').textContent = 'Loading...';
    document.getElementById('modal-year').textContent = '';
    document.getElementById('modal-runtime').textContent = '';
    document.getElementById('modal-rating').innerHTML = '';
    document.getElementById('modal-genres').innerHTML = '';
    document.getElementById('modal-description').textContent = 'Loading details...';
    
    // Fetch Korean TV show details
    const kdrama = await fetchFromTMDB(`tv/${id}`);
    
    // Set modal content
    document.getElementById('modal-image').src = `${IMAGE_BASE_URL}${POSTER_SIZE}${kdrama.poster_path}`;
    document.getElementById('modal-title').textContent = kdrama.name;
    
    // Set year
    if (kdrama.first_air_date) {
      const year = new Date(kdrama.first_air_date).getFullYear();
      document.getElementById('modal-year').textContent = year;
    } else {
      document.getElementById('modal-year').textContent = 'Unknown';
    }
    
    // Set runtime
    if (kdrama.episode_run_time && kdrama.episode_run_time.length > 0) {
      document.getElementById('modal-runtime').textContent = `${kdrama.episode_run_time[0]} min`;
    } else {
      document.getElementById('modal-runtime').textContent = 'Unknown';
    }
    
    // Set rating
    const rating = Math.round(kdrama.vote_average * 10) / 10;
    const ratingElement = document.getElementById('modal-rating');
    if (rating > 0) {
      const stars = Math.round(rating / 2);
      ratingElement.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const starIcon = document.createElement('i');
        if (i < stars) {
          starIcon.className = 'fas fa-star';
        } else {
          starIcon.className = 'far fa-star';
        }
        ratingElement.appendChild(starIcon);
      }
      ratingElement.innerHTML += ` <span class="rating-number">${rating}</span>`;
    } else {
      ratingElement.innerHTML = '<span class="no-rating">Not rated</span>';
    }
    
    // Set genres
    const genresElement = document.getElementById('modal-genres');
    genresElement.innerHTML = '';
    if (kdrama.genres && kdrama.genres.length > 0) {
      kdrama.genres.forEach(genre => {
        const genreTag = document.createElement('span');
        genreTag.className = 'genre-tag';
        genreTag.textContent = genre.name;
        genresElement.appendChild(genreTag);
      });
    } else {
      genresElement.innerHTML = '<span class="no-genres">No genres available</span>';
    }
    
    // Set description
    document.getElementById('modal-description').textContent = kdrama.overview || 'No description available';
  } catch (error) {
    console.error('Error showing quick view:', error);
    document.getElementById('modal-description').textContent = 'Failed to load details. Please try again later.';
  }
}

// Close modal
function closeModal() {
  modal.classList.remove('show');
}

// Watch featured Korean TV show
function watchFeatured() {
  const banner = document.getElementById('banner');
  const id = banner.dataset.id;
  const type = banner.dataset.type;
  if (id && type) {
    watchMedia(id, type);
  }
}

// Show featured Korean TV show details
function showFeaturedDetails() {
  const banner = document.getElementById('banner');
  const id = banner.dataset.id;
  const type = banner.dataset.type;
  if (id && type) {
    viewMediaDetails(id, type);
  }
}

// Watch Korean TV show from modal
function watchMovie() {
  if (currentMediaId && currentMediaType) {
    watchMedia(currentMediaId, currentMediaType);
  }
}

// View Korean TV show details from modal
function viewDetails() {
  if (currentMediaId && currentMediaType) {
    viewMediaDetails(currentMediaId, currentMediaType);
  }
}

// Open search modal
function openSearchModal() {
  searchModal.classList.add('show');
  searchInput.focus();
}

// Close search modal
function closeSearchModal() {
  searchModal.classList.remove('show');
  searchResults.innerHTML = '';
  searchInput.value = '';
}

// Search TMDB
function searchTMDB() {
  clearTimeout(searchTimeout);
  
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchResults.innerHTML = '<div class="search-message">Type at least 2 characters to search</div>';
    return;
  }
  
  searchResults.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Searching...</p></div>';
  
  searchTimeout = setTimeout(async () => {
    try {
      // For Korean TV search, we'll use TV shows with Korean language
      const data = await fetchFromTMDB('search/tv', { query });
      
      // Filter results to only include Korean TV shows
      const koreanResults = data.results.filter(item => {
        // Check if the original language is Korean
        return item.original_language === 'ko';
      });
      
      displaySearchResults(koreanResults);
    } catch (error) {
      console.error('Error searching TMDB:', error);
      searchResults.innerHTML = '<div class="error-message">Search failed. Please try again later.</div>';
    }
  }, 500);
}

// Display search results
function displaySearchResults(items) {
  searchResults.innerHTML = '';
  
  if (!items || items.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No results found</div>';
    return;
  }
  
  items.forEach(item => {
    if (!item.poster_path) return;
    
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.dataset.id = item.id;
    resultItem.dataset.type = 'tv';
    
    const posterUrl = `${IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}`;
    
    resultItem.innerHTML = `
      <img src="${posterUrl}" alt="${item.name}" class="result-poster">
      <div class="result-info">
        <h3 class="result-title">${item.name}</h3>
        <p class="result-year">${item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'Unknown'}</p>
        <div class="result-buttons">
          <button class="btn watch-btn"><i class="fas fa-play"></i> Watch</button>
          <button class="btn details-btn"><i class="fas fa-info-circle"></i> Details</button>
        </div>
      </div>
    `;
    
    resultItem.querySelector('.watch-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      watchMedia(item.id, 'tv');
    });
    
    resultItem.querySelector('.details-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      viewMediaDetails(item.id, 'tv');
    });
    
    resultItem.addEventListener('click', () => {
      showQuickView(item.id, 'tv');
    });
    
    searchResults.appendChild(resultItem);
  });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
  if (e.target === searchModal) {
    closeSearchModal();
  }
});

// Close modals when pressing Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeSearchModal();
  }
});
