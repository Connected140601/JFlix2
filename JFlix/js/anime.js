// API Configuration
const API_KEY = '84549ba3644ea15176802ec153bd9442';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const BACKDROP_SIZE = '/original';
const POSTER_SIZE = '/w500';

// Global variables
let topRatedBannerAnime = [];
let currentBannerAnimeIndex = 0;
let bannerRotationIntervalIdAnime;
const BANNER_ROTATION_DELAY_ANIME = 7000; // 7 seconds
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

// Initialize the page with Anime content
async function initializePage() {
  try {
    // Show loading indicators
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Loading content...</p></div>';
    });
    
    // Initialize banner with a featured anime
    await initializeBanner();
    
    // Load Anime lists
    await Promise.all([
      loadAnimeMovies(),
      loadPopularAnime(),
      loadTopRatedAnime(),
      loadRecentAnime(),
      loadAiringAnime()
    ]);
  } catch (error) {
    console.error('Error initializing page:', error);
    document.querySelectorAll('.list').forEach(list => {
      list.innerHTML = '<div class="error-message">Failed to load content. Please try again later.</div>';
    });
  }
}

// Function to display a specific anime in the banner
function displayBannerAnime(animeIndex) {
  if (!topRatedBannerAnime || topRatedBannerAnime.length === 0) return;

  const anime = topRatedBannerAnime[animeIndex];
  const bannerElement = document.getElementById('banner');
  
  if (anime && anime.backdrop_path) {
    bannerElement.style.backgroundImage = `url('${IMAGE_BASE_URL}${BACKDROP_SIZE}${anime.backdrop_path}')`;
  } else {
    bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))'; 
  }
  bannerElement.dataset.id = anime.id;
  bannerElement.dataset.type = 'tv'; // Anime series are 'tv' type
  
  document.getElementById('banner-title').textContent = anime.name || 'Anime Title Unavailable';
  document.getElementById('banner-overview').textContent = anime.overview ? (anime.overview.length > 200 ? anime.overview.substring(0, 200) + '...' : anime.overview) : 'Overview not available.';
}

// Function to rotate to the next banner anime
function rotateBannerAnime() {
  currentBannerAnimeIndex++;
  if (currentBannerAnimeIndex >= topRatedBannerAnime.length) {
    currentBannerAnimeIndex = 0;
  }
  displayBannerAnime(currentBannerAnimeIndex);
}

// Initialize the banner with a rotating display of top-rated anime series
async function initializeBanner() {
  try {
    // Fetch top-rated anime series for the banner
    const data = await fetchFromTMDB('discover/tv', {
      with_genres: 16, // Animation genre
      with_original_language: 'ja', // Japanese language
      sort_by: 'vote_average.desc',
      'vote_count.gte': 500, // Ensure high quality and well-known anime
      page: 1
    });

    if (!data.results || data.results.length === 0) {
      console.error('No top-rated anime series found for banner');
      // Fallback display
      const bannerElement = document.getElementById('banner');
      bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
      document.getElementById('banner-title').textContent = 'Welcome to JFlix Anime';
      document.getElementById('banner-overview').textContent = 'Explore the best anime from Japan and around the world.';
      return;
    }

    topRatedBannerAnime = data.results.slice(0, 10); // Take top 10 for rotation

    if (topRatedBannerAnime.length > 0) {
      currentBannerAnimeIndex = 0;
      displayBannerAnime(currentBannerAnimeIndex);
      
      if (bannerRotationIntervalIdAnime) {
        clearInterval(bannerRotationIntervalIdAnime);
      }
      bannerRotationIntervalIdAnime = setInterval(rotateBannerAnime, BANNER_ROTATION_DELAY_ANIME);
    } else {
      // Fallback if, after slicing, no anime are available
      const bannerElement = document.getElementById('banner');
      bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
      document.getElementById('banner-title').textContent = 'Welcome to JFlix Anime';
      document.getElementById('banner-overview').textContent = 'Explore the best anime from Japan and around the world.';
    }
  } catch (error) {
    console.error('Error initializing banner:', error);
    const bannerElement = document.getElementById('banner');
    bannerElement.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))';
    document.getElementById('banner-title').textContent = 'Welcome to JFlix Anime';
    document.getElementById('banner-overview').textContent = 'Explore the best anime from Japan and around the world.';
  }
}

// Load anime movies
async function loadAnimeMovies() {
  try {
    const data = await fetchFromTMDB('discover/movie', { 
      with_genres: 16,
      with_original_language: 'ja', // Japanese language
      sort_by: 'popularity.desc',
      page: 1,
      'vote_count.gte': 50 // Ensure we get movies with a significant number of votes
    });
    // Clearly mark these as movies for display purposes
    displayList(data.results.map(item => ({ ...item, mediaType: 'movie', isAnimeMovie: true })), 'anime-movies-list');
  } catch (error) {
    console.error('Error loading anime movies:', error);
    document.getElementById('anime-movies-list').innerHTML = '<div class="error-message">Failed to load anime movies.</div>';
  }
}

