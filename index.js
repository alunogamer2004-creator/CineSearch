const API='/api/tmdb';
const IMG='https://image.tmdb.org/t/p';
const $=id=>document.getElementById(id);
const el={grid:$('movieGrid'),title:$('sectionTitle'),count:$('resultCount'),hero:$('hero'),heroTitle:$('heroTitle'),heroOverview:$('heroOverview'),heroMeta:$('heroMeta'),modal:$('modalOverlay'),modalContent:$('modalContent'),favorites:$('favoritesSection'),favoritesGrid:$('favoritesGrid'),favoritesCount:$('favoritesCount'),loadMore:$('loadMoreBtn'),toast:$('toast')};
let state={page:1,totalPages:1,mode:'trending',genre:null,query:'',year:'',rating:'0',sort:'popularity.desc',items:[],heroItems:[],heroIndex:0,heroTimer:null};
let favorites=JSON.parse(localStorage.getItem('cinesearch:favorites')||'[]');

const titleOf=m=>m.title||m.name||'Sem título';
const dateOf=m=>m.release_date||m.first_air_date||'';
const typeOf=m=>m.media_type||(m.first_air_date?'tv':'movie');
const yearOf=m=>dateOf(m)?.slice(0,4)||'—';
const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const api=async(path,params={})=>{
 const query=new URLSearchParams({path,language:'pt-BR',...params});
 const res=await fetch(API+'?'+query);
 const data=await res.json().catch(()=>({}));
 if(!res.ok||data.success===false)throw new Error(data.error||data.status_message||'Falha na API');
 return data;
};
function toast(message){el.toast.textContent=message;el.toast.classList.add('active');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.toast.classList.remove('active'),2500)}
function isFavorite(id,type){return favorites.some(x=>x.id===id&&typeOf(x)===type)}
function saveFavorites(){localStorage.setItem('cinesearch:favorites',JSON.stringify(favorites));el.favoritesCount.textContent=favorites.length}
function toggleFavorite(movie){
 const type=typeOf(movie),index=favorites.findIndex(x=>x.id===movie.id&&typeOf(x)===type);
 if(index>=0){favorites.splice(index,1);toast('Removido da sua lista')}else{favorites.push({...movie,media_type:type});toast('Adicionado à sua lista')}
 saveFavorites();renderMovies(state.items,el.grid);if(!el.favorites.classList.contains('hidden'))renderFavorites();
}
function card(movie){
 const type=typeOf(movie),poster=movie.poster_path?IMG+'/w500'+movie.poster_path:'';
 const node=document.createElement('article');node.className='movie-card';node.tabIndex=0;
 node.innerHTML='<div class="poster">'+(poster?'<img src="'+poster+'" alt="Pôster de '+safe(titleOf(movie))+'" loading="lazy">':'<div class="state">Sem imagem</div>')+'<span class="type">'+(type==='tv'?'Série':'Filme')+'</span><button class="fav '+(isFavorite(movie.id,type)?'active':'')+'" aria-label="Favoritar">♥</button></div><div class="movie-info"><h3>'+safe(titleOf(movie))+'</h3><div class="movie-meta"><span>'+yearOf(movie)+'</span><span class="rating">★ '+Number(movie.vote_average||0).toFixed(1)+'</span></div></div>';
 node.querySelector('.fav').onclick=e=>{e.stopPropagation();toggleFavorite(movie)};
 const open=()=>openDetails(movie.id,type);node.onclick=open;node.onkeydown=e=>{if(e.key==='Enter')open()};
 return node;
}
function renderMovies(items,target=el.grid,append=false){
 if(!append)target.innerHTML='';
 if(!items.length&&!append){target.innerHTML='<div class="state"><div><h3>Nada encontrado</h3><p>Tente outro título ou categoria.</p></div></div>';return}
 items.forEach(m=>target.appendChild(card(m)));
}
function loading(){el.grid.innerHTML='<div class="state"><div><h3>Preparando a sessão…</h3><p>Buscando os melhores títulos.</p></div></div>'}
function endpoint(){
 if(state.query)return ['/search/multi',{query:state.query,page:state.page,include_adult:false}];
 if(state.genre||state.year||state.rating!=='0'){
  const type=state.mode==='series'?'tv':'movie';
  const params={with_genres:state.genre||'',sort_by:state.sort,page:state.page,'vote_average.gte':state.rating,'vote_count.gte':50};
  if(state.year)params[type==='tv'?'first_air_date_year':'primary_release_year']=state.year;
  return ['/discover/'+type,params];
 }
 const paths={trending:'/trending/all/week',popular:'/movie/popular',top_rated:'/movie/top_rated',now_playing:'/movie/now_playing',series:'/tv/popular'};
 return [paths[state.mode],{page:state.page}];
}
async function load(reset=true){
 if(reset){state.page=1;state.items=[];loading()}
 try{
  const [path,params]=endpoint(),data=await api(path,params);
  const valid=(data.results||[]).filter(x=>(x.media_type||'')!=='person');
  state.items.push(...valid);state.totalPages=Math.min(data.total_pages||1,500);
  renderMovies(valid,el.grid,!reset);
  el.count.textContent=data.total_results?data.total_results.toLocaleString('pt-BR')+' títulos':'';
  el.loadMore.classList.toggle('hidden',state.page>=state.totalPages);
 }catch(e){el.grid.innerHTML='<div class="state"><div><h3>Não foi possível carregar</h3><p>Verifique sua conexão e tente novamente.</p></div></div>';toast('Erro ao acessar o catálogo')}
}
async function setHero(index){
 const m=state.heroItems[index];if(!m)return;state.heroIndex=index;
 el.hero.style.backgroundImage='url('+(m.backdrop_path?IMG+'/original'+m.backdrop_path:'')+')';
 el.heroTitle.textContent=titleOf(m);el.heroOverview.textContent=m.overview||'Descubra mais sobre este título.';
 el.heroMeta.innerHTML='<span>'+yearOf(m)+'</span> <span>★ '+Number(m.vote_average||0).toFixed(1)+'</span> <span>'+(typeOf(m)==='tv'?'Série':'Filme')+'</span>';
}
async function loadHero(){try{const d=await api('/trending/all/week');state.heroItems=d.results.filter(x=>x.backdrop_path).slice(0,5);setHero(0);state.heroTimer=setInterval(()=>setHero((state.heroIndex+1)%state.heroItems.length),8000)}catch(e){}}
async function trailer(id,type){
 try{const d=await api('/'+type+'/'+id+'/videos');const v=d.results.find(x=>x.site==='YouTube'&&x.type==='Trailer')||d.results.find(x=>x.site==='YouTube');if(v)window.open('https://www.youtube.com/watch?v='+v.key,'_blank','noopener');else toast('Trailer não disponível')}catch(e){toast('Trailer não disponível')}
}
async function openDetails(id,type){
 el.modal.classList.add('active');document.body.style.overflow='hidden';el.modalContent.innerHTML='<div class="state">Carregando detalhes…</div>';
 try{
  const [m,p]=await Promise.all([api('/'+type+'/'+id,{append_to_response:'videos'}),api('/'+type+'/'+id+'/watch/providers').catch(()=>({results:{}}))]);
  m.media_type=type;const trailerData=m.videos?.results?.find(x=>x.site==='YouTube'&&x.type==='Trailer');
  const providers=p.results?.BR?.flatrate||[];const backdrop=m.backdrop_path?IMG+'/original'+m.backdrop_path:'';
  el.modalContent.innerHTML=(backdrop?'<div class="modal-hero" style="background-image:url('+backdrop+')"></div>':'')+'<div class="modal-body"><h2>'+safe(titleOf(m))+'</h2><div class="modal-meta"><span>'+yearOf(m)+'</span><span>★ '+Number(m.vote_average||0).toFixed(1)+'</span>'+(m.runtime?'<span>'+m.runtime+' min</span>':'')+'</div><div class="genres">'+(m.genres||[]).map(g=>'<span class="genre">'+safe(g.name)+'</span>').join('')+'</div><p class="overview">'+safe(m.overview||'Sinopse não disponível.')+'</p><div class="modal-actions">'+(trailerData?'<button class="btn primary" id="modalTrailer">▶ Trailer</button>':'')+'<button class="btn glass" id="modalFav">♥ '+(isFavorite(m.id,type)?'Remover da lista':'Minha lista')+'</button><button class="btn glass" id="shareBtn">Compartilhar</button></div>'+(providers.length?'<div class="providers">'+providers.map(x=>'<img src="'+IMG+'/w92'+x.logo_path+'" title="'+safe(x.provider_name)+'" alt="'+safe(x.provider_name)+'">').join('')+'</div>':'')+'</div>';
  if(trailerData)$('modalTrailer').onclick=()=>window.open('https://www.youtube.com/watch?v='+trailerData.key,'_blank','noopener');
  $('modalFav').onclick=()=>{toggleFavorite(m);openDetails(id,type)};
  $('shareBtn').onclick=async()=>{const data={title:titleOf(m),text:'Confira '+titleOf(m)+' no CineSearch',url:location.href};if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);toast('Link copiado')}};
 }catch(e){el.modalContent.innerHTML='<div class="state">Não foi possível abrir os detalhes.</div>'}
}
function closeModal(){el.modal.classList.remove('active');document.body.style.overflow=''}
function renderFavorites(){renderMovies(favorites,el.favoritesGrid)}
function activate(btn){document.querySelectorAll('.category-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active')}
$('searchForm').onsubmit=e=>{e.preventDefault();const q=$('searchInput').value.trim();if(!q)return;state.query=q;state.genre=null;el.title.textContent='Resultados para “'+q+'”';document.querySelectorAll('.category-btn').forEach(x=>x.classList.remove('active'));load();$('catalogo').scrollIntoView()};
$('categories').onclick=e=>{const b=e.target.closest('button');if(!b)return;activate(b);state.query='';$('searchInput').value='';state.genre=b.dataset.genre||null;state.mode=b.dataset.feed||'genre';el.title.textContent=b.textContent;load()};
$('loadMoreBtn').onclick=()=>{state.page++;load(false)};
$('favoritesBtn').onclick=()=>{el.favorites.classList.toggle('hidden');renderFavorites();if(!el.favorites.classList.contains('hidden'))el.favorites.scrollIntoView({behavior:'smooth'})};
$('clearFavorites').onclick=()=>{if(confirm('Limpar toda a sua lista?')){favorites=[];saveFavorites();renderFavorites();renderMovies(state.items)}};
$('homeBtn').onclick=()=>{state.query='';state.genre=null;state.mode='trending';el.title.textContent='Em alta hoje';load();scrollTo({top:0,behavior:'smooth'})};
$('modalClose').onclick=closeModal;el.modal.onclick=e=>{if(e.target===el.modal)closeModal()};document.onkeydown=e=>{if(e.key==='Escape')closeModal()};
$('watchTrailerBtn').onclick=()=>{const m=state.heroItems[state.heroIndex];if(m)trailer(m.id,typeOf(m))};
$('heroDetailsBtn').onclick=()=>{const m=state.heroItems[state.heroIndex];if(m)openDetails(m.id,typeOf(m))};
$('scrollTopBtn').onclick=()=>scrollTo({top:0,behavior:'smooth'});
addEventListener('scroll',()=>{document.querySelector('.header').classList.toggle('scrolled',scrollY>30);$('scrollTopBtn').classList.toggle('active',scrollY>600)});
$('filtersForm').onsubmit=e=>{
 e.preventDefault();
 state.year=$('yearFilter').value;
 state.rating=$('ratingFilter').value;
 state.sort=$('sortFilter').value;
 state.query='';
 $('searchInput').value='';
 el.title.textContent='Catálogo filtrado';
 load();
};
$('resetFilters').onclick=()=>{
 state.year='';state.rating='0';state.sort='popularity.desc';
 setTimeout(()=>load(),0);
};
let installPrompt;
addEventListener('beforeinstallprompt',e=>{
 e.preventDefault();installPrompt=e;$('installBtn').classList.remove('hidden');
});
$('installBtn').onclick=async()=>{
 if(!installPrompt)return;
 installPrompt.prompt();
 await installPrompt.userChoice;
 installPrompt=null;$('installBtn').classList.add('hidden');
};
if('serviceWorker' in navigator){
 addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js'));
}
saveFavorites();loadHero();load();