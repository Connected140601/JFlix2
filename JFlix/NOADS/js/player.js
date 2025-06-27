const API_KEY = '84549ba3644ea15176802ec153bd9442';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_URL = 'https://image.tmdb.org/t/p/w500';

// Media types
const MEDIA_TYPES = {
  MOVIES: 'movie',
  TV: 'tv',
  ANIME: 'anime',
  KOREAN: 'korean',
  CARTOON: 'cartoon'
};

// Video server URLs
const SERVER_URLS = {
  videasy: 'https://player.videasy.net/', // Now Server 1
  '2embed': 'https://www.2embed.cc/'    // Now Server 2
};

// Global variables
let mediaId;
let mediaType;
let mediaDetails;
let recommendedMedia;
let currentServer = 'videasy'; // Default to Videasy (Server 1)

// Fetch data from TMDB API
async function fetchFromTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params
  }).toString();
  
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
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
  if (!['movie', 'tv', 'anime', 'korean', 'cartoon'].includes(mediaType)) {
    mediaType = 'movie';
  }
  
  // Ensure we're using the original player page styling for all content types
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

// Fetch recommended media
async function fetchRecommendedMedia() {
  // Determine the correct endpoint based on media type
  let endpoint;
  if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
    endpoint = `movie/${mediaId}/recommendations`;
  } else {
    endpoint = `tv/${mediaId}/recommendations`;
  }
  
  const data = await fetchFromTMDB(endpoint);
  
  if (data && data.results) {
    // Add media type to each item
    return data.results.map(item => {
      // Determine the correct media type for recommended items
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
  document.title = `JFlix - Watch ${mediaDetails.title || mediaDetails.name}`;
  
  // Set banner
  const banner = document.getElementById('movie-banner');
  if (banner && mediaDetails.backdrop_path) {
    banner.style.backgroundImage = `url(${IMG_URL}${mediaDetails.backdrop_path})`;
  }
  
  // Set title
  const title = document.getElementById('movie-title');
  if (title) title.textContent = mediaDetails.title || mediaDetails.name;
  
  // Set info year
  const infoYear = document.getElementById('info-year');
  if (infoYear) {
    const releaseDate = mediaDetails.release_date || mediaDetails.first_air_date;
    infoYear.textContent = releaseDate ? releaseDate.split('-')[0] : 'N/A';
  }
  
  // Set info runtime
  const infoRuntime = document.getElementById('info-runtime');
  if (infoRuntime) {
    if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
      infoRuntime.textContent = mediaDetails.runtime ? `${mediaDetails.runtime} min` : 'N/A';
    } else {
      const episodes = mediaDetails.number_of_episodes || 'N/A';
      const seasons = mediaDetails.number_of_seasons || 'N/A';
      infoRuntime.textContent = `${seasons} season${seasons !== 1 ? 's' : ''}, ${episodes} episode${episodes !== 1 ? 's' : ''}`;
    }
  }
  
  // Set info rating
  const infoRating = document.getElementById('info-rating');
  if (infoRating) {
    const stars = Math.round((mediaDetails.vote_average || 0) / 2);
    infoRating.innerHTML = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
  
  // Set info genres
  const infoGenres = document.getElementById('info-genres');
  const infoGenresSidebar = document.getElementById('info-genres-sidebar');
  
  if ((infoGenres || infoGenresSidebar) && mediaDetails.genres) {
    // Add media type class to genre tags
    let genreClass = '';
    if (mediaType === MEDIA_TYPES.ANIME) {
      genreClass = 'anime';
    } else if (mediaType === MEDIA_TYPES.KOREAN) {
      genreClass = 'korean';
    } else if (mediaType === MEDIA_TYPES.CARTOON) {
      genreClass = 'cartoon';
    } else if (mediaType === 'tv' || mediaType === MEDIA_TYPES.TV) {
      genreClass = 'tvshows';
    } else if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
      genreClass = 'movies';
    }
    
    // Create genre tags
    const genreTags = mediaDetails.genres.map(genre => {
      const genreTag = document.createElement('span');
      genreTag.className = `genre-tag ${genreClass}`;
      genreTag.textContent = genre.name;
      return genreTag;
    });
    
    // Add to main info
    if (infoGenres) {
      infoGenres.innerHTML = '';
      genreTags.forEach(tag => infoGenres.appendChild(tag.cloneNode(true)));
    }
    
    // Add to sidebar
    if (infoGenresSidebar) {
      infoGenresSidebar.innerHTML = '';
      genreTags.forEach(tag => infoGenresSidebar.appendChild(tag.cloneNode(true)));
    }
  }
  
  // Set player type title
  const playerTypeTitle = document.getElementById('player-type-title');
  if (playerTypeTitle) {
    if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
      playerTypeTitle.textContent = 'Movie Player';
    } else if (mediaType === MEDIA_TYPES.ANIME) {
      playerTypeTitle.textContent = 'Anime Player';
    } else if (mediaType === MEDIA_TYPES.KOREAN) {
      playerTypeTitle.textContent = 'K-Drama Player';
    } else if (mediaType === MEDIA_TYPES.CARTOON) {
      playerTypeTitle.textContent = 'Cartoon Player';
    } else {
      playerTypeTitle.textContent = 'TV Show Player';
    }
  }
  
  // Set movie info title
  const movieInfoTitle = document.querySelector('.movie-info h4');
  if (movieInfoTitle) {
    movieInfoTitle.textContent = mediaDetails.title || mediaDetails.name;
  }
  
  // Set budget/revenue or seasons/episodes
  if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
    // Set labels for movies
    const budgetLabel = document.getElementById('info-budget-label');
    if (budgetLabel) budgetLabel.textContent = 'Budget:';
    
    const revenueLabel = document.getElementById('info-revenue-label');
    if (revenueLabel) revenueLabel.textContent = 'Box Office:';
    
    const releaseDateLabel = document.querySelector('.detail-item:nth-child(1) .detail-label');
    if (releaseDateLabel) releaseDateLabel.textContent = 'Release Date:';
    
    // Set values for movies
    const budget = document.getElementById('info-budget');
    if (budget) {
      budget.textContent = mediaDetails.budget ? `$${formatNumber(mediaDetails.budget)}` : 'N/A';
    }
    
    const revenue = document.getElementById('info-revenue');
    if (revenue) {
      revenue.textContent = mediaDetails.revenue ? `$${formatNumber(mediaDetails.revenue)}` : 'N/A';
    }
    
    const releaseDate = document.querySelector('.detail-item:nth-child(1) .detail-value');
    if (releaseDate) {
      releaseDate.textContent = mediaDetails.release_date ? formatDate(mediaDetails.release_date) : 'N/A';
    }
  } else {
    // Set labels for TV shows
    const budgetLabel = document.getElementById('info-budget-label');
    if (budgetLabel) budgetLabel.textContent = 'Seasons:';
    
    const revenueLabel = document.getElementById('info-revenue-label');
    if (revenueLabel) revenueLabel.textContent = 'Episodes:';
    
    const releaseDateLabel = document.querySelector('.detail-item:nth-child(1) .detail-label');
    if (releaseDateLabel) releaseDateLabel.textContent = 'First Air Date:';
    
    // Set values for TV shows
    const budget = document.getElementById('info-budget');
    if (budget) {
      budget.textContent = mediaDetails.number_of_seasons || 'N/A';
    }
    
    const revenue = document.getElementById('info-revenue');
    if (revenue) {
      revenue.textContent = mediaDetails.number_of_episodes || 'N/A';
    }
    
    const releaseDate = document.querySelector('.detail-item:nth-child(1) .detail-value');
    if (releaseDate) {
      releaseDate.textContent = mediaDetails.first_air_date ? formatDate(mediaDetails.first_air_date) : 'N/A';
    }
  }
  
  // Set overview
  const infoOverview = document.getElementById('info-overview');
  if (infoOverview) {
    infoOverview.textContent = mediaDetails.overview || 'No overview available.';
  }
  
  // Set runtime
  const runtimeValue = document.querySelector('.detail-item:nth-child(2) .detail-value');
  if (runtimeValue) {
    if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
      runtimeValue.textContent = mediaDetails.runtime ? `${mediaDetails.runtime} min` : 'N/A';
    } else {
      const episodes = mediaDetails.number_of_episodes || 'N/A';
      const seasons = mediaDetails.number_of_seasons || 'N/A';
      runtimeValue.textContent = `${seasons} season${seasons !== 1 ? 's' : ''}, ${episodes} episode${episodes !== 1 ? 's' : ''}`;
    }
  }
  
  // Set rating
  const ratingValue = document.querySelector('.detail-item:nth-child(3) .detail-value');
  if (ratingValue) {
    ratingValue.textContent = mediaDetails.vote_average ? `${mediaDetails.vote_average.toFixed(1)}/10` : 'N/A';
  }
  
  // Set language
  const languageValue = document.querySelector('.detail-item:nth-child(4) .detail-value');
  if (languageValue) {
    const languages = mediaDetails.spoken_languages || [];
    languageValue.textContent = languages.length > 0 ? languages[0].english_name : 'N/A';
  }
  
  // Add episode selector for TV shows
  if (mediaType !== 'movie' && mediaType !== MEDIA_TYPES.MOVIES) {
    addEpisodeSelector();
  }
}