// Load popular anime
async function loadPopularAnime() {
  try {
    // First, try to get newer anime from 2023-2025
    const recentData = await fetchFromTMDB('discover/tv', { 
      with_genres: 16,
      with_original_language: 'ja',
      'first_air_date.gte': '2023-01-01',
      'first_air_date.lte': '2025-12-31',
      sort_by: 'first_air_date.desc'
    });
    
    // Then get some older popular anime to fill in if needed
    const olderData = await fetchFromTMDB('discover/tv', { 
      with_genres: 16,
      with_original_language: 'ja',
      'first_air_date.lte': '2022-12-31',
      sort_by: 'first_air_date.desc'
    });
    
    // Combine the results, ensuring newest are first
    const combinedResults = [...recentData.results, ...olderData.results];
    
    // Sort by year (newest to oldest)
    const sortedResults = combinedResults.sort((a, b) => {
      const yearA = a.first_air_date ? new Date(a.first_air_date).getFullYear() : 0;
      const yearB = b.first_air_date ? new Date(b.first_air_date).getFullYear() : 0;
      return yearB - yearA; // Sort descending (newest first)
    });
    
    // Take the first 10 results
    const limitedResults = sortedResults.slice(0, 10);
    
    // Display the sorted list
    displayList(limitedResults, 'popular-list');
  } catch (error) {
    console.error('Error loading popular anime:', error);
    document.getElementById('popular-list').innerHTML = '<div class="error-message">Failed to load popular anime.</div>';
  }
}

// Load top rated anime
async function loadTopRatedAnime() {
  try {
    // First, try to get specific popular anime by ID
    const popularAnimeIds = [
      110309, // Kaiju No. 8
      37854,  // One Piece
      30984,  // Bleach
      46260,  // Naruto
      65930,  // My Hero Academia
      114410, // Jujutsu Kaisen
      85937,  // Demon Slayer
      1429,   // Attack on Titan
      80564,  // Dragon Ball Super
      31911   // Hunter x Hunter
    ];
    
    // Create an array to store all the anime details
    const animeDetails = [];
    
    // Fetch details for each anime ID
    for (const id of popularAnimeIds) {
      try {
        const details = await fetchFromTMDB(`tv/${id}`, {});
        if (details) {
          animeDetails.push({...details, mediaType: 'tv'});
        }
      } catch (err) {
        console.warn(`Could not fetch anime with ID ${id}:`, err);
      }
    }
    
    // If we couldn't get enough specific anime, supplement with top-rated anime
    if (animeDetails.length < 5) {
      const data = await fetchFromTMDB('discover/tv', { 
        with_genres: 16,
        with_original_language: 'ja',
        sort_by: 'vote_average.desc',
        'vote_count.gte': 200
      });
      
      // Add these results to our list, avoiding duplicates
      const existingIds = animeDetails.map(anime => anime.id);
      const additionalAnime = data.results
        .filter(anime => !existingIds.includes(anime.id))
        .slice(0, 10 - animeDetails.length);
      
      animeDetails.push(...additionalAnime);
    }
    
    // Display the combined list
    displayList(animeDetails, 'top-rated-list');
  } catch (error) {
    console.error('Error loading top rated anime:', error);
    document.getElementById('top-rated-list').innerHTML = '<div class="error-message">Failed to load top rated anime.</div>';
  }
}

// Load recent anime
async function loadRecentAnime() {
  try {
    const data = await fetchFromTMDB('discover/tv', { 
      with_genres: 16,
      with_original_language: 'ja', // Japanese language
      sort_by: 'first_air_date.desc'
    });
    displayList(data.results, 'recent-list');
  } catch (error) {
    console.error('Error loading recent anime:', error);
    document.getElementById('recent-list').innerHTML = '<div class="error-message">Failed to load recent anime.</div>';
  }
}

// Load airing anime
async function loadAiringAnime() {
  try {
    // Get current date
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    // Format dates for API
    const todayStr = today.toISOString().split('T')[0];
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
    
    const data = await fetchFromTMDB('discover/tv', { 
      with_genres: 16,
      with_original_language: 'ja', // Japanese language
      'air_date.gte': oneMonthAgoStr,
      'air_date.lte': todayStr
    });
    displayList(data.results, 'airing-list');
  } catch (error) {
    console.error('Error loading airing anime:', error);
    document.getElementById('airing-list').innerHTML = '<div class="error-message">Failed to load airing anime.</div>';
  }
}

