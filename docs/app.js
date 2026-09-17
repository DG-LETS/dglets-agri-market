/* ============================================================
   DG-LETS AGRI MARKET — Landing Page JS
   ============================================================ */
'use strict';

/* ══════════════════════════════════════
   CONFIG
══════════════════════════════════════ */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyqd46JMtB_OE0HTqAmpNiQECswBwVuBRz4rFlwhOd9Bhqb4zPsNGzRwCIou2kPx1bN/exec';
const WA_NUMBER = '2348070566642';

/* ══════════════════════════════════════
   ROLE SWITCHING
══════════════════════════════════════ */
let currentRole = 'farmer';

window.switchRole = function(role) {
  currentRole = role;

  /* Update all role tabs everywhere on page */
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.role === role);
  });

  /* Show correct form, hide others — use class + style for reliability */
  document.querySelectorAll('.ea-form').forEach(form => {
    const isActive = form.dataset.role === role;
    form.classList.toggle('active-form', isActive);
    form.style.display = isActive ? 'flex' : 'none';
  });

  /* Hide success state if visible */
  const success = document.getElementById('formSuccess');
  if (success) success.style.display = 'none';
};

window.scrollToHeroForm = function() {
  const el = document.getElementById('roleSelector');
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
};

window.scrollToRegister = function() {
  const el = document.getElementById('register');
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
};

/* ══════════════════════════════════════
   NAVBAR
══════════════════════════════════════ */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10 ? '0 2px 12px rgba(0,0,0,.1)' : '';
  }, { passive: true });
}

/* ── Mobile menu ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open  = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    const spans = hamburger.querySelectorAll('span');
    if (open) {
      spans[0].style.cssText = 'transform:rotate(45deg) translate(5px,5px)';
      spans[1].style.cssText = 'opacity:0';
      spans[2].style.cssText = 'transform:rotate(-45deg) translate(5px,-5px)';
    } else { spans.forEach(s => s.style.cssText = ''); }
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => s.style.cssText = '');
    });
  });
}

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function showToast(msg, duration = 4500) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* ══════════════════════════════════════
   SHEET + LOCAL STORAGE
══════════════════════════════════════ */
async function sendToSheet(data) {
  if (!SHEET_URL) return;
  try {
    await fetch(SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userAgent: navigator.userAgent })
    });
    console.info('[DG-LETS] Signup sent ✓', data.role);
  } catch(err) {
    console.warn('[DG-LETS] Sheet send failed:', err.message);
  }
}

function saveLocally(data) {
  try {
    const list = JSON.parse(localStorage.getItem('dglets_signups') || '[]');
    list.push({ ...data, ts: new Date().toISOString() });
    localStorage.setItem('dglets_signups', JSON.stringify(list));
  } catch(_) {}
}

/* View local signups from browser console */
window.viewLocalSignups = () => {
  const list = JSON.parse(localStorage.getItem('dglets_signups') || '[]');
  console.table(list);
  return list;
};