// Add episode selector for TV shows
function addEpisodeSelector() {
  if (!mediaDetails || !mediaDetails.seasons || mediaDetails.seasons.length === 0) return;
  
  // Create episode selector container
  const episodeSelector = document.createElement('div');
  episodeSelector.className = 'episode-selector';
  
  // Create heading
  const heading = document.createElement('h4');
  heading.textContent = 'Episodes';
  episodeSelector.appendChild(heading);
  
  // Create season tabs
  const seasonTabs = document.createElement('div');
  seasonTabs.className = 'season-tabs';
  
  // Add media type class
  let seasonTabClass = '';
  if (mediaType === MEDIA_TYPES.ANIME) {
    seasonTabClass = 'anime';
  } else if (mediaType === MEDIA_TYPES.KOREAN) {
    seasonTabClass = 'korean';
  } else {
    seasonTabClass = 'tvshows';
  }
  
  // Add season tabs
  mediaDetails.seasons.forEach((season, index) => {
    // Skip seasons with 0 episodes
    if (season.episode_count === 0) return;
    
    const seasonTab = document.createElement('button');
    seasonTab.className = `season-tab ${index === 0 ? 'active ' + seasonTabClass : ''}`;
    seasonTab.textContent = season.name;
    seasonTab.setAttribute('data-season', season.season_number);
    
    seasonTab.addEventListener('click', () => {
      // Remove active class from all tabs
      document.querySelectorAll('.season-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.remove(seasonTabClass);
      });
      
      // Add active class to clicked tab
      seasonTab.classList.add('active');
      seasonTab.classList.add(seasonTabClass);
      
      // Update episodes grid
      updateEpisodesGrid(season.season_number);
    });
    
    seasonTabs.appendChild(seasonTab);
  });
  
  episodeSelector.appendChild(seasonTabs);
  
  // Create episodes grid
  const episodesGrid = document.createElement('div');
  episodesGrid.className = 'episodes-grid';
  episodesGrid.id = 'episodes-grid';
  episodeSelector.appendChild(episodesGrid);
  
  // Add episode selector to player box
  const playerBox = document.querySelector('.player-box');
  const videoContainer = document.querySelector('.video-container');
  const recommendationsContainer = document.querySelector('.movie-recommendations-container');
  
  if (playerBox) {
    // First, remove the recommendations container if it exists
    if (recommendationsContainer && recommendationsContainer.parentNode) {
      recommendationsContainer.parentNode.removeChild(recommendationsContainer);
    }
    
    // Insert the episode selector right after the video container
    if (videoContainer && videoContainer.parentNode) {
      videoContainer.parentNode.insertBefore(episodeSelector, videoContainer.nextSibling);
    } else {
      // Fallback: just append to player box
      playerBox.appendChild(episodeSelector);
    }
    
    // Now add the recommendations container after the episode selector
    if (recommendationsContainer && episodeSelector.parentNode) {
      episodeSelector.parentNode.insertBefore(recommendationsContainer, episodeSelector.nextSibling);
    }
    
    // Initialize episodes grid with first season
    if (mediaDetails.seasons.length > 0) {
      const firstSeason = mediaDetails.seasons.find(season => season.episode_count > 0);
      if (firstSeason) {
        updateEpisodesGrid(firstSeason.season_number);
      }
    }
  }
}

