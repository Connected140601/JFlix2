// API Configuration
const API_KEY = '84549ba3644ea15176802ec153bd9442';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const BACKDROP_SIZE = '/original';
const POSTER_SIZE = '/w500';

// Global variables
let currentMediaType = 'movie';
let currentMediaId = null;
let searchTimeout = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchModal = document.getElementById('search-modal');
const modal = document.getElementById('modal');

// Media types
const MEDIA_TYPES = {
  MOVIES: 'movie'
};

// Fetch data from TMDB API
async function fetchFromTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params
  }).toString();
  
  try {
    console.log(`Fetching: ${BASE_URL}/${endpoint}?${queryParams}`);
    const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams}`);
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error(`Error Body: ${errorBody}`);
      throw new Error(`Network response was not ok: ${response.status}. Body: ${errorBody}`);
    }
    const data = await response.json();
    console.log(`Data received for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error.message, error.stack);
    return { results: [] };
  }
}

// Fetch popular movies
async function fetchPopularMovies() {
  const data = await fetchFromTMDB('movie/popular', {
    sort_by: 'popularity.desc',
    'vote_count.gte': 50
  });
  return data.results.map(item => ({...item, mediaType: MEDIA_TYPES.MOVIES}));
}

// Fetch top rated movies
async function fetchTopRatedMovies() {
  const data = await fetchFromTMDB('movie/top_rated', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': 100
  });
  return data.results.map(item => ({...item, mediaType: MEDIA_TYPES.MOVIES}));
}

// Fetch upcoming movies
async function fetchUpcomingMovies() {
  const data = await fetchFromTMDB('movie/upcoming', {
    sort_by: 'release_date.asc'
  });
  return data.results.map(item => ({...item, mediaType: MEDIA_TYPES.MOVIES}));
}

// Fetch now playing movies
async function fetchNowPlayingMovies() {
  const data = await fetchFromTMDB('movie/now_playing');
  return data.results.map(item => ({...item, mediaType: MEDIA_TYPES.MOVIES}));
}

// Fetch movie details by ID
async function fetchMovieDetails(movieId) {
  return await fetchFromTMDB(`movie/${movieId}`);
}

// Display featured item in banner
function displayBanner(item) {
  if (!item) return;
  
  const banner = document.getElementById('banner');
  if (!banner) return;
  
  if (item.backdrop_path) {
    banner.style.backgroundImage = `url(${IMAGE_BASE_URL}${BACKDROP_SIZE}${item.backdrop_path})`;
  }
  
  const titleElement = document.getElementById('banner-title');
  if (titleElement) {
    titleElement.textContent = item.title;
  }
  
  const overviewElement = document.getElementById('banner-overview');
  if (overviewElement) overviewElement.textContent = item.overview;
}

// Create media card from template
function createMediaCard(item) {
  // Skip items without poster
  if (!item || !item.poster_path) return null;
  
  // Clone the template
  const template = document.getElementById('media-card-template');
  if (!template) return null;
  
  const card = template.content.cloneNode(true);
  const cardElement = card.querySelector('.media-card');
  
  // Set poster image
  const poster = card.querySelector('.card-poster');
  if (poster) {
    poster.src = `${IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}`;
    poster.alt = item.title;
  }
  
  // Set card info
  const cardTitle = card.querySelector('.card-title');
  if (cardTitle) cardTitle.textContent = item.title;
  
  // Set rating stars
  const rating = Math.round((item.vote_average || 0) / 2);
  const cardRating = card.querySelector('.card-rating');
  if (cardRating) cardRating.innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  
  // Set year
  const year = (item.release_date || '').split('-')[0];
  const cardYear = card.querySelector('.card-year');
  if (cardYear) cardYear.textContent = year;
  
  return card;
}

// Display list of media items
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
  
  // Create and append cards
  items.forEach(item => {
    const card = createMediaCard(item);
    if (card) container.appendChild(card);
  });
}

// Initialize the page with content
async function initializePage() {
  try {
    // Show loading indicators
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Loading content...</p></div>';
    });
    
    // Initialize banner with a featured movie
    await initializeBanner();
    
    // Load movie lists
    await Promise.all([
      loadPopularMovies(),
      loadTopRatedMovies(),
      loadUpcomingMovies(),
      loadNowPlayingMovies()
    ]);
  } catch (error) {
    console.error('Error initializing page:', error);
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="error-message">Failed to load content. Please try again later.</div>';
    });
  }
}

// Initialize the banner with a featured movie
async function initializeBanner() {
  try {
    const data = await fetchFromTMDB('movie/popular');
    if (!data.results || data.results.length === 0) {
      console.error('No movies found for banner');
      return;
    }
    
    // Get a random movie from the top 5 popular movies
    const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
    const movie = data.results[randomIndex];
    
    // Set banner background
    const bannerElement = document.getElementById('banner');
    bannerElement.style.backgroundImage = `url('${IMAGE_BASE_URL}${BACKDROP_SIZE}${movie.backdrop_path}')`;
    bannerElement.dataset.id = movie.id;
    bannerElement.dataset.type = 'movie';
    
    // Set banner content
    document.getElementById('banner-title').textContent = movie.title;
    document.getElementById('banner-overview').textContent = movie.overview;
  } catch (error) {
    console.error('Error initializing banner:', error);
    const bannerElement = document.getElementById('banner');
    bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
    document.getElementById('banner-title').textContent = 'Welcome to JFlix Movies';
    document.getElementById('banner-overview').textContent = 'Explore the best movies from around the world.';
  }
}