/* ══════════════════════════════════════
   FORM VALIDATION
══════════════════════════════════════ */
function setError(el, msg) {
  el.style.borderColor = '#ef4444';
  let e = el.parentElement.querySelector('.field-error');
  if (!e) {
    e = document.createElement('span');
    e.className = 'field-error';
    e.style.cssText = 'font-size:.72rem;color:#ef4444;margin-top:3px;display:block';
    el.parentElement.appendChild(e);
  }
  e.textContent = msg;
}
function clearError(el) {
  el.style.borderColor = '';
  const e = el.parentElement.querySelector('.field-error');
  if (e) e.remove();
}
function isEmail(v)  { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function isPhone(v)  { return /^[\d\s\+\-\(\)]{7,15}$/.test(v.trim()); }
function val(id)     { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

/* ══════════════════════════════════════
   COLLECT PAYLOAD BY ROLE
══════════════════════════════════════ */
function collectPayload(role) {
  if (role === 'farmer') {
    return {
      role:         'farmer',
      name:         val('f-name'),
      phone:        val('f-phone'),
      email:        val('f-email'),
      state:        val('f-state'),
      lga:          val('f-lga'),
      farmLocation: val('f-farm-location'),
      products:     val('f-products'),
      capacity:     val('f-capacity'),
      source:       'early-access-farmer'
    };
  }
  if (role === 'buyer') {
    return {
      role:       'buyer',
      name:       val('b-name'),
      phone:      val('b-phone'),
      email:      val('b-email'),
      state:      val('b-state'),
      lga:        val('b-lga'),
      products:   val('b-products'),
      frequency:  val('b-frequency'),
      buyerType:  val('b-type'),
      source:     'early-access-buyer'
    };
  }
  if (role === 'supplier') {
    return {
      role:         'supplier',
      name:         val('s-name'),
      phone:        val('s-phone'),
      email:        val('s-email'),
      state:        val('s-state'),
      products:     val('s-products'),
      supplierType: val('s-type'),
      source:       'early-access-supplier'
    };
  }
  if (role === 'logistics') {
    return {
      role:        'logistics',
      name:        val('l-name'),
      phone:       val('l-phone'),
      email:       val('l-email'),
      state:       val('l-state'),
      coverage:    val('l-coverage'),
      vehicleType: val('l-vehicle-type'),
      capacity:    val('l-capacity'),
      source:      'early-access-logistics'
    };
  }
  return {};
}

/* ══════════════════════════════════════
   VALIDATE BY ROLE
══════════════════════════════════════ */
function validateForm(role) {
  let valid = true;
  const ids = {
    farmer:    { name:'f-name', phone:'f-phone', email:'f-email', products:'f-products', state:'f-state' },
    buyer:     { name:'b-name', phone:'b-phone', email:'b-email', products:'b-products', state:'b-state' },
    supplier:  { name:'s-name', phone:'s-phone', email:'s-email', products:'s-products', state:'s-state' },
    logistics: { name:'l-name', phone:'l-phone', email:'l-email', state:'l-state' }
  };
  const f = ids[role];

  const nameEl = document.getElementById(f.name);
  if (!nameEl.value.trim() || nameEl.value.trim().length < 2) { setError(nameEl, 'Enter your name'); valid = false; } else clearError(nameEl);

  const phoneEl = document.getElementById(f.phone);
  if (!isPhone(phoneEl.value)) { setError(phoneEl, 'Enter a valid phone number'); valid = false; } else clearError(phoneEl);

  if (f.email) {
    const emailEl = document.getElementById(f.email);
    if (!isEmail(emailEl.value)) { setError(emailEl, 'Enter a valid email or leave blank'); valid = false; } else clearError(emailEl);
  }

  const stateEl = document.getElementById(f.state);
  if (!stateEl.value) { setError(stateEl, 'Please select your state'); valid = false; } else clearError(stateEl);

  if (f.products) {
    const prodEl = document.getElementById(f.products);
    if (!prodEl.value.trim()) { setError(prodEl, 'Please fill this field'); valid = false; } else clearError(prodEl);
  }

  const consentId = role[0] + '-consent';
  const consentEl = document.getElementById(consentId);
  if (consentEl && !consentEl.checked) { setError(consentEl, 'Please agree to continue'); valid = false; } else if (consentEl) clearError(consentEl);

  return valid;
}

/* ══════════════════════════════════════
   FORM SUBMISSION HANDLER
══════════════════════════════════════ */
function buildWhatsAppMessage(payload) {
  const roleLabels = { farmer:'Farmer', buyer:'Buyer', supplier:'Supplier', logistics:'Logistics Partner' };
  const label = roleLabels[payload.role] || payload.role;
  let msg = `Hello DG-LETS, I just registered as a ${label}!\n\nName: ${payload.name}\nPhone: ${payload.phone}\nState: ${payload.state}`;
  if (payload.products) msg += `\nProducts: ${payload.products}`;
  if (payload.coverage) msg += `\nCoverage: ${payload.coverage}`;
  return encodeURIComponent(msg);
}

document.querySelectorAll('.ea-form').forEach(form => {
  /* Live clear errors */
  form.querySelectorAll('input, select').forEach(f => {
    f.addEventListener('input',  () => clearError(f));
    f.addEventListener('change', () => clearError(f));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const role = form.dataset.role;
    if (!validateForm(role)) return;

    const btn  = form.querySelector('button[type=submit]');
    const orig = btn.textContent;
    btn.textContent = 'Submitting…';
    btn.disabled = true;

    const payload = collectPayload(role);
    saveLocally(payload);
    await sendToSheet(payload);

    /* Track with GA */
    if (typeof trackSignup === 'function') trackSignup(role);

    /* Show success */
    form.style.display = 'none';
    const successEl = document.getElementById('formSuccess');
    const msgEl     = document.getElementById('successMessage');
    const waBtn     = document.getElementById('successWhatsApp');

    const msgs = {
      farmer:    "You're registered as a Farmer. We'll be in touch when we launch in your state.",
      buyer:     "You're registered as a Buyer. We'll notify you when DG-LETS launches near you.",
      supplier:  "You're registered as a Supplier. We'll reach out when the platform launches.",
      logistics: "You're registered as a Logistics Partner. We'll notify you about partnership opportunities."
    };
    if (msgEl) msgEl.textContent = msgs[role] || "We'll notify you when DG-LETS launches.";
    if (waBtn) {
      waBtn.href = `https://wa.me/${WA_NUMBER}?text=${buildWhatsAppMessage(payload)}`;
    }
    if (successEl) successEl.style.display = 'block';

    showToast(`🎉 Welcome! You're registered as a ${payload.role}.`);
    btn.textContent = orig;
    btn.disabled    = false;
  });
});

/* ══════════════════════════════════════
   FOOTER NOTIFY
══════════════════════════════════════ */
const notifyBtn = document.getElementById('notifyBtn');
if (notifyBtn) {
  notifyBtn.addEventListener('click', async () => {
    const inp = document.getElementById('footer-email');
    if (!inp.value || !isEmail(inp.value)) {
      inp.style.borderColor = '#ef4444';
      setTimeout(() => inp.style.borderColor = '', 3000);
      return;
    }
    inp.style.borderColor = '';
    const payload = { role: 'general', email: inp.value.trim(), source: 'footer-notify' };
    saveLocally(payload);
    await sendToSheet(payload);
    inp.value = '';
    notifyBtn.textContent = '✓ Done!';
    notifyBtn.style.background = '#2d7a4f';
    notifyBtn.disabled = true;
    showToast('📬 We\'ll notify you when we launch!');
    setTimeout(() => { notifyBtn.textContent = '🔔 Notify Me'; notifyBtn.style.background = ''; notifyBtn.disabled = false; }, 5000);
  });
  document.getElementById('footer-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') notifyBtn.click(); });
}

/* ══════════════════════════════════════
   SHEET HEALTH CHECK ON LOAD
══════════════════════════════════════ */
window.addEventListener('load', async () => {
  if (!SHEET_URL) return;
  try {
    const res  = await fetch(SHEET_URL);
    const json = await res.json();
    if (json.status) {
      console.info(`[DG-LETS] ✅ Sheet connected — total signups: ${json.total}`, json.counts);
    }
  } catch(_) {}
});

/* ══════════════════════════════════════
   SMOOTH SCROLL
══════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
    }
  });
});

/* ══════════════════════════════════════
   FADE-UP ANIMATIONS
══════════════════════════════════════ */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
} else {
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
}
