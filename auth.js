const accountButton = document.getElementById('accountBtn');
let client;
let currentUser;
if (!accountButton) {
  const favoritesButton = document.getElementById('favoritesBtn');
  const button = document.createElement('button');
  const actions = document.createElement('div');
  button.id = 'accountBtn';
  button.type = 'button';
  button.className = 'favorites-btn';
  button.textContent = 'Entrar';
  actions.style.display = 'flex';
  actions.style.gap = '.6rem';
  favoritesButton?.parentNode?.insertBefore(actions, favoritesButton);
  actions.append(button, favoritesButton);
}

function notify(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('active');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('active'), 3000);
}

function setAccountButton() {
  const button = document.getElementById('accountBtn');
  if (!button) return;
  button.textContent = currentUser ? 'Sair' : 'Entrar';
  button.title = currentUser ? 'Conta conectada: ' + currentUser.email : 'Entre para sincronizar sua lista';
}

async function loadRemoteFavorites() {
  if (!client || !currentUser) return;
  const { data, error } = await client.from('watchlist').select('movie').order('created_at', { ascending: false });
  if (error) return notify('Nao foi possivel carregar sua lista online.');
  document.dispatchEvent(new CustomEvent('cinesearch:replaceFavorites', { detail: data.map(item => item.movie) }));
}

async function syncFavorites(movies) {
  if (!client || !currentUser) return;
  const { error: deleteError } = await client.from('watchlist').delete().eq('user_id', currentUser.id);
  if (deleteError) return notify('Nao foi possivel sincronizar sua lista.');
  if (!movies.length) return;
  const rows = movies.map(movie => ({
    user_id: currentUser.id,
    media_id: movie.id,
    media_type: movie.media_type || (movie.first_air_date ? 'tv' : 'movie'),
    movie
  }));
  const { error } = await client.from('watchlist').upsert(rows);
  if (error) notify('Nao foi possivel sincronizar sua lista.');
}

async function configureAuth() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      document.getElementById('accountBtn')?.classList.add('hidden');
      return;
    }
    const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client = module.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data: { session } } = await client.auth.getSession();
    currentUser = session?.user;
    setAccountButton();
    if (currentUser) await loadRemoteFavorites();
    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user;
      setAccountButton();
      if (currentUser) loadRemoteFavorites();
    });
  } catch {
    document.getElementById('accountBtn')?.classList.add('hidden');
  }
}

document.getElementById('accountBtn')?.addEventListener('click', async () => {
  if (!client) return;
  if (currentUser) {
    await client.auth.signOut();
    notify('Voce saiu da conta.');
    return;
  }
  const email = window.prompt('Digite seu e-mail para receber um link de acesso:');
  if (!email) return;
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  notify(error ? 'Nao foi possivel enviar o link de acesso.' : 'Confira seu e-mail para entrar.');
});

document.addEventListener('cinesearch:favorites', event => syncFavorites(event.detail));
configureAuth();
