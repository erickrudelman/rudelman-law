(() => {
  const $ = (s) => document.querySelector(s);
  const loginView = $('#login-view');
  const appView = $('#app-view');
  let messages = [];
  let team = [];
  let filter = 'all';
  let editing = null;

  const api = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'same-origin', ...opts });
    if (res.status === 401) { showLogin(); throw new Error('unauthorized'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'error');
    return data;
  };
  const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const initials = (name) => name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const fmtDate = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' });

  // ---------- Auth ----------
  function showLogin() { appView.hidden = true; loginView.hidden = false; }

  async function boot() {
    try {
      const me = await api('../api/admin/me');
      loginView.hidden = true;
      appView.hidden = false;
      const notice = $('#email-notice');
      notice.hidden = false;
      if (me.emailConfigured) {
        notice.className = 'notice ok';
        notice.textContent = `Cada mensaje nuevo se guarda aquí y se envía por correo a ${me.notifyTo}.`;
      } else {
        notice.className = 'notice';
        notice.textContent = 'El envío por correo aún no está configurado: los mensajes se guardan solo en este panel. Configure SMTP en el archivo .env para recibirlos también por email.';
      }
      await Promise.all([loadMessages(), loadTeam()]);
    } catch (err) {
      if (err.message === 'unauthorized') return; // showLogin already called
      // No API at all: this is the static demo (e.g. GitHub Pages)
      showLogin();
      $('#login-form').querySelectorAll('input, button').forEach((x) => { x.disabled = true; });
      $('#login-msg').textContent = 'Esta es la versión de demostración del sitio. El panel de administración funciona en la versión con servidor.';
    }
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#login-msg');
    msg.textContent = '';
    const res = await fetch('../api/admin/login', json('POST', { password: e.target.password.value }));
    if (res.ok) { e.target.reset(); boot(); return; }
    const err = (await res.json().catch(() => ({}))).error;
    msg.textContent = {
      wrong_password: 'Contraseña incorrecta.',
      too_many_attempts: 'Demasiados intentos. Espere 15 minutos.',
      admin_disabled: 'El panel está deshabilitado: falta ADMIN_PASSWORD en el archivo .env del servidor.',
    }[err] || 'No se pudo iniciar sesión.';
  });

  $('#logout').addEventListener('click', async () => {
    await fetch('../api/admin/logout', { method: 'POST' });
    showLogin();
  });

  // ---------- Tabs ----------
  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.id !== `tab-${b.dataset.tab}`; });
    })
  );

  // ---------- Messages ----------
  async function loadMessages() {
    messages = await api('../api/admin/messages');
    renderMessages();
  }

  function renderMessages() {
    const unread = messages.filter((m) => !m.is_read).length;
    const badge = $('#unread-badge');
    badge.hidden = unread === 0;
    badge.textContent = unread;

    const list = $('#messages-list');
    list.innerHTML = '';
    const shown = filter === 'unread' ? messages.filter((m) => !m.is_read) : messages;
    if (!shown.length) {
      list.appendChild(el('div', 'empty', filter === 'unread' ? 'No hay mensajes sin leer.' : 'Aún no hay mensajes.'));
      return;
    }
    shown.forEach((m) => {
      const card = el('article', `message${m.is_read ? '' : ' unread'}`);
      const head = el('div', 'message-head');
      head.append(el('strong', '', m.name), el('span', 'message-meta', fmtDate(m.created_at)));
      const meta = el('div', 'message-meta');
      const mail = el('a', '', m.email); mail.href = `mailto:${m.email}`;
      meta.append(mail);
      if (m.phone) { const tel = el('a', '', m.phone); tel.href = `tel:${m.phone.replace(/[^\d+]/g, '')}`; meta.append(tel); }
      if (m.area) meta.append(el('span', 'tag', m.area));
      if (m.language) meta.append(el('span', 'tag', m.language.toUpperCase()));
      if (m.emailed) meta.append(el('span', '', '✓ enviado por correo'));

      const actions = el('div', 'message-actions');
      const reply = el('a', '', 'Responder por correo');
      reply.href = `mailto:${m.email}?subject=${encodeURIComponent('Re: Consulta — Rudelman Law')}`;
      const toggle = el('button', 'btn-link', m.is_read ? 'Marcar como no leído' : 'Marcar como leído');
      toggle.onclick = async () => {
        await api(`../api/admin/messages/${m.id}`, json('PATCH', { is_read: !m.is_read }));
        m.is_read = m.is_read ? 0 : 1;
        renderMessages();
      };
      const del = el('button', 'btn-link danger', 'Eliminar');
      del.onclick = async () => {
        if (!confirm(`¿Eliminar el mensaje de ${m.name}? Esta acción no se puede deshacer.`)) return;
        await api(`../api/admin/messages/${m.id}`, { method: 'DELETE' });
        messages = messages.filter((x) => x.id !== m.id);
        renderMessages();
      };
      actions.append(reply, toggle, del);
      card.append(head, meta, el('p', 'message-body', m.message), actions);
      list.appendChild(card);
    });
  }

  document.querySelectorAll('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderMessages();
    })
  );

  // ---------- Team ----------
  async function loadTeam() {
    team = await api('../api/admin/team');
    renderTeam();
  }

  function avatar(m, cls = 'avatar') {
    const a = el('div', cls);
    if (m.photo) { const img = el('img'); img.src = m.photo; img.alt = ''; a.appendChild(img); }
    else a.textContent = initials(m.name || '?');
    return a;
  }

  function renderTeam() {
    const list = $('#team-list');
    list.innerHTML = '';
    if (!team.length) { list.appendChild(el('div', 'empty', 'No hay miembros. Agregue el primero.')); return; }
    team.forEach((m) => {
      const row = el('div', `member-row${m.active ? '' : ' inactive'}`);
      const info = el('div');
      info.append(el('strong', '', m.name), el('small', '', `${m.role_es || m.role_en}${m.email ? ' · ' + m.email : ''}`));
      if (!m.active) info.append(el('small', '', 'Oculto en el sitio'));
      const actions = el('div', 'row-actions');
      actions.append(el('span', 'hint small', `#${m.sort_order}`));
      const edit = el('button', 'btn btn-outline', 'Editar');
      edit.onclick = () => openDialog(m);
      const del = el('button', 'btn-link danger', 'Eliminar');
      del.onclick = async () => {
        if (!confirm(`¿Eliminar a ${m.name} del equipo? Si solo quiere ocultarlo temporalmente, use "Editar" y desmarque "Visible".`)) return;
        await api(`../api/admin/team/${m.id}`, { method: 'DELETE' });
        await loadTeam();
      };
      actions.append(edit, del);
      row.append(avatar(m), info, actions);
      list.appendChild(row);
    });
  }

  const dialog = $('#member-dialog');
  const form = $('#member-form');
  const preview = $('#photo-preview');
  let removePhoto = false;

  function setPreview(src, name) {
    preview.innerHTML = '';
    if (src) { const img = el('img'); img.src = src; img.alt = ''; preview.appendChild(img); }
    else preview.textContent = initials(name || '') || '+';
    $('#remove-photo').hidden = !src;
  }

  function openDialog(m = null) {
    editing = m;
    removePhoto = false;
    form.reset();
    $('#member-msg').textContent = '';
    $('#member-dialog-title').textContent = m ? `Editar: ${m.name}` : 'Nuevo miembro';
    if (m) {
      ['name', 'role_en', 'role_es', 'email', 'phone', 'bio_en', 'bio_es', 'sort_order'].forEach((k) => { form[k].value = m[k] ?? ''; });
      form.active.checked = Boolean(m.active);
    }
    setPreview(m?.photo, m?.name);
    dialog.showModal();
  }

  $('#add-member').onclick = () => openDialog();
  $('#cancel-member').onclick = () => dialog.close();
  form.photo.addEventListener('change', () => {
    const f = form.photo.files[0];
    if (f) { removePhoto = false; setPreview(URL.createObjectURL(f)); }
  });
  $('#remove-photo').onclick = () => { removePhoto = true; form.photo.value = ''; setPreview(null, form.name.value); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    fd.set('active', form.active.checked ? '1' : '0');
    if (!form.photo.files.length) fd.delete('photo');
    if (removePhoto) fd.set('remove_photo', '1');
    try {
      await api(editing ? `../api/admin/team/${editing.id}` : '../api/admin/team', { method: editing ? 'PUT' : 'POST', body: fd });
      dialog.close();
      await loadTeam();
    } catch (err) {
      $('#member-msg').textContent = err.message === 'LIMIT_FILE_SIZE'
        ? 'La foto pesa más de 5 MB.'
        : err.message === 'name_and_role_required' ? 'Nombre y cargo (inglés) son obligatorios.' : 'No se pudo guardar.';
    }
  });

  boot();
  setInterval(() => { if (!appView.hidden) loadMessages().catch(() => {}); }, 60000);
})();
