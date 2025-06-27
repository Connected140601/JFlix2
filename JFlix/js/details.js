const API_KEY = '84549ba3644ea15176802ec153bd9442';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_URL = 'https://image.tmdb.org/t/p/w500';

// Media types
const MEDIA_TYPES = {
  MOVIES: 'movie',
  TV: 'tv',
  ANIME: 'anime',
  KOREAN: 'korean'
};

// Global variables
let mediaId;
let mediaType;
let mediaDetails;
let mediaCredits;
let mediaVideos;
let mediaSimilar;

// Fetch data from TMDB API
async function fetchFromTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params
  }).toString();
  
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams}`);
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error(`Error Body: ${errorBody}`);
      throw new Error(`Network response was not ok: ${response.status}. Body: ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error.message, error.stack);
    return null;
  }
}

// Get URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  mediaId = params.get('id');
  mediaType = params.get('type');
  const source = params.get('source');
  
  // Default to movie if no type specified
  if (!mediaType) mediaType = 'movie';
  
  // Validate media type
  if (!['movie', 'tv', 'anime', 'korean'].includes(mediaType)) {
    mediaType = 'movie';
  }
  
  // Ensure we're using the original details page styling for all content types
  document.querySelector('body').classList.add('original-style');
}

// Fetch media details
async function fetchMediaDetails() {
  // Determine the correct endpoint based on media type
  let endpoint;
  if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
    endpoint = `movie/${mediaId}`;
  } else {
    endpoint = `tv/${mediaId}`;
  }
  
  return await fetchFromTMDB(endpoint);
}

// Fetch media credits
async function fetchMediaCredits() {
  // Determine the correct endpoint based on media type
  let endpoint;
  if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
    endpoint = `movie/${mediaId}/credits`;
  } else {
    endpoint = `tv/${mediaId}/credits`;
  }
  
  return await fetchFromTMDB(endpoint);
}

// Fetch media videos
async function fetchMediaVideos() {
  // Determine the correct endpoint based on media type
  let endpoint;
  if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
    endpoint = `movie/${mediaId}/videos`;
  } else {
    endpoint = `tv/${mediaId}/videos`;
  }
  
  return await fetchFromTMDB(endpoint);
}

// Fetch similar media
async function fetchSimilarMedia() {
  // Determine the correct endpoint based on media type
  let endpoint;
  if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
    endpoint = `movie/${mediaId}/similar`;
  } else {
    endpoint = `tv/${mediaId}/similar`;
  }
  
  const data = await fetchFromTMDB(endpoint);
  
  if (data && data.results) {
    // Add media type to each item
    return data.results.map(item => {
      // Determine the correct media type for similar items
      let itemType;
      if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
        itemType = MEDIA_TYPES.MOVIES;
      } else if (mediaType === MEDIA_TYPES.ANIME) {
        itemType = MEDIA_TYPES.ANIME;
      } else if (mediaType === MEDIA_TYPES.KOREAN) {
        itemType = MEDIA_TYPES.KOREAN;
      } else {
        itemType = MEDIA_TYPES.TV;
      }
      
      return { ...item, mediaType: itemType };
    });
  }
  
  return [];
}

