(() => {
  const YEARS = new Date().getFullYear() - 1989;

  const PRACTICE_AREAS = [
    { key: 'Condominium Law', en: ['Condominium Law', 'Condominium regimes, bylaws and administration.'], es: ['Derecho Condominal', 'Régimen de condominio, reglamentos y administración.'] },
    { key: 'Corporate & Commercial Law', en: ['Corporate & Commercial Law', 'Company formation, contracts and ongoing corporate counsel.'], es: ['Derecho Corporativo y Comercial', 'Constitución de sociedades, contratos y asesoría corporativa.'] },
    { key: 'Criminal Law', en: ['Criminal Law', 'Defense and representation before Costa Rican courts.'], es: ['Derecho Penal', 'Defensa y representación ante los tribunales.'] },
    { key: 'Family Law', en: ['Family Law', 'Marriage, divorce, custody and estate matters.'], es: ['Derecho de Familia', 'Matrimonio, divorcio, custodia y sucesiones.'] },
    { key: 'Free Trade Zones', en: ['Free Trade Zones', 'Regime applications and compliance for FTZ companies.'], es: ['Zonas Francas', 'Trámites de ingreso al régimen y cumplimiento.'] },
    { key: 'Intellectual Property', en: ['Intellectual Property', 'Trademark registration and protection.'], es: ['Propiedad Intelectual', 'Registro y protección de marcas.'] },
    { key: 'Labor Law', en: ['Labor Law', 'Employment contracts, disputes and compliance.'], es: ['Derecho Laboral', 'Contratos laborales, conflictos y cumplimiento.'] },
    { key: 'Maritime Terrestrial Zone', en: ['Maritime Terrestrial Zone', 'Beachfront concessions and coastal property.'], es: ['Zona Marítimo Terrestre', 'Concesiones y propiedad en zona costera.'] },
    { key: 'Mergers & Acquisitions', en: ['Mergers & Acquisitions', 'Due diligence, structuring and closing.'], es: ['Fusiones y Adquisiciones', 'Due diligence, estructuración y cierre.'] },
    { key: 'Migratory Law', en: ['Immigration Law', 'Residency, permits and relocation to Costa Rica.'], es: ['Derecho Migratorio', 'Residencias, permisos y reubicación en Costa Rica.'] },
    { key: 'Notary Services', en: ['Notary Services', 'Public deeds, certifications and authentications.'], es: ['Servicios Notariales', 'Escrituras públicas, certificaciones y autenticaciones.'] },
    { key: 'Real Estate', en: ['Real Estate', 'Purchases, sales, title review and closings.'], es: ['Bienes Raíces', 'Compraventas, estudios registrales y cierres.'] },
    { key: 'Tourism', en: ['Tourism', 'Legal support for hospitality and tourism projects.'], es: ['Turismo', 'Asesoría legal para proyectos turísticos y hoteleros.'] },
    { key: 'Accounting Services', en: ['Accounting Services', 'Bookkeeping and accounting for your business.'], es: ['Servicios Contables', 'Contabilidad para su empresa.'] },
    { key: 'Tax Planning Services', en: ['Tax Planning Services', 'Tax structuring and planning in Costa Rica.'], es: ['Planificación Fiscal', 'Estructuración y planificación tributaria.'] },
  ];

  const PLACES = ['San José', 'Tamarindo', 'Nosara', 'Flamingo', 'Marbella', 'Papagayo', 'Las Catalinas', 'Islita',
    'Manzanillo', 'Playa Hermosa', 'Santa Teresa', 'Malpaís', 'Cabuya', 'Montezuma', 'Cóbano', 'Tambor',
    'Puntarenas', 'Quepos', 'Dominical', 'Uvita', 'Ojochal', 'Pavones', 'Monteverde', 'Arenal', 'Puerto Viejo'];

  const I18N = {
    en: {
      'nav.about': 'About', 'nav.practice': 'Practice Areas', 'nav.team': 'Our Team', 'nav.contact': 'Contact',
      'hero.eyebrow': 'San José · Costa Rica · Est. 1989',
      'hero.title': 'Providing legal advisory in Costa Rica since 1989.',
      'hero.lead': 'Our bilingual team combines local knowledge with an international outlook, supporting clients at every stage of their legal and business journey. Whether you are investing, relocating, or expanding in Costa Rica, we guarantee a smooth, secure, and successful experience.',
      'hero.cta': 'Start Now', 'hero.cta2': 'Explore our Practice Areas',
      'stats.years': 'Years of experience', 'stats.areas': 'Practice areas',
      'stats.langs': 'Languages: Spanish, English & Hebrew', 'stats.coverage': 'Nationwide coverage',
      'about.eyebrow': 'Founded in 1989',
      'about.title': 'Rudelman Law Firm & Associates',
      'about.p1': 'Rudelman Law Firm attorneys advise clients on local transactions in many areas of law. We are committed to long term relations with our clients and friends. We are a teamwork firm seeking innovation in our practice every day, and we deliver the best we can in our professional services.',
      'about.p2': 'Rudelman Law Firm and Associates has more than {years} years of experience in the field, offering outstanding legal service to all of our customers in most areas of law.',
      'values.knowledge': 'Knowledge', 'values.initiative': 'Initiative', 'values.integrity': 'Integrity', 'values.commitment': 'Commitment',
      'services.eyebrow': 'Services',
      'services.title': 'Commercial law & real estate, handled with care.',
      'services.sub': 'We specialize in commercial law and real estate management, providing tailored legal solutions. Trust us to handle the complexities of both fields.',
      'services.law': 'Law',
      'services.lawText': 'Corporate, commercial, notary, immigration, labor, family and more — the full practice under one roof.',
      'services.lawCta': 'Explore our Practice Areas',
      'services.re': 'Real Estate',
      'services.reText': 'Due diligence, purchases, condominiums and maritime terrestrial zone concessions, from San José to the coast.',
      'services.reCta': 'Ask about properties',
      'practice.eyebrow': 'Practice Areas',
      'practice.title': 'Explore all law branches we practice.',
      'practice.sub': "Ask us about our practice areas or tell us any of your concerns and we'll get back to you immediately. At Rudelman & Associates we are delighted to help our clients in all of their matters.",
      'practice.cta': 'Contact Us',
      'coverage.eyebrow': 'Where we work',
      'coverage.title': 'From San José to every coast.',
      'coverage.text': 'We provide extensive legal and business advisory services across Costa Rica, covering areas from San José to the Pacific and Caribbean coasts, and other locations.',
      'team.eyebrow': 'Our Team', 'team.title': 'Our Team Members', 'team.empty': 'Team information coming soon.',
      'contact.eyebrow': 'Get in touch with us now', 'contact.title': 'Contact Us',
      'contact.sub': 'Get in touch with us and let us know any kind of concern or question you have.',
      'contact.langs': 'Send us a message in Spanish, English or Hebrew.',
      'contact.address': 'Address', 'contact.phone': 'Phone',
      'form.name': 'Name', 'form.phone': 'Phone', 'form.area': 'Practice area', 'form.areaAny': 'General inquiry',
      'form.message': 'Message', 'form.placeholder': 'Type your message here...', 'form.submit': 'Submit',
      'form.sending': 'Sending…',
      'form.ok': 'Thank you — your message has been sent. We will get back to you shortly.',
      'form.mailto': 'Your email app has opened with your message ready — just press send.',
      'form.invalid': 'Please enter your name, a valid email and a message.',
      'form.rate': 'Too many messages in a short time. Please try again later or call us.',
      'form.err': 'Something went wrong. Please email recepcion@rudelmanlaw.com or call +506 2290-5021.',
      'footer.tag': 'Legal and business advisory in Costa Rica since 1989.',
    },
    es: {
      'nav.about': 'Nosotros', 'nav.practice': 'Áreas de Práctica', 'nav.team': 'Equipo', 'nav.contact': 'Contacto',
      'hero.eyebrow': 'San José · Costa Rica · Desde 1989',
      'hero.title': 'Asesoría legal en Costa Rica desde 1989.',
      'hero.lead': 'Nuestro equipo bilingüe combina conocimiento local con una visión internacional, acompañando a nuestros clientes en cada etapa de su camino legal y empresarial. Ya sea que esté invirtiendo, mudándose o expandiéndose en Costa Rica, le garantizamos una experiencia fluida, segura y exitosa.',
      'hero.cta': 'Comience Ahora', 'hero.cta2': 'Ver Áreas de Práctica',
      'stats.years': 'Años de experiencia', 'stats.areas': 'Áreas de práctica',
      'stats.langs': 'Idiomas: español, inglés y hebreo', 'stats.coverage': 'Cobertura nacional',
      'about.eyebrow': 'Fundado en 1989',
      'about.title': 'Rudelman Law Firm & Asociados',
      'about.p1': 'Los abogados de Rudelman Law Firm asesoran a sus clientes en transacciones locales en múltiples áreas del derecho. Estamos comprometidos con relaciones a largo plazo con nuestros clientes y amigos. Somos un bufete que trabaja en equipo y busca innovar en su práctica cada día, dando lo mejor en nuestros servicios profesionales.',
      'about.p2': 'Rudelman Law Firm y Asociados cuenta con más de {years} años de experiencia, ofreciendo un servicio legal sobresaliente a todos nuestros clientes en la mayoría de las áreas del derecho.',
      'values.knowledge': 'Conocimiento', 'values.initiative': 'Iniciativa', 'values.integrity': 'Integridad', 'values.commitment': 'Compromiso',
      'services.eyebrow': 'Servicios',
      'services.title': 'Derecho comercial y bienes raíces, con dedicación.',
      'services.sub': 'Nos especializamos en derecho comercial y gestión de bienes raíces, brindando soluciones legales a la medida. Confíe en nosotros para manejar las complejidades de ambas áreas.',
      'services.law': 'Derecho',
      'services.lawText': 'Corporativo, comercial, notarial, migratorio, laboral, familia y más — toda la práctica en un solo lugar.',
      'services.lawCta': 'Ver Áreas de Práctica',
      'services.re': 'Bienes Raíces',
      'services.reText': 'Due diligence, compraventas, condominios y concesiones en zona marítimo terrestre, de San José a la costa.',
      'services.reCta': 'Consultar propiedades',
      'practice.eyebrow': 'Áreas de Práctica',
      'practice.title': 'Todas las ramas del derecho que practicamos.',
      'practice.sub': 'Consúltenos sobre nuestras áreas de práctica o cuéntenos su inquietud y le responderemos de inmediato. En Rudelman & Asociados nos complace ayudar a nuestros clientes en todos sus asuntos.',
      'practice.cta': 'Contáctenos',
      'coverage.eyebrow': 'Dónde trabajamos',
      'coverage.title': 'De San José a todas las costas.',
      'coverage.text': 'Brindamos amplios servicios de asesoría legal y empresarial en todo Costa Rica, desde San José hasta las costas del Pacífico y el Caribe, y otras localidades.',
      'team.eyebrow': 'Nuestro Equipo', 'team.title': 'Miembros del Equipo', 'team.empty': 'Información del equipo próximamente.',
      'contact.eyebrow': 'Contáctenos ahora', 'contact.title': 'Contáctenos',
      'contact.sub': 'Escríbanos y cuéntenos cualquier inquietud o consulta que tenga.',
      'contact.langs': 'Escríbanos en español, inglés o hebreo.',
      'contact.address': 'Dirección', 'contact.phone': 'Teléfono',
      'form.name': 'Nombre', 'form.phone': 'Teléfono', 'form.area': 'Área de práctica', 'form.areaAny': 'Consulta general',
      'form.message': 'Mensaje', 'form.placeholder': 'Escriba su mensaje aquí...', 'form.submit': 'Enviar',
      'form.sending': 'Enviando…',
      'form.ok': 'Gracias — su mensaje fue enviado. Le responderemos a la brevedad.',
      'form.mailto': 'Se abrió su aplicación de correo con el mensaje listo — solo presione enviar.',
      'form.invalid': 'Por favor indique su nombre, un correo válido y un mensaje.',
      'form.rate': 'Demasiados mensajes en poco tiempo. Intente más tarde o llámenos.',
      'form.err': 'Ocurrió un error. Escríbanos a recepcion@rudelmanlaw.com o llame al +506 2290-5021.',
      'footer.tag': 'Asesoría legal y empresarial en Costa Rica desde 1989.',
    },
  };

  let saved = null;
  try { saved = localStorage.getItem('rl_lang'); } catch { /* storage unavailable */ }
  let lang = I18N[saved] ? saved : (navigator.language || '').startsWith('es') ? 'es' : 'en';

  const t = (key) => (I18N[lang][key] ?? I18N.en[key] ?? key).replace('{years}', YEARS);
  let teamCache = [];

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    renderPractice();
    renderTeam();
  }

  // ---------- Practice areas ----------
  function renderPractice() {
    const grid = document.getElementById('practice-grid');
    grid.innerHTML = '';
    PRACTICE_AREAS.forEach((a) => {
      const [title, desc] = a[lang];
      const li = document.createElement('li');
      li.className = 'reveal in';
      li.innerHTML = `<a href="#contact"><h3></h3><p></p></a>`;
      li.querySelector('h3').textContent = title;
      li.querySelector('p').textContent = desc;
      li.querySelector('a').dataset.area = a.key;
      grid.appendChild(li);
    });

    const select = document.getElementById('area-select');
    const current = select.value;
    select.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
    PRACTICE_AREAS.forEach((a) => select.add(new Option(a[lang][0], a.key)));
    select.value = current;
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-area]');
    if (link) document.getElementById('area-select').value = link.dataset.area;
  });

  // ---------- Places ----------
  const places = document.getElementById('places');
  PLACES.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = p;
    if (i === 0) li.className = 'hl';
    places.appendChild(li);
  });

  // ---------- Team ----------
  const initials = (name) => name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  function renderTeam() {
    const grid = document.getElementById('team-grid');
    if (!teamCache.length) {
      grid.innerHTML = `<p class="team-empty">${t('team.empty')}</p>`;
      return;
    }
    grid.innerHTML = '';
    teamCache.forEach((m) => {
      const card = document.createElement('article');
      card.className = 'member';
      const photo = m.photo
        ? `<img src="${encodeURI(m.photo)}" alt="" loading="lazy">`
        : `<div class="monogram" aria-hidden="true"></div>`;
      card.innerHTML = `
        <div class="member-photo">${photo}</div>
        <div class="member-body">
          <h3></h3>
          <p class="member-role"></p>
          <p class="member-bio" hidden></p>
          <div class="member-contact"></div>
        </div>`;
      if (!m.photo) card.querySelector('.monogram').textContent = initials(m.name);
      else card.querySelector('img').alt = m.name;
      card.querySelector('h3').textContent = m.name;
      card.querySelector('.member-role').textContent = lang === 'es' ? m.role_es || m.role_en : m.role_en;
      const bio = lang === 'es' ? m.bio_es || m.bio_en : m.bio_en || m.bio_es;
      if (bio) { const b = card.querySelector('.member-bio'); b.textContent = bio; b.hidden = false; }
      const contact = card.querySelector('.member-contact');
      if (m.email) { const a = document.createElement('a'); a.href = `mailto:${m.email}`; a.textContent = m.email; contact.appendChild(a); }
      if (m.phone) { const a = document.createElement('a'); a.href = `tel:${m.phone.replace(/[^\d+]/g, '')}`; a.textContent = m.phone; contact.appendChild(a); }
      grid.appendChild(card);
    });
  }

  // With the Node server the team comes from the database; on a static host
  // (GitHub Pages) there is no API, so fall back to the exported team.json.
  const getJson = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));
  getJson('api/team')
    .catch(() => getJson('team.json'))
    .then((rows) => { teamCache = rows; renderTeam(); })
    .catch(() => renderTeam());

  // Static hosting: open the visitor's email app with the message pre-filled
  function sendByEmail(data) {
    const area = PRACTICE_AREAS.find((a) => a.key === data.area);
    const subject = `${lang === 'es' ? 'Consulta web' : 'Website inquiry'} — ${data.name}${area ? ` (${area[lang][0]})` : ''}`;
    const body = [`${t('form.name')}: ${data.name}`, `Email: ${data.email}`, data.phone ? `${t('form.phone')}: ${data.phone}` : null, '', data.message]
      .filter((l) => l !== null).join('\n');
    window.location.href = `mailto:recepcion@rudelmanlaw.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // ---------- Contact form ----------
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.language = lang;
    status.className = 'form-status';
    if (!data.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.message.trim().length < 5) {
      status.textContent = t('form.invalid');
      status.classList.add('err');
      return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = t('form.sending');
    try {
      const res = await fetch('api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Our API always answers JSON; anything else means a static host with no server
      if (!(res.headers.get('content-type') || '').includes('application/json')) {
        sendByEmail(data);
        status.textContent = t('form.mailto');
        status.classList.add('ok');
      } else if (res.ok) {
        form.reset();
        status.textContent = t('form.ok');
        status.classList.add('ok');
      } else {
        status.textContent = t(res.status === 429 ? 'form.rate' : res.status === 400 ? 'form.invalid' : 'form.err');
        status.classList.add('err');
      }
    } catch {
      status.textContent = t('form.err');
      status.classList.add('err');
    } finally {
      btn.disabled = false;
      btn.textContent = t('form.submit');
    }
  });

  // ---------- Header, menu, language ----------
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  document.querySelectorAll('.lang button').forEach((b) =>
    b.addEventListener('click', () => {
      lang = b.dataset.lang;
      try { localStorage.setItem('rl_lang', lang); } catch { /* ignore */ }
      applyLang();
    })
  );

  // Active nav link
  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...nav.querySelectorAll('a')];
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.hash === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObserver.observe(s));

  // Reveal on scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  document.querySelectorAll('[data-years]').forEach((el) => { el.textContent = YEARS; });
  document.getElementById('year').textContent = new Date().getFullYear();
  applyLang();
})();
