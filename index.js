// CONFIGURAÇÃO DA API
const API_KEY = '24ded06990d52d8ab9b38688c377916d';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const IMG_BACKDROP = "https://image.tmdb.org/t/p/w1280";

// SELEÇÃO DOS ELEMENTOS HTML
const moviesGrid = document.getElementById("movieGrid");
const searchInput = document.getElementById("searchinput");
const searchBtn = document.getElementById("searchbtn");
const sectionTitle = document.getElementById("sectionTitle");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

// FUNÇÕES AUXILIARES

// Cor da nota
function getRatingClass(rating) {
    if (rating >= 7) return "rating--good";
    if (rating >= 5) return "rating--mid";
    return "rating--bad";
}

// Extrai ano da data
function getYear(dateStr) {
    return dateStr ? dateStr.split("-")[0] : "S/D";
}

// RENDERIZAR FILMES
function renderMovies(movies) {

    moviesGrid.innerHTML = "";

    // Se não achar filmes
    if (movies.length === 0) {
        moviesGrid.innerHTML =
            '<p class="erro-msg">Nenhum filme encontrado.</p>';
        return;
    }

    // Criar card de cada filme
    movies.forEach(movie => {

        const card = document.createElement("div");
        card.classList.add("movie-card");

        // Poster
        const posterPath = movie.poster_path
            ? IMG_URL + movie.poster_path
            : "https://via.placeholder.com/300x450?text=Sem+Imagem";

        card.innerHTML = `
            <img
                class="movie-poster"
                src="${posterPath}"
                alt="${movie.title}"
                loading="lazy"
            />

            <div class="movie-info">

                <h3 class="movie-title">
                    ${movie.title}
                </h3>

                <p class="movie-card_year">
                    ${getYear(movie.release_date)}
                </p>

                <span class="movie-card_rating ${getRatingClass(movie.vote_average)}">
                    ${movie.vote_average.toFixed(1)}
                </span>

            </div>
        `;

        // Abrir modal
        card.addEventListener("click", () => {
            openModal(movie.id);
        });

        moviesGrid.appendChild(card);
    });
}

// BUSCAR FILMES POPULARES
async function fetchPopularMovies() {

    moviesGrid.innerHTML =
        '<p class="loading">Carregando filmes...</p>';

    sectionTitle.textContent = "Filmes em alta";

    try {

        const response = await fetch(
            `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`
        );

        const data = await response.json();

        renderMovies(data.results);

    } catch (error) {

        moviesGrid.innerHTML =
            '<p class="erro-msg">Erro ao carregar filmes</p>';

        console.error(error);
    }
}

// BUSCAR FILME POR NOME
async function searchMovies(query) {

    if (!query.trim()) return;

    moviesGrid.innerHTML =
        '<p class="loading">Buscando filmes...</p>';

    sectionTitle.textContent =
        `Resultados para: "${query}"`;

    try {

        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`
        );

        const data = await response.json();

        renderMovies(data.results);

    } catch (error) {

        moviesGrid.innerHTML =
            '<p class="erro-msg">Erro ao buscar filmes</p>';

        console.error(error);
    }
}

// MODAL DETALHES
async function openModal(movieId) {

    modalContent.innerHTML =
        '<p class="loading">Carregando detalhes...</p>';

    modalOverlay.classList.add("active");

    try {

        const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`
        );

        const movie = await response.json();

        const backdropPath = movie.backdrop_path
            ? IMG_BACKDROP + movie.backdrop_path
            : "";

        const genres = movie.genres
            .map(g => `<span class="genre-tag">${g.name}</span>`)
            .join("");

        modalContent.innerHTML = `
            ${backdropPath
                ? `<img class="backdrop" src="${backdropPath}" alt="${movie.title}">`
                : ""
            }

            <div class="modal_body">

                <h2 class="modal_title">
                    ${movie.title}
                </h2>

                <p class="modal_meta">
                    ${getYear(movie.release_date)}
                    • ${movie.runtime} min
                </p>

                <div class="modal_genre">
                    ${genres}
                </div>

                <p class="modal_overview">
                    ${movie.overview || "Sinopse não disponível."}
                </p>

            </div>
        `;

    } catch (error) {

        modalContent.innerHTML =
            '<p class="erro-msg">Erro ao carregar detalhes</p>';

        console.error(error);
    }
}

// FECHAR MODAL
function closeModal() {
    modalOverlay.classList.remove("active");
    modalContent.innerHTML = "";
}

// EVENTOS

// Botão pesquisar
searchBtn.addEventListener("click", () => {
    searchMovies(searchInput.value);
});

// Enter no input
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchMovies(searchInput.value);
    }
});

// Fechar modal no X
modalClose.addEventListener("click", closeModal);

// Fechar clicando fora
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Iniciar app
fetchPopularMovies();