// Display media details
function displayMediaDetails() {
  if (!mediaDetails) return;
  
  // Set page title
  document.title = `JFlix - ${mediaDetails.title || mediaDetails.name}`;
  
  // Set backdrop
  const backdrop = document.getElementById('details-backdrop');
  if (backdrop && mediaDetails.backdrop_path) {
    backdrop.style.backgroundImage = `url(${IMG_URL}${mediaDetails.backdrop_path})`;
  }
  
  // Set poster
  const poster = document.getElementById('movie-poster');
  if (poster) {
    if (mediaDetails.poster_path) {
      poster.src = `${POSTER_URL}${mediaDetails.poster_path}`;
      poster.alt = mediaDetails.title || mediaDetails.name;
    } else {
      poster.src = 'img/no-poster.jpg';
      poster.alt = 'No poster available';
    }
  }
  
  // Set title
  const title = document.getElementById('movie-title');
  if (title) title.textContent = mediaDetails.title || mediaDetails.name;
  
  // Set year
  const year = document.getElementById('movie-year');
  if (year) {
    const releaseDate = mediaDetails.release_date || mediaDetails.first_air_date;
    year.textContent = releaseDate ? releaseDate.split('-')[0] : 'N/A';
  }
  
  // Set runtime
  const runtime = document.getElementById('movie-runtime');
  if (runtime) {
    if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
      runtime.textContent = mediaDetails.runtime ? `${mediaDetails.runtime} min` : 'N/A';
    } else {
      const episodes = mediaDetails.number_of_episodes || 'N/A';
      const seasons = mediaDetails.number_of_seasons || 'N/A';
      runtime.textContent = `${seasons} season${seasons !== 1 ? 's' : ''}, ${episodes} episode${episodes !== 1 ? 's' : ''}`;
    }
  }
  
  // Set rating
  const rating = document.getElementById('movie-rating');
  if (rating) {
    const stars = Math.round((mediaDetails.vote_average || 0) / 2);
    rating.innerHTML = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
  
  // Set genres
  const genres = document.getElementById('movie-genres');
  if (genres && mediaDetails.genres) {
    genres.innerHTML = '';
    
    // Add media type class to genre tags
    let genreClass = '';
    if (mediaType === MEDIA_TYPES.ANIME) {
      genreClass = 'anime';
    } else if (mediaType === MEDIA_TYPES.KOREAN) {
      genreClass = 'korean';
    } else if (mediaType === 'tv' || mediaType === MEDIA_TYPES.TV) {
      genreClass = 'tvshows';
    } else if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
      genreClass = 'movies';
    }
    
    mediaDetails.genres.forEach(genre => {
      const genreTag = document.createElement('span');
      genreTag.className = `genre-tag ${genreClass}`;
      genreTag.textContent = genre.name;
      genres.appendChild(genreTag);
    });
  }
  
  // Set tagline
  const tagline = document.getElementById('movie-tagline');
  if (tagline) {
    tagline.textContent = mediaDetails.tagline || '';
    tagline.style.display = mediaDetails.tagline ? 'block' : 'none';
  }
  
  // Set overview
  const overview = document.getElementById('movie-overview');
  if (overview) overview.textContent = mediaDetails.overview || 'No overview available.';
  
  // Set additional information
  const status = document.getElementById('movie-status');
  if (status) status.textContent = mediaDetails.status || 'N/A';
  
  const language = document.getElementById('movie-language');
  if (language) {
    const languages = mediaDetails.spoken_languages || [];
    language.textContent = languages.length > 0 ? languages.map(lang => lang.english_name).join(', ') : 'N/A';
  }
  
  // Set budget/revenue or seasons/episodes
  if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
    // Set labels for movies
    const budgetLabel = document.getElementById('movie-budget-label');
    if (budgetLabel) budgetLabel.textContent = 'Budget';
    
    const revenueLabel = document.getElementById('movie-revenue-label');
    if (revenueLabel) revenueLabel.textContent = 'Box Office';
    
    const releaseLabel = document.getElementById('movie-release-label');
    if (releaseLabel) releaseLabel.textContent = 'Release Date';
    
    // Set values for movies
    const budget = document.getElementById('movie-budget');
    if (budget) {
      budget.textContent = mediaDetails.budget ? `$${formatNumber(mediaDetails.budget)}` : 'N/A';
    }
    
    const revenue = document.getElementById('movie-revenue');
    if (revenue) {
      revenue.textContent = mediaDetails.revenue ? `$${formatNumber(mediaDetails.revenue)}` : 'N/A';
    }
    
    const release = document.getElementById('movie-release');
    if (release) {
      release.textContent = mediaDetails.release_date ? formatDate(mediaDetails.release_date) : 'N/A';
    }
  } else {
    // Set labels for TV shows
    const budgetLabel = document.getElementById('movie-budget-label');
    if (budgetLabel) budgetLabel.textContent = 'Number of Seasons';
    
    const revenueLabel = document.getElementById('movie-revenue-label');
    if (revenueLabel) revenueLabel.textContent = 'Number of Episodes';
    
    const releaseLabel = document.getElementById('movie-release-label');
    if (releaseLabel) releaseLabel.textContent = 'First Air Date';
    
    // Set values for TV shows
    const budget = document.getElementById('movie-budget');
    if (budget) {
      budget.textContent = mediaDetails.number_of_seasons || 'N/A';
    }
    
    const revenue = document.getElementById('movie-revenue');
    if (revenue) {
      revenue.textContent = mediaDetails.number_of_episodes || 'N/A';
    }
    
    const release = document.getElementById('movie-release');
    if (release) {
      release.textContent = mediaDetails.first_air_date ? formatDate(mediaDetails.first_air_date) : 'N/A';
    }
  }
  
  // Set production companies
  const companies = document.getElementById('movie-companies');
  if (companies) {
    const productionCompanies = mediaDetails.production_companies || [];
    companies.textContent = productionCompanies.length > 0 ? 
      productionCompanies.map(company => company.name).join(', ') : 'N/A';
  }
  
  // Add media type class to section headings
  const sectionHeadings = document.querySelectorAll('.details-section h2');
  sectionHeadings.forEach(heading => {
    if (mediaType === MEDIA_TYPES.ANIME) {
      heading.classList.add('anime');
    } else if (mediaType === MEDIA_TYPES.KOREAN) {
      heading.classList.add('korean');
    } else if (mediaType === 'tv' || mediaType === MEDIA_TYPES.TV) {
      heading.classList.add('tvshows');
    } else if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
      heading.classList.add('movies');
    }
  });
}

