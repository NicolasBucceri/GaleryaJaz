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
    const res = await fetch('gallery.json', { cache: 'no-store' });
    const data = await res.json();
    items = data.items || [];
  }

  // Precarga garantizando dimensiones antes del render
  async function preloadAll() {
    const preloaders = items.map((it) => {
      if (it.type === 'video') {
        return new Promise((resolve) => {
          const v = document.createElement('video');
          v.src = it.src;
          v.preload = 'metadata';
          v.addEventListener('loadedmetadata', () => resolve(), { once: true });
          v.addEventListener('error', () => resolve(), { once: true }); // no bloqueamos
        });
      } else {
        return new Promise((resolve) => {
          const img = new Image();
          if (it.width)  img.width  = it.width;
          if (it.height) img.height = it.height;
          img.src = it.src;
          img.addEventListener('load', async () => {
            // decode asegura que el bitmap esté listo y no “parpadee”
            try { await img.decode(); } catch (_) {}
            resolve();
          }, { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }
    });
    await Promise.all(preloaders);
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
        v.muted = true;
        v.loop = true;
        v.preload = 'metadata';
        v.addEventListener('canplay', () => v.play().catch(() => {}));
        v.addEventListener('click', () => open(i));
        fig.appendChild(v);

        const overlay = document.createElement('div');
        overlay.className = 'play-badge';
        overlay.setAttribute('aria-hidden', 'true');
        fig.appendChild(overlay);

      } else {
        const img = document.createElement('img');
        img.src = it.src;
        img.alt = it.alt || `Imagen ${i+1}`;
        // No usamos lazy en el primer render para evitar que no entren en viewport
        if (it.width)  img.width  = it.width;   // si tu JSON los trae, mejor
        if (it.height) img.height = it.height;
        img.decoding = 'async';
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
      v.autoplay = true;
      v.playsInline = true;
      v.style.maxWidth = '100%';
      lbMedia.appendChild(v);

      const tryPlay = async () => {
        try { await v.play(); }
        catch { v.muted = true; try { await v.play(); } catch(_){} }
      };
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
    const media = lbMedia.querySelector('video');
    if (media) media.pause();
    lbMedia.innerHTML = '';
  }

  const prev = () => open((idx - 1 + items.length) % items.length);
  const next = () => open((idx + 1) % items.length);

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
    await preloadAll();  // 👈 clave para que aparezca TODO de una
    render();
  }catch(err){
    console.error('Error cargando gallery.json', err);
    $gallery.innerHTML = '<p style="text-align:center;color:#a44;">No se pudo cargar la galería.</p>';
  }
})();