// Load popular movies
async function loadPopularMovies() {
  try {
    const data = await fetchFromTMDB('movie/popular');
    displayList(data.results, 'popular-list');
  } catch (error) {
    console.error('Error loading popular movies:', error);
    document.getElementById('popular-list').innerHTML = '<div class="error-message">Failed to load popular movies.</div>';
  }
}

// Load top rated movies
async function loadTopRatedMovies() {
  try {
    const data = await fetchFromTMDB('movie/top_rated');
    displayList(data.results, 'top-rated-list');
  } catch (error) {
    console.error('Error loading top rated movies:', error);
    document.getElementById('top-rated-list').innerHTML = '<div class="error-message">Failed to load top rated movies.</div>';
  }
}

// Load upcoming movies
async function loadUpcomingMovies() {
  try {
    const data = await fetchFromTMDB('movie/upcoming');
    displayList(data.results, 'upcoming-list');
  } catch (error) {
    console.error('Error loading upcoming movies:', error);
    document.getElementById('upcoming-list').innerHTML = '<div class="error-message">Failed to load upcoming movies.</div>';
  }
}

// Load now playing movies
async function loadNowPlayingMovies() {
  try {
    const data = await fetchFromTMDB('movie/now_playing');
    displayList(data.results, 'now-playing-list');
  } catch (error) {
    console.error('Error loading now playing movies:', error);
    document.getElementById('now-playing-list').innerHTML = '<div class="error-message">Failed to load now playing movies.</div>';
  }
}

// Watch featured movie
function watchFeatured() {
  const banner = document.getElementById('banner');
  const id = banner.dataset.id;
  const type = banner.dataset.type;
  if (id && type) {
    window.location.href = `player.html?id=${id}&type=${type}`;
  }
}

// Show featured movie details
function showFeaturedDetails() {
  const banner = document.getElementById('banner');
  const id = banner.dataset.id;
  const type = banner.dataset.type;
  if (id && type) {
    window.location.href = `details.html?id=${id}&type=${type}`;
  }
}

// Add event listeners to card buttons
function addCardEventListeners() {
  // Watch buttons
  document.querySelectorAll('.watch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.media-card');
      if (card) {
        const id = card.dataset.id;
        const type = card.dataset.type || 'movie';
        window.location.href = `player.html?id=${id}&type=${type}`;
      }
    });
  });
  
  // Details buttons
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.media-card');
      if (card) {
        const id = card.dataset.id;
        const type = card.dataset.type || 'movie';
        window.location.href = `details.html?id=${id}&type=${type}`;
      }
    });
  });
  
  // Card click for quick view
  document.querySelectorAll('.media-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type || 'movie';
      showQuickView(id, type);
    });
  });
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
    
    // Fetch movie details
    const movie = await fetchFromTMDB(`movie/${id}`);
    
    // Set modal content
    document.getElementById('modal-image').src = `${IMAGE_BASE_URL}${POSTER_SIZE}${movie.poster_path}`;
    document.getElementById('modal-title').textContent = movie.title;
    
    // Set year
    if (movie.release_date) {
      const year = new Date(movie.release_date).getFullYear();
      document.getElementById('modal-year').textContent = year;
    } else {
      document.getElementById('modal-year').textContent = 'Unknown';
    }
    
    // Set runtime
    if (movie.runtime) {
      document.getElementById('modal-runtime').textContent = `${movie.runtime} min`;
    } else {
      document.getElementById('modal-runtime').textContent = 'Unknown';
    }
    
    // Set rating
    const rating = Math.round(movie.vote_average * 10) / 10;
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
    if (movie.genres && movie.genres.length > 0) {
      movie.genres.forEach(genre => {
        const genreTag = document.createElement('span');
        genreTag.className = 'genre-tag';
        genreTag.textContent = genre.name;
        genresElement.appendChild(genreTag);
      });
    } else {
      genresElement.innerHTML = '<span class="no-genres">No genres available</span>';
    }
    
    // Set description
    document.getElementById('modal-description').textContent = movie.overview || 'No description available';
  } catch (error) {
    console.error('Error showing quick view:', error);
    document.getElementById('modal-description').textContent = 'Failed to load details. Please try again later.';
  }
}

// Close modal
function closeModal() {
  modal.classList.remove('show');
}

// Watch movie from modal
function watchMovie() {
  if (currentMediaId && currentMediaType) {
    window.location.href = `player.html?id=${currentMediaId}&type=${currentMediaType}`;
  }
}