// Fetch data from TMDB API
async function fetchFromTMDB(endpoint, params = {}) {
  // Convert params with dots in keys to proper format
  const formattedParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (key.includes('.')) {
      const [mainKey, subKey] = key.split('.');
      formattedParams[`${mainKey}_${subKey}`] = value;
    } else {
      formattedParams[key] = value;
    }
  }
  
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...formattedParams
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
  // Clone the template
  const template = document.getElementById('media-card-template');
  const card = template.content.cloneNode(true);
  
  // Set poster image
  const poster = card.querySelector('.card-poster');
  if (item.poster_path) {
    poster.src = `${IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}`;
    poster.alt = item.name || item.title;
  } else {
    poster.src = 'images/no-poster.png';
    poster.alt = 'No poster available';
  }
  
  // Set title
  const title = card.querySelector('.card-title');
  title.textContent = item.name || item.title;
  
  // Set rating
  const rating = card.querySelector('.card-rating');
  const voteAverage = item.vote_average || 0;
  const stars = Math.round(voteAverage / 2);
  rating.innerHTML = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  
  // Set year
  const year = card.querySelector('.card-year');
  const date = item.first_air_date || item.release_date;
  year.textContent = date ? new Date(date).getFullYear() : 'Unknown';
  
  // Set media type (use the one provided or determine based on properties)
  const mediaType = item.mediaType || (item.first_air_date ? 'tv' : 'movie');
  
  // Add event listeners
  const watchBtn = card.querySelector('.watch-btn');
  watchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    watchMedia(item.id, mediaType);
  });
  
  const detailsBtn = card.querySelector('.details-btn');
  detailsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    viewMediaDetails(item.id, mediaType);
  });
  
  // Add click event for quick view
  const cardElement = card.querySelector('.media-card');
  cardElement.addEventListener('click', () => {
    showQuickView(item.id, mediaType);
  });
  
  // Add appropriate badge based on media type
  if (mediaType === 'movie') {
    const cardInfo = card.querySelector('.card-info');
    const movieBadge = document.createElement('span');
    movieBadge.className = 'movie-badge anime-badge';
    movieBadge.textContent = 'ANIME MOVIE';
    cardInfo.appendChild(movieBadge);
  } else if (mediaType === 'tv') {
    const cardInfo = card.querySelector('.card-info');
    const seriesBadge = document.createElement('span');
    seriesBadge.className = 'series-badge anime-badge';
    seriesBadge.textContent = 'ANIME SERIES';
    cardInfo.appendChild(seriesBadge);
  }
  
  return card;
}

// Watch an anime
function watchMedia(id, type) {
  window.location.href = `player.html?id=${id}&type=${type}`;
}

// View anime details
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
    
    // Fetch anime details
    const anime = await fetchFromTMDB(`tv/${id}`);
    
    // Set modal content
    document.getElementById('modal-image').src = `${IMAGE_BASE_URL}${POSTER_SIZE}${anime.poster_path}`;
    document.getElementById('modal-title').textContent = anime.name;
    
    // Set year
    if (anime.first_air_date) {
      const year = new Date(anime.first_air_date).getFullYear();
      document.getElementById('modal-year').textContent = year;
    } else {
      document.getElementById('modal-year').textContent = 'Unknown';
    }
    
    // Set runtime
    if (anime.episode_run_time && anime.episode_run_time.length > 0) {
      document.getElementById('modal-runtime').textContent = `${anime.episode_run_time[0]} min`;
    } else {
      document.getElementById('modal-runtime').textContent = 'Unknown';
    }
    
    // Set rating
    const rating = Math.round(anime.vote_average * 10) / 10;
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
    if (anime.genres && anime.genres.length > 0) {
      anime.genres.forEach(genre => {
        const genreTag = document.createElement('span');
        genreTag.className = 'genre-tag';
        genreTag.textContent = genre.name;
        genresElement.appendChild(genreTag);
      });
    } else {
      genresElement.innerHTML = '<span class="no-genres">No genres available</span>';
    }
    
    // Set description
    document.getElementById('modal-description').textContent = anime.overview || 'No description available';
  } catch (error) {
    console.error('Error showing quick view:', error);
    document.getElementById('modal-description').textContent = 'Failed to load details. Please try again later.';
  }
}

// Close modal
function closeModal() {
  modal.classList.remove('show');
}

// Watch featured anime
function watchFeatured() {
  const banner = document.getElementById('banner');
  const id = banner.dataset.id;
  const type = banner.dataset.type;
  if (id && type) {
    watchMedia(id, type);
  }
}

// Show featured anime details
function showFeaturedDetails() {
  const banner = document.getElementById('banner');
  const id = banner.dataset.id;
  const type = banner.dataset.type;
  if (id && type) {
    viewMediaDetails(id, type);
  }
}

// Watch anime from modal
function watchMovie() {
  if (currentMediaId && currentMediaType) {
    watchMedia(currentMediaId, currentMediaType);
  }
}

// View anime details from modal
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
      // For anime search, we'll use TV shows with anime keyword or genre
      const data = await fetchFromTMDB('search/tv', { query });
      
      // Filter results to only include anime
      const animeResults = data.results.filter(item => {
        // This is a simplified filter - in a real app, you might want to check for anime-specific genres or keywords
        // For now, we'll just use the search results as is, assuming the user is searching for anime
        return true;
      });
      
      displaySearchResults(animeResults);
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
