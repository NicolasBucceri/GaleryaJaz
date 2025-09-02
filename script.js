// script.js
(async () => {
  const $gallery = document.getElementById('gallery');
  const lb = document.querySelector('.lightbox');
  const lbMedia = document.querySelector('.lb-media');
  const btnClose = document.querySelector('.lb-close');
  const btnPrev  = document.querySelector('.lb-prev');
  const btnNext  = document.querySelector('.lb-next');

  let items = [];
  let idx = 0;

  async function loadData() {
    const res = await fetch('gallery.json'); // usar servidor local
    const data = await res.json();
    items = data.items || [];
  }

  function render() {
    const frag = document.createDocumentFragment();

    items.forEach((it, i) => {
      const fig = document.createElement('figure');
      fig.className = 'card';

      if (it.type === 'video') {
        const v = document.createElement('video');
        v.src = it.src;
        v.playsInline = true;
        v.muted = true;            // evita autoplay bloqueado en hover/click
        v.preload = 'metadata';
        v.loop = true;             // preview en loop
        v.addEventListener('canplay', () => {
          // reproducimos en silencio como preview (si falla, no importa)
          v.play().catch(() => {});
        });
        v.addEventListener('click', () => open(i));
        fig.appendChild(v);

        // Overlay simple de "play"
        const overlay = document.createElement('div');
        overlay.className = 'play-badge';
        overlay.setAttribute('aria-hidden', 'true');
        fig.appendChild(overlay);

      } else {
        const img = document.createElement('img');
        img.src = it.src;
        img.alt = it.alt || `Imagen ${i+1}`;
        img.loading = 'lazy';
        img.addEventListener('click', () => open(i));
        fig.appendChild(img);
      }

      frag.appendChild(fig);
    });

    $gallery.innerHTML = '';
    $gallery.appendChild(frag);
  }

  function open(i){
    idx = i;
    const it = items[idx];
    lbMedia.innerHTML = '';

    if (it.type === 'video') {
      const v = document.createElement('video');
      v.src = it.src;
      v.controls = true;
      v.autoplay = true;    // intentamos autoplay
      v.playsInline = true;
      v.style.maxWidth = '100%';

      lbMedia.appendChild(v);

      // Intento de reproducción con fallback a mute si el navegador bloquea
      const tryPlay = async () => {
        try {
          await v.play();
        } catch (e) {
          // si falla por política de autoplay, muteamos y reintentamos
          v.muted = true;
          try { await v.play(); } catch (_) {}
        }
      };
      // algunos navegadores requieren esperar a que esté listo
      if (v.readyState >= 2) tryPlay();
      else v.addEventListener('canplay', tryPlay, { once: true });

    } else {
      const img = document.createElement('img');
      img.src = it.src;
      img.alt = it.alt || '';
      lbMedia.appendChild(img);
    }

    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    btnClose.focus();
  }

  function close(){
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden','true');
    // pausar y limpiar para liberar memoria
    const media = lbMedia.querySelector('video');
    if (media) { media.pause(); }
    lbMedia.innerHTML = '';
  }

  function prev(){ open((idx - 1 + items.length) % items.length); }
  function next(){ open((idx + 1) % items.length); }

  btnClose.addEventListener('click', close);
  btnPrev .addEventListener('click', prev);
  btnNext .addEventListener('click', next);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  window.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  try{
    await loadData();
    render();
  }catch(err){
    console.error('Error cargando gallery.json', err);
    $gallery.innerHTML = '<p style="text-align:center;color:#a44;">No se pudo cargar la galería.</p>';
  }
})();
