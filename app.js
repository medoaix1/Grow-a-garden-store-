/* =========================================================
   app.js — Grow a Garden Store (client)
   - Local login (demo)
   - Firestore integration (real-time)
   - Product CRUD (add/delete if owner)
   - Create requests (buyer -> seller)
   - Copy contact, open links
   - Toast messages & error handling
   ========================================================= */

/* ==================== config ==================== */
/* حط بيانات مشروعك هنا من Firebase Console */
const firebaseConfig = {
  apiKey: "AIzaSyBfYXZSGeO7BuoK52EhzKZ0OwwtVq7evNU",
  authDomain: "grow-a-garden-store-dd311.firebaseapp.com",
  projectId: "grow-a-garden-store-dd311",
  storageBucket: "grow-a-garden-store-dd311.firebasestorage.app",
  messagingSenderId: "103687407251",
  appId: "1:103687407251:web:c3bb07c2c74f33ce48af66",
  measurementId: "G-S057Y620T0"
};

/* ==================== Firebase Init ==================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==================== Cached DOM ==================== */
const $ = id => document.getElementById(id);

const authScreen = $('authScreen');
const nicknameInput = $('nickname');
const emailInput = $('email');
const btnLogin = $('btnLogin');
const userArea = $('userArea');
const userNick = $('userNick');
const btnLogout = $('btnLogout');
const btnAddProduct = $('btnAddProduct');
const addFormCard = $('addFormCard');
const saveProduct = $('saveProduct');
const cancelAdd = $('cancelAdd');
const productsList = $('productsList');
const emptyMsg = $('emptyMsg');
const requestsSection = $('requestsSection');
const requestsList = $('requestsList');
const toast = $('toast');

/* ==================== Helpers ==================== */
function showToast(msg, t = 2200) {
  if (!toast) {
    console.log('[TOAST]', msg);
    return;
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.style.display = 'none', t);
}

function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/* ==================== Product Management ==================== */
async function loadProducts() {
  productsList.innerHTML = '';
  const querySnapshot = await getDocs(collection(db, "products"));
  if (querySnapshot.empty) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';
  querySnapshot.forEach(docSnap => {
    const product = docSnap.data();
    const li = document.createElement('li');
    li.textContent = `${escapeHtml(product.name)} - ${escapeHtml(product.price)}`;
    productsList.appendChild(li);
  });
}

async function addProduct(name, price) {
  try {
    await addDoc(collection(db, "products"), { name, price });
    showToast('تمت إضافة المنتج');
    loadProducts();
  } catch (error) {
    console.error('Error adding product:', error);
    showToast('حدث خطأ أثناء الإضافة');
  }
}

/* ==================== Auth Events ==================== */
btnLogin?.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  const email = emailInput.value.trim();
  if (!nickname || !email) {
    showToast('يرجى إدخال جميع البيانات');
    return;
  }
  authScreen.style.display = 'none';
  userArea.style.display = 'block';
  userNick.textContent = nickname;
  showToast(`مرحباً ${nickname}`);
});

btnLogout?.addEventListener('click', () => {
  authScreen.style.display = 'block';
  userArea.style.display = 'none';
  nicknameInput.value = '';
  emailInput.value = '';
  showToast('تم تسجيل الخروج');
});