// Display media cast
function displayMediaCast() {
  if (!mediaCredits) return;
  
  const castContainer = document.getElementById('movie-cast');
  if (!castContainer) return;
  
  // Clear container
  castContainer.innerHTML = '';
  
  // Get cast (limit to 20)
  const cast = mediaCredits.cast || [];
  const limitedCast = cast.slice(0, 20);
  
  // Create cast cards
  limitedCast.forEach(person => {
    if (!person.profile_path) return;
    
    const castCard = document.createElement('div');
    castCard.className = 'cast-card';
    
    const castImage = document.createElement('img');
    castImage.className = 'cast-image';
    castImage.src = `${POSTER_URL}${person.profile_path}`;
    castImage.alt = person.name;
    
    const castName = document.createElement('div');
    castName.className = 'cast-name';
    castName.textContent = person.name;
    
    const castCharacter = document.createElement('div');
    castCharacter.className = 'cast-character';
    castCharacter.textContent = person.character || '';
    
    castCard.appendChild(castImage);
    castCard.appendChild(castName);
    castCard.appendChild(castCharacter);
    
    castContainer.appendChild(castCard);
  });
  
  // If no cast members with profile pictures, show message
  if (castContainer.children.length === 0) {
    castContainer.innerHTML = '<p>No cast information available.</p>';
  }
}