// Update episodes grid
function updateEpisodesGrid(seasonNumber) {
  const episodesGrid = document.getElementById('episodes-grid');
  if (!episodesGrid) return;
  
  // Clear grid
  episodesGrid.innerHTML = '';
  
  // Find season
  const season = mediaDetails.seasons.find(s => s.season_number === seasonNumber);
  if (!season) return;
  
  // Add media type class
  let episodeItemClass = '';
  if (mediaType === MEDIA_TYPES.ANIME) {
    episodeItemClass = 'anime';
  } else if (mediaType === MEDIA_TYPES.KOREAN) {
    episodeItemClass = 'korean';
  } else {
    episodeItemClass = 'tvshows';
  }
  
  // Create episode items
  for (let i = 1; i <= season.episode_count; i++) {
    const episodeItem = document.createElement('button');
    episodeItem.className = `episode-item ${i === 1 ? 'active ' + episodeItemClass : ''}`;
    episodeItem.textContent = i;
    episodeItem.setAttribute('data-season', seasonNumber);
    episodeItem.setAttribute('data-episode', i);
    
    episodeItem.addEventListener('click', () => {
      // Remove active class from all episodes
      document.querySelectorAll('.episode-item').forEach(item => {
        item.classList.remove('active');
        item.classList.remove(episodeItemClass);
      });
      
      // Add active class to clicked episode
      episodeItem.classList.add('active');
      episodeItem.classList.add(episodeItemClass);
      
      // Update video player
      loadEpisode(seasonNumber, i);
    });
    
    episodesGrid.appendChild(episodeItem);
  }
}