// View movie details from modal
function viewDetails() {
  if (currentMediaId && currentMediaType) {
    window.location.href = `details.html?id=${currentMediaId}&type=${currentMediaType}`;
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
      // Search for movies only
      const movieData = await fetchFromTMDB('search/movie', { query });
      const results = movieData.results.map(item => ({ ...item, media_type: 'movie' }));
      
      displaySearchResults(results);
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
    resultItem.dataset.type = 'movie';
    
    const posterUrl = `${IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}`;
    
    resultItem.innerHTML = `
      <img src="${posterUrl}" alt="${item.title}" class="result-poster">
      <div class="result-info">
        <h3 class="result-title">${item.title}</h3>
        <p class="result-year">${item.release_date ? new Date(item.release_date).getFullYear() : 'Unknown'}</p>
        <div class="result-buttons">
          <button class="btn watch-btn"><i class="fas fa-play"></i> Watch</button>
          <button class="btn details-btn"><i class="fas fa-info-circle"></i> Details</button>
        </div>
      </div>
    `;
    
    resultItem.querySelector('.watch-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `player.html?id=${item.id}&type=movie`;
    });
    
    resultItem.querySelector('.details-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `details.html?id=${item.id}&type=movie`;
    });
    
    resultItem.addEventListener('click', () => {
      showQuickView(item.id, 'movie');
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

// Add navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});
// Initialize the application
async function init() {
  // Initialize navbar scroll
  initNavbarScroll();
  
  // Initialize search filters
  initSearchFilters();
  
  try {
    console.log('Initializing application...');
    
    // Show loading message in banner
    const banner = document.getElementById('banner');
    if (banner) {
      banner.innerHTML = `
        <div class="banner-content">
          <h1>Loading content...</h1>
          <p>Please wait while we fetch the latest media content for you.</p>
        </div>
      `;
    }
    
    // Show loading message in lists
    const lists = ['movies-list', 'top-rated-list', 'upcoming-list', 'now-playing-list', 'tv-list', 'anime-list', 'korean-list'];
    lists.forEach(listId => {
      const list = document.getElementById(listId);
      if (list) {
        list.innerHTML = '<div class="loading">Loading content...</div>';
      }
    });
    
    // Fetch trending items for banner
    console.log('Fetching trending items for banner...');
    const trendingItems = await fetchTrending();
    if (trendingItems && trendingItems.length > 0) {
      // Randomly select a trending item for the banner
      const randomIndex = Math.floor(Math.random() * Math.min(5, trendingItems.length));
      displayBanner(trendingItems[randomIndex], 'top-rated');
    } else {
      console.error('No trending items found for banner');
      // Show error message in banner
      if (banner) {
        banner.innerHTML = `
          <div class="banner-content">
            <h1>Couldn't load featured content</h1>
            <p>We're having trouble connecting to our content servers. Please try again later.</p>
          </div>
        `;
      }
    }
    
    // Fetch and display popular movies
    console.log('Fetching popular movies...');
    const popularMovies = await fetchPopularMovies();
    displayList(popularMovies, 'movies-list');
    
    // Fetch and display top rated movies
    console.log('Fetching top rated movies...');
    const topRatedMovies = await fetchTopRatedMovies();
    displayList(topRatedMovies, 'top-rated-list');
    
    // Fetch and display recently added movies
    console.log('Fetching recently added movies...');
    const recentMovies = await fetchRecentlyAddedMovies();
    displayList(recentMovies, 'upcoming-list');
    
    // Fetch and display now playing movies
    console.log('Fetching now playing movies...');
    const nowPlayingMovies = await fetchNowPlayingMovies();
    displayList(nowPlayingMovies, 'now-playing-list');
    
    // Fetch and display popular TV shows
    console.log('Fetching popular TV shows...');
    const popularTVShows = await fetchPopularTVShows();
    displayList(popularTVShows, 'tv-list');
    
    // Fetch and display anime shows
    console.log('Fetching anime shows...');
    const animeShows = await fetchAnimeTVShows();
    displayList(animeShows, 'anime-list');
    
    // Fetch and display Korean shows
    console.log('Fetching Korean shows...');
    const koreanShows = await fetchKoreanTVShows();
    displayList(koreanShows, 'korean-list');
    
    console.log('Application initialization complete');
  } catch (error) {
    console.error('Error initializing app:', error);
    
    // Show error message
    const banner = document.getElementById('banner');
    if (banner) {
      banner.innerHTML = `
        <div class="banner-content">
          <h1>Error Loading Content</h1>
          <p>We're having trouble connecting to our content servers. Please try again later.</p>
          <div class="banner-buttons">
            <button class="btn watch-btn" onclick="window.location.reload()"><i class="fas fa-sync"></i> Retry</button>
          </div>
        </div>
      `;
    }
    
    // Show error message in lists
    const lists = ['movies-list', 'top-rated-list', 'upcoming-list', 'now-playing-list', 'tv-list', 'anime-list', 'korean-list'];
    lists.forEach(listId => {
      const list = document.getElementById(listId);
      if (list) {
        list.innerHTML = '<div class="error">Error loading content. Please try again later.</div>';
      }
    });
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    closeModal();
  }
  
  const searchModal = document.getElementById('search-modal');
  if (event.target === searchModal) {
    closeSearchModal();
  }
});

// Handle escape key to close modals
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    closeSearchModal();
  }
});
