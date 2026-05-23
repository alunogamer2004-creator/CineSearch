//Configuração da API//
const API_KEY = 'sua_chave_de_api';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const IMG_BACKDROP = "https://image.tmdb.org/t/p/w1280"
//-- SELEÇÃO DE ELEMENTOS HTML--\\
//-- Guardamos referencias para não buscar--\\
//-- o elemento no dom toda vez que precisarmos--\\
const moviesGrid = document.getElementByID("movieGrid")
const searchInput = document.getElementById("searchinput")
const searchBtn = document.getElementById("searchbtn")
const sectionTitle = document.getElementByID("sectionTitle")
const modalOverlay = document.getElementByID("modalOverlay")
const modalContent = document.getElementByID("modalContent")
const modalClose = document.getElementByID("modalClose")
//--Funções Auxiliares--\\
//--Retorna aclasse Css der cor da badge de nota
// 7+ = Verde|5-7 = Laranja| abaixo de 5 = Vermolho--\\
function getRatingClass(rating){
    if(rating >=7) return "rating--good";
    if(rating >=5) return "rating--mid";
    return "rating--bad";
}
//Extrai apenas o anode uma data no formato"2023-05-12"
// o metodo split divide a string pelo "-" e pega o primeiro item--\\
function getYear(datestr) {
    return dateStr ? dateStr.split("-") [0] : "S/D";
}
//--Renderizar os cards de filmes na tela
//Recebe um erray de fillmes e cria os cards--\\
function renderMovies(Movies) {
    //--Limpa o grid antes de colocar novos filmes
    moviesGrid.innerHTML=""
    //- se não achar nenhum filme  deverá informar o usuario sobre o  erro ou item solicitado não encontrado
    if (movies.length===0) {
    moviesGrid.innerHTML = "<p Class=\"erro-msg\"Nenhum filme encontrado.</p>";
    return;
    }
}
// para cada filme criar um card e adicionar no grid 
movies.forEach(movie =>{
    const card = document.crieateElement("div")
    card.classlist.add("movie-card");
    

// Se o fikme não tiver poster, usar uma imagem de placeholder
const posterPath = movie.poster_path
? IMG_URL + movie.poster_path : "placeholder.jpg";
:"https://via.placeholder.com/300x450?text=Sem+Imagem";
// Montar o Html interno do card com os dados do filme
card.innerHTML = `
    <img 
    class="movie-card_poster"
    src="${posterPath}"
    alt="${movie.title}"
    loading="lazy"
    />
    <div class="movie-card_info">
        <h3 class="movie-card_title">${movie.title}</h3>
        <p class="movie-card_year">${getYear(movie.release_date)}</p>
        <span class="movie-card_rating ${getRatingClass(movie.vote_average)}">
        ${movie.vote_average.toFixed(1)}
        </span>
    </div>
`;  
// Ao clicar no card, abrir o modal com detalhes desse filme
//movie.id é o id do filme na API, que usaremos para buscar detalhes
card.addEventListener("click", () => openModal(movie.id));
moviesGrid.appendChild(card);

});
//BUSCAR FILMES POPULARES
//Chama quando a pagina carrega
//async/await forma moderna de lidar com
//operações que levam tempo como buscar dados
async function fetchPopularMovies() {
    //Mostra mensagem de carregamento enquanto busca
    moviesGrid.innerHTML = '<p class="loading">Carregando filmes...</p>';
    sectionTitle.textContent = "Filmes em alta";

    try {
        //fetch () Faz a requisição HTTP para a URL da API
        //await espera a resposta antes de continuar
        const response = await fetch(
            `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`
        );
        //.json () Converte a resposta para um objeto JavaScript
        const data = await response.json();
        //data.results é um array com os filmes
        renderMovies(data.results);
    } catch (error) {
        //Se der qualquer erro (sem internet, API fora), mostra mensagem
        moviesGrid.innerHTML = '<p class="error-msg">Erro ao carregar filmes</p>';
        console.error(error); // Imprime o erro no console do navegador
    }
}
//BUSCAR FILMES Pelo nome Digitado
async function searchMovies(query) {
    //ignora se o campo estiver vazio
    if (!query) return;
    moviesGrid.innerHTML = '<p class="loading">Buscando filmes...</p>';
    sectionTitle.textContent = `Resultados para: "${query}"`;
    try {
    //encodeURIComponent transforma o texto para fubcionar numa URL
    //ex: "Homem Aranha" vira "Homem%20Aranha"
    const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await response.json();
    renderMovies(data.results);
    } catch (error) {
        moviesGrid.innerHTML = '<p class="error-msg">Erro ao buscar filmes</p>';
        console.error(error);
    }
}
//--Abrir Modal com detalhes do filme--\\
//faz uma segunda requisição para buscar
//detalhes completos do filme selecionado\\
async function openModal(movieId) {
    //mostra carregando e exibe o modal
    modalContent.innerHTML = '<p class="loading">Carregando detalhes...</p>';
    modalOverlay.classList.add("active"); //mosta o overlay do modal\\
    try {
        //Busca detalhes do filme pela API usando o ID\\
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`
        );
        const movie = await response.json();
        //geral a imagem de backdrop (foto paramica do filme)
        const backdropPath = movie.backdrop_path
        ? IMG_BACKDROP + movie.backdrop_path 
        :"";
        //movies.genres é um array de objetos:[{id:28,name:"Ação"},...]
        //map() transforma esse array em um array de nomes: ["Ação","Aventura",...]
        const genres = movie.genres
        .map(g =>´< span class="genre-tag">${g.name}</span>`)
        .join("");
        //Montar o conteudo completo do modal
        modalContent.innerHTML = 
        ${backdropPath ? `<img class="modal-backdrop" src="${backdropPath}" 
        alt="${movie.title}">` : ""}
        <div class="modal-body">
            <h2 class="modal-title">${movie.title}</h2>
            <p class="modal-meta">
            ${getYear(movie.release_date)} • ${movie.runtime} min
            </p>
            <div class="modal-genres">${genres}</div>
            <p class="modal-overview">${movie.overview||"Sinopse não disponível."}</p>
        </div>
        `;
    } catch (error) {
        modalContent.innerHTML = '<p class="error-msg">Erro ao carregar detalhes</p>';
        console.error(error);
    }
}
        //fechar o modal ao clicar no X ou fora do conteudo
        function closeModal() {
        modalOverlay.classList.remove("active");//esconde o overlay
        modalContent.innerHTML = ""; //limpa o conteudo 
    }
//--Eventos--\\
//Ao clicar no botão de busca, chama a função de busca com o valor do input
searchBtn.addEventListener("click", () => {
    searchMovies(searchInput.value);
});
//ao precionar enter no campo de busca, também chama a função de busca
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchMovies(searchInput.value);
    }
});
//btn x dentro do modal
modalClose.addEventListener("click", closeModal);
//clique fora do modal( no fundo escuro) tambem fecha
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});
//--Iniciar a aplicação buscando os filmes populares--\\
fetchPopularMovies();   