// Load episode
function loadEpisode(seasonNumber, episodeNumber) {
  // Update video player
  loadVideo(mediaId, mediaType, seasonNumber, episodeNumber);
  
  // Update episode info in the UI
  const episodeInfo = document.getElementById('movie-info');
  if (episodeInfo) {
    let episodeTitle = '';
    
    // Customize title based on media type
    if (mediaType === MEDIA_TYPES.ANIME) {
      episodeTitle = `Episode ${episodeNumber}`;
      if (seasonNumber > 1) {
        episodeTitle = `Season ${seasonNumber} - ${episodeTitle}`;
      }
    } else if (mediaType === MEDIA_TYPES.KOREAN) {
      episodeTitle = `Episode ${episodeNumber}`;
      if (seasonNumber > 1) {
        episodeTitle = `Season ${seasonNumber} - ${episodeTitle}`;
      }
    } else {
      episodeTitle = `Season ${seasonNumber} Episode ${episodeNumber}`;
    }
    
    episodeInfo.innerHTML = `<h4 class="movie-title">${episodeTitle}</h4>`;
  }
  
  // Update active episode in UI
  document.querySelectorAll('.episode-item').forEach(item => {
    const itemSeason = parseInt(item.getAttribute('data-season'));
    const itemEpisode = parseInt(item.getAttribute('data-episode'));
    
    // Remove active class from all episodes
    item.classList.remove('active');
    item.classList.remove('anime');
    item.classList.remove('korean');
    item.classList.remove('tvshows');
    
    // Add active class to current episode
    if (itemSeason === parseInt(seasonNumber) && itemEpisode === parseInt(episodeNumber)) {
      item.classList.add('active');
      
      // Add media type class
      if (mediaType === MEDIA_TYPES.ANIME) {
        item.classList.add('anime');
      } else if (mediaType === MEDIA_TYPES.KOREAN) {
        item.classList.add('korean');
      } else {
        item.classList.add('tvshows');
      }
    }
  });
  
  // Scroll to video player
  const videoContainer = document.querySelector('.video-container');
  if (videoContainer) {
    videoContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

// Display recommended media
function displayRecommendedMedia() {
  if (!recommendedMedia) return;
  
  const recommendedContainer = document.getElementById('recommended-movies');
  if (!recommendedContainer) return;
  
  // Clear container
  recommendedContainer.innerHTML = '';
  
  // Limit to 6 items
  const limitedRecommended = recommendedMedia.slice(0, 6);
  
  // Create media cards
  limitedRecommended.forEach(item => {
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
    
    // Add click event to navigate to player
    card.addEventListener('click', () => {
      window.location.href = `player.html?id=${item.id}&type=${item.mediaType}`;
    });
    
    recommendedContainer.appendChild(card);
  });
  
  // If no recommended items with poster pictures, show message
  if (recommendedContainer.children.length === 0) {
    recommendedContainer.innerHTML = '<p>No recommendations available.</p>';
  }
}

// Load video player
function loadVideo(id, type, season = null, episode = null) {
  const videoPlayer = document.getElementById('video-player');
  const videoMessage = document.getElementById('video-message');
  
  if (!videoPlayer || !videoMessage) return;
  
  console.log('[loadVideo] Called. Initial currentServer:', currentServer, 'Season:', season, 'Episode:', episode);

  // Show loading message
  videoMessage.style.display = 'flex';
  videoPlayer.style.display = 'none';
  
  // Construct video URL based on server
  let videoUrl = '';
  
  // Get TMDB ID for the content
  const tmdbId = id;
  
  // Special handling for anime and cartoon content
  const isAnime = (type === MEDIA_TYPES.ANIME);
  const isCartoon = (type === MEDIA_TYPES.CARTOON);
  
  if (type === 'movie' || type === MEDIA_TYPES.MOVIES) {
    // Movie URL
    switch(currentServer) {
      case 'videasy':
        // Server 1: Videasy.net
        videoUrl = `${SERVER_URLS[currentServer]}movie/${tmdbId}`;
        break;
      case '2embed':
        // Server 2: 2embed.cc
        videoUrl = `${SERVER_URLS[currentServer]}embed/${tmdbId}`;
        break;
      default:
        console.warn(`[loadVideo] Unknown server '${currentServer}' for movie. Defaulting to videasy.`);
        currentServer = 'videasy';
        videoUrl = `${SERVER_URLS[currentServer]}movie/${tmdbId}`;
    }
  } else {
    // TV show URL
    if (season !== null && episode !== null) {
      switch(currentServer) {
        case 'videasy':
          // Server 1: Videasy.net
          videoUrl = `${SERVER_URLS[currentServer]}tv/${tmdbId}/${season}/${episode}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
          videoUrl += getVideasyColorParam(type, isAnime, isCartoon);
          break;
        case '2embed':
          // Server 2: 2embed.cc
          if (isAnime) {
            const animeTitle = mediaDetails?.name?.toLowerCase().replace(/\s+/g, '-');
            videoUrl = `${SERVER_URLS[currentServer]}embedanime/${animeTitle}-episode-${episode}`;
          } else if (type === MEDIA_TYPES.KOREAN || isCartoon) {
            videoUrl = `${SERVER_URLS[currentServer]}embedtv/${tmdbId}&s=${season}&e=${episode}`;
          } else {
            videoUrl = `${SERVER_URLS[currentServer]}embedtv/${tmdbId}&s=${season}&e=${episode}`;
          }
          break;
        default:
          console.warn(`[loadVideo] Unknown server '${currentServer}' for TV show episode. Defaulting to videasy.`);
          currentServer = 'videasy';
          videoUrl = `${SERVER_URLS[currentServer]}tv/${tmdbId}/${season}/${episode}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`; // Videasy requires season/episode for TV
          videoUrl += getVideasyColorParam(type, isAnime, isCartoon); // Add color param for Videasy
      }
    } else {
      // Default to season 1, episode 1 if not specified
      switch(currentServer) {
        case 'videasy':
          // Server 1: Videasy.net (defaults to S1E1)
          videoUrl = `${SERVER_URLS[currentServer]}tv/${tmdbId}/1/1?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
          videoUrl += getVideasyColorParam(type, isAnime, isCartoon);
          break;
        case '2embed':
          // Server 2: 2embed.cc
          if (isAnime) {
            const animeTitle = mediaDetails?.name?.toLowerCase().replace(/\s+/g, '-');
            videoUrl = `${SERVER_URLS[currentServer]}embedanime/${animeTitle}-episode-1`; // Default to episode 1 for anime
          } else if (type === MEDIA_TYPES.KOREAN || isCartoon) {
            videoUrl = `${SERVER_URLS[currentServer]}embedtv/${tmdbId}&s=1&e=1`; // Default to S1E1
          } else {
            videoUrl = `${SERVER_URLS[currentServer]}embedtvfull/${tmdbId}`; // Full series for other TV
          }
          break;
        default:
          console.warn(`[loadVideo] Unknown server '${currentServer}' for TV show (S1E1/full series). Defaulting to videasy.`);
          currentServer = 'videasy';
          videoUrl = `${SERVER_URLS[currentServer]}tv/${tmdbId}/1/1?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`; // Videasy default S1E1
          videoUrl += getVideasyColorParam(type, isAnime, isCartoon); // Add color param for Videasy
      }
    }
  }

  console.log(`[loadVideo] Setting video player src to: ${videoUrl} for server: ${currentServer}`);
  videoPlayer.src = videoUrl;

  // Apply sandbox and CSP attributes
  // Note: Ensure these attributes are appropriate for all servers.
  // Sandbox allows necessary functionalities while restricting others.
  videoPlayer.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
  
  // CSP for the iframe:
  // - default-src: Allows content from iframe's origin, the specific server, and other HTTPS sources.
  // - script-src: Allows scripts from same sources, plus 'unsafe-inline'/'unsafe-eval' for compatibility.
  // - style-src: Similar for styles.
  // - img-src, media-src, font-src: Allows resources from any HTTPS source and data URIs.
  // - object-src 'none': Disables plugins like Flash for better security.
  if (currentServer !== 'videasy' && currentServer !== '2embed') {
    try {
      // Ensure videoUrl is a string and a valid URL before parsing
      if (typeof videoUrl === 'string' && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
        const serverHost = new URL(videoUrl).hostname;
        videoPlayer.setAttribute('csp', `default-src 'self' https://${serverHost} https:; script-src 'self' https://${serverHost} https: 'unsafe-inline' 'unsafe-eval'; style-src 'self' https://${serverHost} https: 'unsafe-inline' 'unsafe-eval'; img-src * data:; media-src * data:; font-src * data:; object-src 'none'; frame-src *; connect-src *; child-src blob:;`);
      } else {
        console.warn("[CSP] videoUrl is not a valid HTTP(S) URL, applying generic CSP:", videoUrl);
        // Fallback CSP if videoUrl is not a standard URL (e.g. local file, data URI, or malformed)
        videoPlayer.setAttribute('csp', `default-src 'self' https:; script-src 'self' https: 'unsafe-inline' 'unsafe-eval'; style-src 'self' https: 'unsafe-inline' 'unsafe-eval'; img-src * data:; media-src * data:; font-src * data:; object-src 'none'; frame-src *; connect-src *; child-src blob:;`);
      }
    } catch (e) {
      console.error("[CSP] Error setting CSP for iframe due to URL parsing or other issue:", videoUrl, e);
      // Fallback CSP on any error during CSP construction
      videoPlayer.setAttribute('csp', `default-src 'self' https:; script-src 'self' https: 'unsafe-inline' 'unsafe-eval'; style-src 'self' https: 'unsafe-inline' 'unsafe-eval'; img-src * data:; media-src * data:; font-src * data:; object-src 'none'; frame-src *; connect-src *; child-src blob:;`);
    }
  } else {
    // CSP is intentionally not set for videasy (Premium Server 1) and 2embed (Premium Server 2)
    // We also need to ensure that any previously set CSP is removed if the server changes to one of these.
    if (videoPlayer.hasAttribute('csp')) {
      videoPlayer.removeAttribute('csp');
      console.log(`[CSP] Removed CSP for server: ${currentServer}`);
    }
  }

  // It's crucial that updateServerNoticesVisibility is called *after* any potential server changes (e.g., from fallbacks)
  // If there are onload/onerror handlers for videoPlayer that might change currentServer, 
  // this call should ideally be in those handlers or after them.
  // For now, calling it directly after setting src and after ensuring currentServer is set in defaults.
  updateServerNoticesVisibility(); 

  videoPlayer.onload = () => {
    videoMessage.style.display = 'none';
    videoPlayer.style.display = 'block';
    console.log('[loadVideo] videoPlayer loaded successfully.');
    // It might be even more robust to call it here if no errors occurred
    // updateServerNoticesVisibility(); 
  };

  videoPlayer.onerror = () => {
    console.error('[loadVideo] Error loading video player. Potentially try next server or show error.');
    videoMessage.textContent = 'Error loading video. Please try another server or check your connection.';
    videoMessage.style.display = 'flex'; // Keep message visible
    videoPlayer.style.display = 'none';
    // If you have server fallback logic, it would go here, and currentServer might change.
    // After fallback logic and setting a new src, updateServerNoticesVisibility() should be called.
  };

  // The rest of the function if any...
}

// Change server
function changeServer(server) {
  console.log('[changeServer] Attempting to change server to:', server);
  
  // Validate server (only 'videasy' and '2embed' are valid)
  if (server !== 'videasy' && server !== '2embed') {
    console.warn(`[changeServer] Invalid server '${server}'. Defaulting to videasy.`);
    server = 'videasy'; // Default to videasy (Server 1)
  }
  
  currentServer = server;
  console.log('[changeServer] currentServer is now:', currentServer);

  // Update active server button styling
  document.querySelectorAll('.server-button').forEach(button => {
    button.classList.remove('active');
    // Remove all potential media type classes to be safe
    button.classList.remove('anime', 'korean', 'movies', 'tvshows', 'cartoon'); 
  });
  
  const buttons = document.querySelectorAll('.server-button'); // These are server-videasy and server-2embed
  buttons.forEach(button => {
    button.classList.remove('active', 'anime', 'korean', 'cartoon', 'tvshows', 'movies'); // Clear all dynamic classes
    if (button.dataset.server === server) {
      button.classList.add('active');
      // Add content type class to active button
      if (mediaType === MEDIA_TYPES.ANIME) {
        button.classList.add('anime');
      } else if (mediaType === MEDIA_TYPES.KOREAN) {
        button.classList.add('korean');
      } else if (mediaType === MEDIA_TYPES.CARTOON) {
        button.classList.add('cartoon');
      } else if (mediaType === 'tv' || mediaType === MEDIA_TYPES.TV) {
        button.classList.add('tvshows');
      } else if (mediaType === 'movie' || mediaType === MEDIA_TYPES.MOVIES) {
        button.classList.add('movies');
      }
    }
  });

  // Hide all server-specific feature sections (if any, e.g., server-features div)
  document.querySelectorAll('[id$="-features"]').forEach(element => {
    element.style.display = 'none';
  });
  
  // Show features for the current server if they exist
  const serverFeatures = document.getElementById(`${server}-features`);
  if (serverFeatures) {
    serverFeatures.style.display = 'block';
  }

  // Show general loading message and hide player
  const videoPlayer = document.getElementById('video-player');
  const generalLoadingMessage = document.getElementById('loading-message'); // General loading message
  const videoMessage = document.getElementById('video-message'); // Episode-specific loading message

  if (videoPlayer) videoPlayer.style.display = 'none'; // Hide player initially

  // Reload video with new server
  if (mediaType === 'tv' || mediaType === MEDIA_TYPES.TV || 
      mediaType === MEDIA_TYPES.ANIME || mediaType === MEDIA_TYPES.KOREAN || mediaType === MEDIA_TYPES.CARTOON) {
    const seasonSelector = document.getElementById('season-selector');
    const episodeSelector = document.getElementById('episode-selector');
    let seasonToLoad, episodeToLoad;

    if (seasonSelector && episodeSelector && seasonSelector.value && episodeSelector.value) {
        seasonToLoad = seasonSelector.value;
        episodeToLoad = episodeSelector.value;
    } else {
        const activeEpisodeElement = document.querySelector('.episode-item.active');
        if (activeEpisodeElement) {
            seasonToLoad = activeEpisodeElement.getAttribute('data-season');
            episodeToLoad = activeEpisodeElement.getAttribute('data-episode');
        } else {
            seasonToLoad = 1; // Default to S1
            episodeToLoad = 1; // Default to E1
        }
    }
    
    if (videoMessage) {
      videoMessage.style.display = 'flex'; // Show episode-specific loading
      if (generalLoadingMessage) generalLoadingMessage.style.display = 'none'; // Hide general if episode-specific is shown
      videoMessage.innerHTML = `
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>Loading ${mediaType === MEDIA_TYPES.ANIME ? 'anime' : 
                     mediaType === MEDIA_TYPES.KOREAN ? 'Korean drama' : 
                     mediaType === MEDIA_TYPES.CARTOON ? 'cartoon' : 'TV show'} 
           ${(mediaType === MEDIA_TYPES.ANIME || mediaType === MEDIA_TYPES.CARTOON) ? `episode ${episodeToLoad}` : `S${seasonToLoad}:E${episodeToLoad}`} from ${server}...</p>
      `;
    }
    loadVideo(mediaId, mediaType, seasonToLoad, episodeToLoad);

  } else { // For movies
    if (videoMessage) videoMessage.style.display = 'none'; // Hide episode-specific loading
    if (generalLoadingMessage) generalLoadingMessage.style.display = 'block'; // Show general loading for movies
    loadVideo(mediaId, mediaType);
  }
  
    // Show instructional modal for Premium Server 1 (Videasy) if not dismissed in last 30 days
  if (server === 'videasy' && shouldShowServer1Modal()) {
    openServer1InfoModal();
  }
  
  // Show instructional modal for Premium Server 2 (2embed) if not dismissed in last 30 days
  if (server === '2embed' && shouldShowServer2Modal()) {
    openServer2InfoModal();
  }

  // Update server-specific notices (like Server 1 or Server 2 instructions)
  updateServerNoticesVisibility();
}

// Function to update Server notices visibility (renamed and modified from updateServer1NoticeVisibility)
function updateServerNoticesVisibility() {
  // Note: HTML IDs for notices are server2-notice (for videasy) and server3-notice (for 2embed)
  // HTML IDs for features are videasy-features and 2embed-features
  const videasyNotice = document.getElementById('server2-notice'); // Corresponds to videasy (new Server 1)
  const twoEmbedNotice = document.getElementById('server3-notice'); // Corresponds to 2embed (new Server 2)

  const videasyFeatures = document.getElementById('videasy-features');
  const twoEmbedFeatures = document.getElementById('2embed-features');

  // Hide all notices and features first
  if(videasyNotice) videasyNotice.style.display = 'none';
  if(twoEmbedNotice) twoEmbedNotice.style.display = 'none';

  if(videasyFeatures) videasyFeatures.style.display = 'none';
  if(twoEmbedFeatures) twoEmbedFeatures.style.display = 'none';

  // Show notice and features for the current server
  if (currentServer === 'videasy' && videasyNotice && videasyFeatures) {
    videasyNotice.style.display = 'flex';
    videasyFeatures.style.display = 'block';
  } else if (currentServer === '2embed' && twoEmbedNotice && twoEmbedFeatures) {
    twoEmbedNotice.style.display = 'flex';
    twoEmbedFeatures.style.display = 'block';
  }
}

// Helper function to get the color parameter for Videasy server based on content type
function getVideasyColorParam(type, isAnime, isCartoon) {
  if (isAnime) {
    return '&color=F43F5E'; // Red color for anime
  } else if (type === MEDIA_TYPES.KOREAN) {
    return '&color=10B981'; // Green color for Korean
  } else if (isCartoon) {
    return '&color=FF9900'; // Orange color for cartoons
  } else {
    return '&color=8B5CF6'; // Purple color for TV shows
  }
}

// Initialize the application
async function init() {
  // Get URL parameters
  getUrlParams();
  
  // Initialize server buttons
  initServerButtons();
  
  // Fetch media data
  try {
    // Fetch details
    mediaDetails = await fetchMediaDetails();
    // Initial update for server notices after everything is set up
    if (typeof currentServer !== 'undefined') {
      updateServerNoticesVisibility(); // Ensures correct notice on load
    }
    displayMediaDetails();
    
    // Fetch recommended media
    recommendedMedia = await fetchRecommendedMedia();
    displayRecommendedMedia();
    
    // Force episode selector to be visible for TV shows
    if (mediaType === 'tv' || mediaType === MEDIA_TYPES.TV || 
        mediaType === MEDIA_TYPES.ANIME || mediaType === MEDIA_TYPES.KOREAN || mediaType === MEDIA_TYPES.CARTOON) {
      // Make sure episode selector is properly added
      const existingSelector = document.querySelector('.episode-selector');
      if (!existingSelector) {
        addEpisodeSelector();
      }
    }
    
    // Load video player
    loadVideo(mediaId, mediaType);
  } catch (error) {
    console.error('Error initializing app:', error);
  }

  // Setup instructional video modal listeners
  const server2VideoThumb = document.getElementById('server2-instructional-video-thumb'); // For Videasy (new Server 1)
  if (server2VideoThumb) server2VideoThumb.addEventListener('click', openInstructionalVideoModal);

  const instructionalModal = document.getElementById('instructional-video-modal');
  if (instructionalModal) {
    instructionalModal.addEventListener('click', function(event) {
        if (event.target === this) { // Clicked on overlay itself
            closeInstructionalVideoModal();
        }
    });
  }
  
  const server3GifThumb = document.getElementById('server3-instructional-gif-thumb'); // For 2embed (new Server 2)
  if (server3GifThumb) server3GifThumb.addEventListener('click', openServer3GifModal);

  const server3GifModalElement = document.getElementById('server3-gif-modal');
  if (server3GifModalElement) {
    server3GifModalElement.addEventListener('click', function(event) {
        if (event.target === this) { // Clicked on overlay itself
            closeServer3GifModal();
        }
    });
  }
}

// Initialize server buttons
function initServerButtons() {
  const serverButtons = document.querySelectorAll('.server-button[data-server]');
  serverButtons.forEach(button => {
    button.addEventListener('click', () => {
      const server = button.getAttribute('data-server');
      changeServer(server);
    });
  });
  
  // Set initial active server
  changeServer(currentServer);
}

// Navigate to details page
function goToDetails() {
  if (mediaId && mediaType) {
    window.location.href = `details.html?id=${mediaId}&type=${mediaType}`;
  } else {
    window.location.href = 'index.html';
  }
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

// Key for localStorage to track dismissal timestamp
const SERVER1_MODAL_KEY = 'server1InfoDismissedAt';
const SERVER2_MODAL_KEY = 'server2InfoDismissedAt';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Determine if the modal should be shown (not dismissed within 30 days)
function shouldShowServer1Modal() {
  try {
    const stored = localStorage.getItem(SERVER1_MODAL_KEY);
    if (!stored) return true;
    const last = parseInt(stored, 10);
    if (isNaN(last)) return true;
    return Date.now() - last > THIRTY_DAYS_MS;
  } catch (e) {
    // If localStorage fails, default to showing modal
    return true;
  }
}

function acknowledgeServer1Info() {
  try {
    localStorage.setItem(SERVER1_MODAL_KEY, Date.now().toString());
  } catch (e) {
    // Ignore storage errors
  }
  closeServer1InfoModal();
}

// Modal for Premium Server 1 (Videasy) instructional info
function openServer1InfoModal() {
  const modal = document.getElementById('server1-info-modal');
  if (modal) modal.style.display = 'flex';
  // Disable page scroll while modal is open
  document.body.style.overflow = 'hidden';

  const vid = document.getElementById('server1-info-video');
  if (vid) {
    vid.currentTime = 0;
    vid.play().catch(()=>{});
  }
}

function closeServer1InfoModal() {
  const modal = document.getElementById('server1-info-modal');
  if (modal) modal.style.display = 'none';
  // Re-enable page scroll
  document.body.style.overflow = '';

  const vid = document.getElementById('server1-info-video');
  if (vid) vid.pause();
}

// Modal for Premium Server 2 (2embed) instructional info
function openServer2InfoModal() {
  const modal = document.getElementById('server2-info-modal');
  if (modal) modal.style.display = 'flex';
  // Disable page scroll while modal is open
  document.body.style.overflow = 'hidden';
}

function closeServer2InfoModal() {
  const modal = document.getElementById('server2-info-modal');
  if (modal) modal.style.display = 'none';
  // Re-enable page scroll
  document.body.style.overflow = '';
}

// Determine if the modal should be shown (not dismissed within 30 days)
function shouldShowServer2Modal() {
  try {
    const stored = localStorage.getItem(SERVER2_MODAL_KEY);
    if (!stored) return true;
    const last = parseInt(stored, 10);
    if (isNaN(last)) return true;
    return Date.now() - last > THIRTY_DAYS_MS;
  } catch (e) {
    // If localStorage fails, default to showing modal
    return true;
  }
}

function acknowledgeServer2Info() {
  try {
    localStorage.setItem(SERVER2_MODAL_KEY, Date.now().toString());
  } catch (e) {
    // Ignore storage errors
  }
  closeServer2InfoModal();
}

// Close modal when clicking outside its content
window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('server1-info-modal');
  if (modal) {
    // Prevent clicks on the dark overlay from bubbling to underlying content
    modal.addEventListener('click', (e) => {
      // If the overlay itself (not the inner content) is clicked, just stop propagation so the click
      // doesn’t hit underlying elements. Do NOT close the modal here to force users to use the X
      // or the "I understand" button.
      if (e.target === modal) {
        e.stopPropagation();
      }
    });
  }
});

// Prevent clicks on the dark overlay from propagating for Premium Server 2 modal
window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('server2-info-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        e.stopPropagation();
      }
    });
  }
});

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle escape key to close modals
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSearchModal();
  }
});