// Display media trailer
function displayMediaTrailer() {
  if (!mediaVideos) return;
  
  const trailerContainer = document.getElementById('trailer-container');
  if (!trailerContainer) return;
  
  // Clear container
  trailerContainer.innerHTML = '';
  
  // Find trailer
  const videos = mediaVideos.results || [];
  const trailer = videos.find(video => 
    video.type === 'Trailer' && video.site === 'YouTube'
  ) || videos.find(video => 
    video.site === 'YouTube'
  );
  
  if (trailer) {
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${trailer.key}`;
    iframe.allowFullscreen = true;
    
    trailerContainer.appendChild(iframe);
  } else {
    trailerContainer.innerHTML = '<p>No trailer available.</p>';
  }
}

// Display similar media
function displaySimilarMedia() {
  if (!mediaSimilar) return;
  
  const similarContainer = document.getElementById('similar-movies');
  if (!similarContainer) return;
  
  // Clear container
  similarContainer.innerHTML = '';
  
  // Limit to 12 items
  const limitedSimilar = mediaSimilar.slice(0, 12);
  
  // Create media cards
  limitedSimilar.forEach(item => {
    if (!item.poster_path) return;
    
    // Create card elements
    const card = document.createElement('div');
    card.className = 'media-card';
    
    // Add media type class
    if (item.mediaType === MEDIA_TYPES.ANIME) {
      card.classList.add('anime');
    } else if (item.mediaType === MEDIA_TYPES.KOREAN) {
      card.classList.add('korean');
    } else if (item.mediaType === MEDIA_TYPES.TV) {
      card.classList.add('tvshows');
    } else if (item.mediaType === MEDIA_TYPES.MOVIES) {
      card.classList.add('movies');
    }
    
    const posterContainer = document.createElement('div');
    posterContainer.className = 'card-poster-container';
    
    const poster = document.createElement('img');
    poster.className = 'card-poster';
    poster.src = `${POSTER_URL}${item.poster_path}`;
    poster.alt = item.title || item.name;
    
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    
    const buttons = document.createElement('div');
    buttons.className = 'card-buttons';
    
    const watchBtn = document.createElement('button');
    watchBtn.className = 'btn watch-btn';
    watchBtn.innerHTML = '<i class="fas fa-play"></i> Watch';
    watchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `player.html?id=${item.id}&type=${item.mediaType}`;
    });
    
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'btn details-btn';
    detailsBtn.innerHTML = '<i class="fas fa-info-circle"></i> Details';
    detailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `details.html?id=${item.id}&type=${item.mediaType}`;
    });
    
    buttons.appendChild(watchBtn);
    buttons.appendChild(detailsBtn);
    overlay.appendChild(buttons);
    
    const info = document.createElement('div');
    info.className = 'card-info';
    
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title || item.name;
    
    const rating = document.createElement('div');
    rating.className = 'card-rating';
    const stars = Math.round((item.vote_average || 0) / 2);
    rating.innerHTML = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    
    const year = document.createElement('p');
    year.className = 'card-year';
    const releaseDate = item.release_date || item.first_air_date;
    year.textContent = releaseDate ? releaseDate.split('-')[0] : '';
    
    info.appendChild(title);
    info.appendChild(rating);
    info.appendChild(year);
    
    posterContainer.appendChild(poster);
    posterContainer.appendChild(overlay);
    
    card.appendChild(posterContainer);
    card.appendChild(info);
    
    // Add click event to show details
    card.addEventListener('click', () => {
      window.location.href = `details.html?id=${item.id}&type=${item.mediaType}`;
    });
    
    similarContainer.appendChild(card);
  });
  
  // If no similar items with poster pictures, show message
  if (similarContainer.children.length === 0) {
    similarContainer.innerHTML = '<p>No similar content available.</p>';
  }
}

// Watch movie function
function watchMovie() {
  if (mediaId && mediaType) {
    window.location.href = `player.html?id=${mediaId}&type=${mediaType}`;
  }
}

// Play trailer in a popup modal
function playTrailer() {
  const popupModal = document.getElementById('popup-trailer-modal');
  const popupContent = popupModal.querySelector('.popup-trailer-content');
  const popupVideo = document.getElementById('popup-trailer-video');
  const exitBtn = popupModal.querySelector('.exit-modal-btn');

  if (!popupModal || !popupVideo || !exitBtn || !popupContent) {
    console.error('Trailer modal elements not found.');
    return;
  }

  // Find the best trailer or any YouTube video
  const trailer = mediaVideos?.results?.find(
    (video) => video.type === "Trailer" && video.site === "YouTube"
  ) || mediaVideos?.results?.find((video) => video.site === "YouTube");

  // Populate the modal
  if (trailer) {
    popupVideo.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    popupVideo.innerHTML = '<p class="no-trailer-text">No trailer available.</p>';
  }

  // --- Event Listeners ---
  const closeModal = () => {
    popupModal.style.opacity = '0'; // Start fade out
    setTimeout(() => {
      popupModal.style.display = 'none';
      popupVideo.innerHTML = ''; // Stop video playback
      document.body.style.overflow = 'auto'; // Restore scrolling
    }, 300); // Match CSS transition time

    // Clean up event listeners
    exitBtn.removeEventListener('click', closeModal);
    popupModal.removeEventListener('click', outsideClickListener);
  };

  const outsideClickListener = (event) => {
    // If the click is on the modal background (not the content itself)
    if (!popupContent.contains(event.target)) {
      closeModal();
    }
  };

  // Add event listeners
  exitBtn.addEventListener('click', closeModal);
  popupModal.addEventListener('click', outsideClickListener);

  // --- Show Modal ---
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  popupModal.style.display = 'flex';
  setTimeout(() => {
    popupModal.style.opacity = '1'; // Start fade in
  }, 10); // Delay to ensure display:flex is applied first
}

// This function is kept for any legacy calls, but the main logic is now self-contained.
function closePopupTrailer() {
  const popupModal = document.getElementById('popup-trailer-modal');
  if (popupModal && popupModal.style.display !== 'none') {
    // The actual closing logic is now handled by the event listeners inside playTrailer.
    // This provides a manual way to close if needed, by simulating a click on the exit button.
    const exitBtn = popupModal.querySelector('.exit-modal-btn');
    if (exitBtn) {
      exitBtn.click();
    }
  }
}

// Close trailer modal - now redirects to the popup trailer close function
function closeTrailerModal() {
  closePopupTrailer();
}

// Format number with commas
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Open search modal
function openSearchModal() {
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  
  if (searchModal) searchModal.style.display = 'block';
  if (searchInput) {
    searchInput.focus();
    searchInput.value = '';
  }
  
  // Clear previous results
  const searchResults = document.getElementById('search-results');
  if (searchResults) searchResults.innerHTML = '';
}

// Close search modal
function closeSearchModal() {
  const searchModal = document.getElementById('search-modal');
  if (searchModal) searchModal.style.display = 'none';
  
  // Clear search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
}

// Search TMDB
async function searchTMDB() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) return;
  
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.innerHTML = '';
    return;
  }
  
  // Show loading indicator
  searchResults.innerHTML = '<div class="loading">Searching...</div>';
  
  try {
    // Search for movies
    const movieData = await fetchFromTMDB('search/movie', { query });
    const movieResults = movieData.results.map(item => ({...item, mediaType: MEDIA_TYPES.MOVIES}));
    
    // Search for TV shows
    const tvData = await fetchFromTMDB('search/tv', { query });
    
    // Filter TV shows into regular, anime, and Korean
    const tvResults = [];
    const animeResults = [];
    const koreanResults = [];
    
    tvData.results.forEach(item => {
      if (item.original_language === 'ja') {
        animeResults.push({...item, mediaType: MEDIA_TYPES.ANIME});
      } else if (item.original_language === 'ko') {
        koreanResults.push({...item, mediaType: MEDIA_TYPES.KOREAN});
      } else {
        tvResults.push({...item, mediaType: MEDIA_TYPES.TV});
      }
    });
    
    // Combine all results
    let results = [
      ...movieResults,
      ...tvResults,
      ...animeResults,
      ...koreanResults
    ];
    
    // Sort by popularity
    results.sort((a, b) => b.popularity - a.popularity);
    
    // Limit to 20 results
    results = results.slice(0, 20);
    
    // Clear results
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }
    
    // Display results
    results.forEach(item => {
      if (!item.poster_path) return;
      
      // Create card elements
      const card = document.createElement('div');
      card.className = 'media-card';
      
      // Add media type class
      if (item.mediaType === MEDIA_TYPES.ANIME) {
        card.classList.add('anime');
      } else if (item.mediaType === MEDIA_TYPES.KOREAN) {
        card.classList.add('korean');
      } else if (item.mediaType === MEDIA_TYPES.TV) {
        card.classList.add('tvshows');
      } else if (item.mediaType === MEDIA_TYPES.MOVIES) {
        card.classList.add('movies');
      }
      
      const posterContainer = document.createElement('div');
      posterContainer.className = 'card-poster-container';
      
      const poster = document.createElement('img');
      poster.className = 'card-poster';
      poster.src = `${POSTER_URL}${item.poster_path}`;
      poster.alt = item.title || item.name;
      
      const overlay = document.createElement('div');
      overlay.className = 'card-overlay';
      
      const buttons = document.createElement('div');
      buttons.className = 'card-buttons';
      
      const watchBtn = document.createElement('button');
      watchBtn.className = 'btn watch-btn';
      watchBtn.innerHTML = '<i class="fas fa-play"></i> Watch';
      watchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `player.html?id=${item.id}&type=${item.mediaType}`;
      });
      
      const detailsBtn = document.createElement('button');
      detailsBtn.className = 'btn details-btn';
      detailsBtn.innerHTML = '<i class="fas fa-info-circle"></i> Details';
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `details.html?id=${item.id}&type=${item.mediaType}`;
      });
      
      buttons.appendChild(watchBtn);
      buttons.appendChild(detailsBtn);
      overlay.appendChild(buttons);
      
      const info = document.createElement('div');
      info.className = 'card-info';
      
      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = item.title || item.name;
      
      const rating = document.createElement('div');
      rating.className = 'card-rating';
      const stars = Math.round((item.vote_average || 0) / 2);
      rating.innerHTML = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      
      const year = document.createElement('p');
      year.className = 'card-year';
      const releaseDate = item.release_date || item.first_air_date;
      year.textContent = releaseDate ? releaseDate.split('-')[0] : '';
      
      info.appendChild(title);
      info.appendChild(rating);
      info.appendChild(year);
      
      posterContainer.appendChild(poster);
      posterContainer.appendChild(overlay);
      
      card.appendChild(posterContainer);
      card.appendChild(info);
      
      // Add click event to show details
      card.addEventListener('click', () => {
        window.location.href = `details.html?id=${item.id}&type=${item.mediaType}`;
      });
      
      searchResults.appendChild(card);
    });
  } catch (error) {
    console.error('Error searching:', error);
    searchResults.innerHTML = '<div class="error">Error searching. Please try again.</div>';
  }
}

// Initialize the application
async function init() {
  // Get URL parameters
  getUrlParams();
  
  // Fetch media data
  try {
    // Fetch details
    mediaDetails = await fetchMediaDetails();
    displayMediaDetails();
    
    // Fetch credits
    mediaCredits = await fetchMediaCredits();
    displayMediaCast();
    
    // Fetch videos
    mediaVideos = await fetchMediaVideos();
    displayMediaTrailer();
    
    // Fetch similar media
    mediaSimilar = await fetchSimilarMedia();
    displaySimilarMedia();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}


// Function to trigger the share modal with current media details
function triggerShareDetails() {
  if (mediaDetails && mediaId && mediaType) {
    const title = mediaDetails.title || mediaDetails.name;
    const overview = mediaDetails.overview;
    const posterPath = mediaDetails.poster_path;
    // Ensure mediaType is one of the expected values for common.js (movie, tv)
    // The details page uses 'anime' and 'korean' which might need mapping if common.js expects only 'movie' or 'tv'
    // For now, we'll pass it as is, assuming common.js or the share URLs can handle it or it defaults gracefully.
    openShareModal(mediaId, mediaType, title, overview, posterPath);
  } else {
    console.error('Share details: Media information not available.');
    // Optionally, display a user-friendly error message to the user
    alert('Could not retrieve share information. Please try again later.');
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle modal clicks
window.addEventListener('click', (e) => {
  const searchModal = document.getElementById('search-modal');
  if (e.target === searchModal) {
    closeSearchModal();
  }
});

// Handle escape key to close modals
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePopupTrailer();
    closeSearchModal();
  }
});