/* ==================== Init ==================== */
document.addEventListener('DOMContentLoaded', loadProducts);
  function copyToClipboard(text){
    if(!text) return Promise.reject('no text');
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise((res,rej)=>{
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); document.body.removeChild(ta); res(); }catch(e){ document.body.removeChild(ta); rej(e); }
    });
  }

  /* ==================== state ==================== */
  let currentUser = null;

  /* ==================== auth handlers ==================== */
  btnLogin && btnLogin.addEventListener('click', ()=> {
    const nick = nicknameInput?.value.trim();
    const email = emailInput?.value.trim();
    console.log('[app] login attempt', {nick, email});
    if(!nick || !email){ showToast('اكتب الاسم المستعار والبريد'); return; }
    currentUser = { nick, email, id: 'u_' + Date.now() };
    try { localStorage.setItem('gag_user', JSON.stringify(currentUser)); } catch(e){ console.warn('[app] localStorage failed', e); }
    onUserLoggedIn();
  });

  btnLogout && btnLogout.addEventListener('click', ()=> {
    if(confirm('هل تريد تسجيل الخروج؟')) {
      localStorage.removeItem('gag_user');
      location.reload();
    }
  });

  function checkLocalUser(){
    try {
      const s = localStorage.getItem('gag_user');
      if(s){ currentUser = JSON.parse(s); onUserLoggedIn(); console.log('[app] found local user', currentUser); }
    } catch(e){ console.warn('[app] parse local user failed', e); }
  }
  checkLocalUser();

  function onUserLoggedIn(){
    // UI changes
    authScreen && authScreen.classList.remove('visible'); authScreen && authScreen.classList.add('hidden'); authScreen && authScreen.setAttribute('aria-hidden','true');
    userArea && userArea.classList.remove('hidden'); userArea && userArea.setAttribute('aria-hidden','false');
    userNick && (userNick.textContent = currentUser.nick || '');
    btnAddProduct && btnAddProduct.classList.remove('hidden');
    requestsSection && requestsSection.classList.remove('hidden');
    // start realtime listeners
    startListeners();
  }

  /* ==================== add product UI ==================== */
  btnAddProduct && btnAddProduct.addEventListener('click', ()=> {
    addFormCard && addFormCard.classList.remove('hidden'); btnAddProduct && btnAddProduct.classList.add('hidden');
  });
  cancelAdd && cancelAdd.addEventListener('click', ()=> {
    addFormCard && addFormCard.classList.add('hidden'); btnAddProduct && btnAddProduct.classList.remove('hidden');
  });

  saveProduct && saveProduct.addEventListener('click', async ()=> {
    const name = $('p_name')?.value.trim() || '';
    const type = $('p_type')?.value || '';
    const qty = $('p_qty')?.value || '';
    const contact = $('p_contact')?.value.trim() || '';
    const img = $('p_img')?.value.trim() || '';
    if(!name || !type || !qty || !contact){ showToast('عبي كل الحقول'); return; }
    const product = {
      name, type, qty: Number(qty), contact, img,
      ownerNick: currentUser.nick, ownerEmail: currentUser.email, ownerId: currentUser.id,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try{
      await db.collection('products').add(product);
      showToast('تم إضافة المنتج');
      // reset
      $('p_name').value=''; $('p_type').value=''; $('p_qty').value=''; $('p_contact').value=''; $('p_img').value='';
      addFormCard && addFormCard.classList.add('hidden'); btnAddProduct && btnAddProduct.classList.remove('hidden');
    }catch(e){
      console.error('[app] add product error', e); showToast('فشل الحفظ — افتح Console');
    }
  });

  /* ==================== realtime listeners ==================== */
  function startListeners(){
    // products
    db.collection('products').orderBy('createdAt','desc')
      .onSnapshot(snap => {
        productsList && (productsList.innerHTML = '');
        if(snap.empty){ emptyMsg && (emptyMsg.style.display = 'block'); }
        else { emptyMsg && (emptyMsg.style.display = 'none'); }
        snap.forEach(doc => {
          const p = doc.data(); const id = doc.id;
          const node = createProductCard(id, p);
          productsList && productsList.appendChild(node);
        });
      }, err => {
        console.error('[app] products onSnapshot error', err);
        showToast('فشل جلب المنتجات — تحقق من إعدادات Firestore');
      });

    // requests for current seller
    db.collection('requests').where('ownerId','==', currentUser.id).orderBy('createdAt','desc')
      .onSnapshot(snap => {
        requestsList && (requestsList.innerHTML = '');
        if(snap.empty){ requestsList && (requestsList.innerHTML = '<p class="muted">لم يصلك طلبات بعد</p>'); return; }
        snap.forEach(doc => {
          const r = doc.data();
          const time = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString() : new Date().toLocaleString();
          const div = document.createElement('div'); div.className = 'request-item';
          div.innerHTML = `<strong>${escapeHtml(r.productName)}</strong> — من: <strong>${escapeHtml(r.buyerNick)}</strong> — ${escapeHtml(r.buyerEmail)} • ${escapeHtml(time)}`;
          requestsList && requestsList.appendChild(div);
        });
      }, err => {
        console.error('[app] requests onSnapshot error', err);
      });
  }

  /* ==================== create product card ==================== */
  function createProductCard(id, p){
    const wrap = document.createElement('div'); wrap.className = 'product-card card'; wrap.setAttribute('role','listitem');
    const head = document.createElement('div'); head.className = 'product-head';
    const thumb = document.createElement('div'); thumb.className = 'product-thumb';
    if(p.img && typeof p.img === 'string' && (p.img.startsWith('http') || p.img.startsWith('data:'))){
      const img = document.createElement('img'); img.src = p.img; img.alt = p.name || 'product'; img.style.width='72px'; img.style.height='72px'; img.style.borderRadius='10px'; img.style.objectFit='cover';
      thumb.appendChild(img);
    } else {
      thumb.textContent = (p.name && p.name[0]) ? p.name[0].toUpperCase() : 'G';
    }

    const info = document.createElement('div'); info.style.flex = '1';
    const title = document.createElement('div'); title.className = 'product-title'; title.textContent = p.name;
    const meta = document.createElement('div'); meta.className = 'product-meta'; meta.innerHTML = `النوع: <strong>${escapeHtml(p.type)}</strong> • الكمية: <strong>${escapeHtml(p.qty)}</strong><br>البائع: <strong>${escapeHtml(p.ownerNick)}</strong>`;
    const contactLine = document.createElement('div'); contactLine.className = 'product-meta'; contactLine.innerHTML = `وسيلة التواصل: <span style="font-weight:800">${escapeHtml(p.contact)}</span>`;

    info.appendChild(title); info.appendChild(meta); info.appendChild(contactLine);
    head.appendChild(thumb); head.appendChild(info);

    const actions = document.createElement('div'); actions.className = 'product-actions';
    const orderBtn = document.createElement('button'); orderBtn.className = 'action-btn action-order'; orderBtn.textContent = 'طلب';
    const copyBtn = document.createElement('button'); copyBtn.className = 'action-btn action-copy'; copyBtn.textContent = 'انسخ التواصل';
    const deleteBtn = document.createElement('button'); deleteBtn.className = 'action-btn action-delete'; deleteBtn.textContent = 'حذف';

    orderBtn.addEventListener('click', ()=> makeOrder(id, p));
    copyBtn.addEventListener('click', ()=> {
      copyToClipboard(p.contact).then(()=> showToast('تم نسخ وسيلة التواصل')).catch(()=> alert('وسيلة التواصل: ' + p.contact));
    });
    deleteBtn.addEventListener('click', async ()=> {
      try {
        if(currentUser && currentUser.id === p.ownerId){
          if(confirm('هل متأكد من حذف الإعلان؟')){
            await db.collection('products').doc(id).delete();
            showToast('تم حذف الإعلان');
          }
        } else { showToast('غير مسموح لك بحذف هذا الإعلان'); }
      } catch(e){
        console.error('[app] delete product error', e); showToast('فشل الحذف');
      }
    });

    actions.appendChild(orderBtn); actions.appendChild(copyBtn); actions.appendChild(deleteBtn);
    wrap.appendChild(head); wrap.appendChild(actions);
    return wrap;
  }

  /* ==================== make order ==================== */
  async function makeOrder(productId, productData){
    if(!currentUser){ showToast('سجل دخول أولا'); return; }
    const req = {
      productId,
      productName: productData.name,
      ownerId: productData.ownerId,
      ownerEmail: productData.ownerEmail,
      ownerNick: productData.ownerNick,
      buyerId: currentUser.id,
      buyerNick: currentUser.nick,
      buyerEmail: currentUser.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try{
      await db.collection('requests').add(req);
      showToast('تم إرسال الطلب — سيصل إشعار للبائع');
      console.log('[app] request created', req);
    }catch(e){
      console.error('[app] makeOrder error', e);
      showToast('فشل إرسال الطلب');
    }
  }

  /* ==================== dev helpers (optional) ==================== */
  async function seedDemo(){
    const demo = [
      { name:'أرنب أبيض', type:'حيوان', qty:1, contact:'discord#medo', img:'https://i.ibb.co/ZVh01dm/rabbit.jpg', ownerNick:'Ali', ownerEmail:'ali@example.com', ownerId:'seed1' },
      { name:'1000 كوين', type:'فلوس', qty:1000, contact:'wa.me/201234567890', img:'https://i.ibb.co/fXb9w8Z/coins.jpg', ownerNick:'Sara', ownerEmail:'sara@example.com', ownerId:'seed2' },
    ];
    for(const p of demo){
      try{ await db.collection('products').add(Object.assign({}, p, { createdAt: firebase.firestore.FieldValue.serverTimestamp() })); }catch(e){ console.error('[seed] error', e); }
    }
    showToast('تم إضافة منتجات تجريبية');
  }
  // seedDemo(); // Uncomment to seed for testing

  /* ==================== error safeguard ==================== */
  window.addEventListener('error', (ev)=> {
    console.error('[app] runtime error', ev.error || ev.message);
    showToast('حصل خطأ، افتح Console للمزيد');
  });