// Function to trigger the share modal with current media details
function triggerSharePlayer() {
  if (mediaDetails && mediaId && mediaType) {
    const title = mediaDetails.title || mediaDetails.name;
    const overview = mediaDetails.overview;
    const posterPath = mediaDetails.poster_path;
    // As with details.js, ensure mediaType is compatible or handled by common.js
    openShareModal(mediaId, mediaType, title, overview, posterPath);
  } else {
    console.error('Share player: Media information not available.');
    // Optionally, display a user-friendly error message
    alert('Could not retrieve share information. Please try again later.');
  }
}

// Instructional Video Modal Functions
function openInstructionalVideoModal() {
  const modal = document.getElementById('instructional-video-modal');
  const videoPlayer = document.getElementById('instructional-video-modal-player');
  if (modal) modal.style.display = 'flex';
  if (videoPlayer) {
    videoPlayer.currentTime = 0; // Restart video from the beginning
    videoPlayer.play();
  }
}

function closeInstructionalVideoModal() {
  const modal = document.getElementById('instructional-video-modal');
  const videoPlayer = document.getElementById('instructional-video-modal-player');
  if (modal) modal.style.display = 'none';
  if (videoPlayer) videoPlayer.pause();
}

// Server 3 GIF Modal Functions
function openServer3GifModal() {
  const modal = document.getElementById('server3-gif-modal');
  if (modal) modal.style.display = 'flex';
}

function closeServer3GifModal() {
  const modal = document.getElementById('server3-gif-modal');
  if (modal) modal.style.display = 'none';
}

// Function to handle episode change
async function handleEpisodeChange(seasonIndex, episodeIndex) {
  if (mediaType === MEDIA_TYPES.MOVIE) return; // No episodes for movies

  currentSeason = seasonIndex;
  currentEpisode = episodeIndex;

  console.log(`[handleEpisodeChange] Changing to Season ${currentSeason + 1}, Episode ${currentEpisode + 1}. Initial currentServer: ${currentServer}`);

  // Update the episode selector UI if it exists
  const episodeSelector = document.getElementById('episode-selector');
  if (episodeSelector) {
    episodeSelector.value = `${currentSeason}-${currentEpisode}`;
  }

  // Update the displayed episode number
  const episodeNumberDisplay = document.getElementById('episode-number');
  if (episodeNumberDisplay) {
    episodeNumberDisplay.textContent = `Episode ${currentEpisode + 1}`;
  }

  // Update the displayed season number
  const seasonNumberDisplay = document.getElementById('season-number');
  if (seasonNumberDisplay) {
    seasonNumberDisplay.textContent = `Season ${currentSeason + 1}`;
  }

  // Load the selected video
  console.log(`[handleEpisodeChange] About to call loadVideo. currentServer: ${currentServer}`);
  await loadVideo(mediaId, mediaType, currentSeason, currentEpisode);
  console.log(`[handleEpisodeChange] After loadVideo call. currentServer: ${currentServer}`);
  
  // updateServerNoticesVisibility(); // MOVED into loadVideo for better timing

  // Update Previous/Next Episode buttons state
  updateEpisodeNavButtons();

  // Save current episode to localStorage
  saveLastWatchedEpisode(mediaId, currentSeason, currentEpisode);
  console.log(`[handleEpisodeChange] Finished. currentServer: ${currentServer}`);
}

// Function to handle previous episode navigation
