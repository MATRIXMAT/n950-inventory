/* NeoLeap Inventory V9 Accounts
   Supabase Auth + personal cloud inventory
*/

const V9_SUPABASE_URL = "https://zeegofssildsrvjtnzum.supabase.co";
const V9_SUPABASE_KEY = "sb_publishable_lHHWVaUsIPALGULDKNFwLw_xMoZLaLv";
const V9_APP_URL = "https://matrixmat.github.io/n950-inventory/";

const V9_LEGACY_KEY = "n950_inventory_v2_devices";
const V9_USER_CACHE_PREFIX = "n950_inventory_v9_devices_";
const V9_MIGRATION_OWNER_KEY = "n950_inventory_v9_legacy_owner";

const v9sb = window.supabase.createClient(
  V9_SUPABASE_URL,
  V9_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

let v9User = null;
let v9Profile = null;
let v9Busy = false;
let v9BootedUserId = null;

function v9Escape(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );
}

function v9InjectUI() {

  const style = document.createElement("style");

  style.textContent = `
    .v9-auth-screen{
      position:fixed;
      inset:0;
      z-index:1000;
      background:linear-gradient(160deg,#f7fffc 0%,#eef8f5 46%,#f4f7f8 100%);
      display:flex;
      align-items:center;
      justify-content:center;
      padding:22px;
      overflow:auto;
      font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;
      color:#162126
    }

    .v9-auth-card{
      width:min(440px,100%);
      background:rgba(255,255,255,.97);
      border:1px solid #dfeae6;
      border-radius:30px;
      padding:24px;
      box-shadow:0 24px 70px rgba(15,80,60,.13)
    }

    .v9-auth-logo{
      width:86px;
      height:86px;
      display:block;
      margin:0 auto 12px;
      border-radius:24px;
      object-fit:cover;
      box-shadow:0 10px 28px rgba(15,159,116,.16)
    }

    .v9-auth-title{
      text-align:center;
      font-size:26px;
      font-weight:950;
      margin:0
    }

    .v9-auth-sub{
      text-align:center;
      color:#73818a;
      font-size:13px;
      line-height:1.7;
      margin:7px 0 18px
    }

    .v9-auth-tabs{
      display:grid;
      grid-template-columns:1fr 1fr;
      background:#edf2f1;
      padding:4px;
      border-radius:15px;
      gap:4px;
      margin-bottom:16px
    }

    .v9-auth-tabs button{
      border:0;
      padding:10px;
      border-radius:12px;
      background:transparent;
      color:#718078;
      font-weight:900
    }

    .v9-auth-tabs button.active{
      background:#fff;
      color:#07865f;
      box-shadow:0 3px 10px #0000000b
    }

    .v9-auth-pane{
      display:none
    }

    .v9-auth-pane.active{
      display:block
    }

    .v9-field{
      margin-bottom:11px
    }

    .v9-field label{
      display:block;
      font-size:12px;
      font-weight:850;
      margin:0 2px 6px;
      color:#46545d
    }

    .v9-field input{
      width:100%;
      box-sizing:border-box;
      border:1px solid #e6ecef;
      background:#fff;
      border-radius:14px;
      padding:13px 14px;
      outline:none;
      font:inherit
    }

    .v9-field input[type=email],
    .v9-field input[type=password]{
      direction:ltr;
      text-align:left
    }

    .v9-field input:focus{
      border-color:#8dddc1;
      box-shadow:0 0 0 3px #10b98112
    }

    .v9-primary{
      width:100%;
      border:0;
      padding:13px;
      border-radius:14px;
      background:linear-gradient(135deg,#0f9f74,#10b981);
      color:#fff;
      font-weight:950;
      font:inherit;
      cursor:pointer
    }

    .v9-google{
      width:100%;
      border:1px solid #e6ecef;
      padding:12px;
      border-radius:14px;
      background:#fff;
      color:#243038;
      font-weight:900;
      font:inherit;
      margin-top:10px;
      cursor:pointer
    }

    .v9-link{
      display:block;
      margin:12px auto 0;
      border:0;
      background:transparent;
      color:#07865f;
      font-size:12px;
      font-weight:850;
      cursor:pointer
    }

    .v9-auth-card button:disabled{
      opacity:.55;
      cursor:not-allowed
    }

    .v9-msg{
      display:none;
      margin-top:12px;
      padding:11px 12px;
      border-radius:13px;
      font-size:12px;
      line-height:1.65
    }

    .v9-msg.show{
      display:block
    }

    .v9-msg.ok{
      background:#eafaf4;
      color:#07865f
    }

    .v9-msg.bad{
      background:#fff0f0;
      color:#c72c2c
    }

    .v9-msg.warn{
      background:#fff7e8;
      color:#a86205
    }

    .v9-loader{
      width:34px;
      height:34px;
      border:3px solid #d9eee6;
      border-top-color:#10b981;
      border-radius:50%;
      margin:0 auto 12px;
      animation:v9spin .8s linear infinite
    }

    @keyframes v9spin{
      to{transform:rotate(360deg)}
    }

    .v9-boot{
      text-align:center
    }

    .v9-boot small{
      display:block;
      color:#73818a;
      margin-top:5px
    }

    .v9-account-card{
      background:#fff;
      border:1px solid #e6ecef;
      border-radius:23px;
      padding:15px;
      box-shadow:0 5px 19px rgba(15,23,42,.05);
      margin-bottom:11px
    }

    .v9-profile{
      display:flex;
      align-items:center;
      gap:12px
    }

    .v9-avatar{
      width:52px;
      height:52px;
      border-radius:17px;
      background:linear-gradient(135deg,#dff8ef,#e9f3ff);
      display:grid;
      place-items:center;
      font-size:20px;
      font-weight:950;
      color:#07865f;
      overflow:hidden;
      flex:none
    }

    .v9-avatar img{
      width:100%;
      height:100%;
      object-fit:cover
    }

    .v9-profile-copy{
      flex:1;
      min-width:0
    }

    .v9-profile-copy b{
      display:block;
      font-size:15px
    }

    .v9-profile-copy small{
      display:block;
      color:#73818a;
      margin-top:3px;
      direction:ltr;
      text-align:right;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis
    }

    .v9-sync{
      display:inline-flex;
      align-items:center;
      margin-top:6px;
      background:#eef9f5;
      color:#07865f;
      padding:4px 8px;
      border-radius:999px;
      font-size:10px;
      font-weight:850
    }

    .v9-sync.bad{
      background:#fff0f0;
      color:#c72c2c
    }

    .v9-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
      margin-top:11px
    }

    .v9-actions button{
      border:0;
      padding:12px;
      border-radius:14px;
      font-weight:900;
      font:inherit
    }

    .v9-actions .sync{
      background:#eef2f4;
      color:#46545d
    }

    .v9-actions .logout{
      background:#fff0f0;
      color:#ef4444
    }
  `;

  document.head.appendChild(style);

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="v9-auth-screen" id="v9Boot">
      <div class="v9-auth-card v9-boot">
        <img class="v9-auth-logo" src="icon-192.png">
        <div class="v9-loader"></div>
        <b>جاري تجهيز حسابك...</b>
        <small>NeoLeap Inventory</small>
      </div>
    </div>

    <div class="v9-auth-screen" id="v9Auth" style="display:none">

      <div class="v9-auth-card">

        <img class="v9-auth-logo" src="icon-192.png">

        <h1 class="v9-auth-title">
          NeoLeap Inventory
        </h1>

        <p class="v9-auth-sub">
          سجّل دخولك للوصول إلى مخزونك الخاص ومزامنته بأمان.
        </p>

        <div class="v9-auth-tabs">

          <button
            id="v9LoginTab"
            class="active"
            type="button"
          >
            تسجيل الدخول
          </button>

          <button
            id="v9SignupTab"
            type="button"
          >
            إنشاء حساب
          </button>

        </div>

        <form
          id="v9LoginPane"
          class="v9-auth-pane active"
        >

          <div class="v9-field">

            <label>
              البريد الإلكتروني
            </label>

            <input
              id="v9LoginEmail"
              type="email"
              autocomplete="email"
              required
              placeholder="name@example.com"
            >

          </div>

          <div class="v9-field">

            <label>
              كلمة المرور
            </label>

            <input
              id="v9LoginPassword"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
            >

          </div>

          <button
            class="v9-primary"
            id="v9LoginBtn"
            type="submit"
          >
            دخول
          </button>

          <button
            class="v9-google"
            id="v9GoogleLogin"
            type="button"
          >
            🇬 المتابعة باستخدام Google
          </button>

          <button
            class="v9-link"
            id="v9Forgot"
            type="button"
          >
            نسيت كلمة المرور؟
          </button>

        </form>

        <form
          id="v9SignupPane"
          class="v9-auth-pane"
        >

          <div class="v9-field">

            <label>
              الاسم
            </label>

            <input
              id="v9SignupName"
              type="text"
              autocomplete="name"
              required
              placeholder="مثال: نورالدين"
            >

          </div>

          <div class="v9-field">

            <label>
              البريد الإلكتروني
            </label>

            <input
              id="v9SignupEmail"
              type="email"
              autocomplete="email"
              required
              placeholder="name@example.com"
            >

          </div>

          <div class="v9-field">

            <label>
              كلمة المرور
            </label>

            <input
              id="v9SignupPassword"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
              placeholder="6 أحرف على الأقل"
            >

          </div>

          <div class="v9-field">

            <label>
              تأكيد كلمة المرور
            </label>

            <input
              id="v9SignupPassword2"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
              placeholder="أعد كتابة كلمة المرور"
            >

          </div>

          <button
            class="v9-primary"
            id="v9SignupBtn"
            type="submit"
          >
            إنشاء الحساب
          </button>

          <button
            class="v9-google"
            id="v9GoogleSignup"
            type="button"
          >
            🇬 التسجيل باستخدام Google
          </button>

        </form>

        <div
          class="v9-msg"
          id="v9Msg"
        ></div>

      </div>

    </div>
  `
  );

  const app =
    document.querySelector(".app");

  const nav =
    document.querySelector(".bottom");

  if (app) {
    app.id = "v9MainApp";
    app.style.display = "none";
  }

  if (nav) {
    nav.id = "v9BottomNav";
    nav.style.display = "none";
  }

  const heroTitle =
    document.querySelector(
      "#home .hero h1"
    );

  if (heroTitle) {
    heroTitle.id =
      "v9WelcomeTitle";
  }

  const more =
    document.getElementById(
      "more"
    );

  if (more) {

    const subtitle =
      more.querySelector(
        ".subtitle"
      );

    if (subtitle) {
      subtitle.textContent =
        "حسابك، المزامنة، والنسخ الاحتياطي.";
    }

    const menu =
      more.querySelector(
        ".menu"
      );

    if (menu) {

      menu.insertAdjacentHTML(
        "beforebegin",
        `
        <div class="v9-account-card">

          <div class="v9-profile">

            <div
              class="v9-avatar"
              id="v9Avatar"
            >
              N
            </div>

            <div class="v9-profile-copy">

              <b id="v9Name">
                المستخدم
              </b>

              <small id="v9Email"></small>

              <span
                class="v9-sync"
                id="v9Sync"
              >
                ☁️ متزامن
              </span>

            </div>

          </div>

          <div class="v9-actions">

            <button
              class="sync"
              id="v9SyncBtn"
            >
              ☁️ مزامنة الآن
            </button>

            <button
              class="logout"
              id="v9Logout"
            >
              تسجيل الخروج
            </button>

          </div>

        </div>
        `
      );
    }

    const important =
      [...more.querySelectorAll(".card")]
        .find(
          c =>
            c.textContent.includes(
              "مهم"
            )
        );

    if (important) {

      const p =
        important.querySelector("p");

      if (p) {
        p.textContent =
          "مخزون كل موظف مربوط بحسابه الخاص. عند تسجيل الدخول من جهاز آخر يظهر مخزونه هو فقط بعد المزامنة.";
      }
    }
  }
}

v9InjectUI();

const v9El =
  id =>
    document.getElementById(id);

function v9SetMessage(
  text,
  type = ""
) {

  const el =
    v9El("v9Msg");

  if (!el) return;

  el.textContent =
    text || "";

  el.className =
    "v9-msg" +
    (text ? " show" : "") +
    (type ? " " + type : "");
}

function v9SetAuthMode(
  modeName
) {

  const login =
    modeName === "login";

  v9El("v9LoginTab")
    .classList.toggle(
      "active",
      login
    );

  v9El("v9SignupTab")
    .classList.toggle(
      "active",
      !login
    );

  v9El("v9LoginPane")
    .classList.toggle(
      "active",
      login
    );

  v9El("v9SignupPane")
    .classList.toggle(
      "active",
      !login
    );

  v9SetMessage("");
}

function v9AuthBusy(on) {

  [
    "v9LoginBtn",
    "v9SignupBtn",
    "v9GoogleLogin",
    "v9GoogleSignup",
    "v9Forgot"
  ].forEach(id => {

    const el =
      v9El(id);

    if (el) {
      el.disabled = on;
    }

  });
}

function v9SetSync(state) {

  const el =
    v9El("v9Sync");

  if (!el) return;

  el.classList.toggle(
    "bad",
    state === "error"
  );

  if (
    state === "syncing"
  ) {

    el.textContent =
      "☁️ جاري المزامنة...";

  } else if (
    state === "error"
  ) {

    el.textContent =
      "⚠️ مشكلة مزامنة";

  } else {

    el.textContent =
      "☁️ متزامن";
  }
}

function v9FirstName(name) {

  const s =
    String(name || "")
      .trim();

  return s
    ? s.split(/\s+/)[0]
    : "";
}

function v9UserCacheKey() {

  return v9User
    ? V9_USER_CACHE_PREFIX +
      v9User.id
    : null;
}

function v9LoadArray(key) {

  try {

    const a =
      JSON.parse(
        localStorage.getItem(key) ||
        "[]"
      );

    return Array.isArray(a)
      ? a.filter(
          x =>
            x &&
            SERIAL_RE.test(
              String(
                x.serial || ""
              )
            )
        )
      : [];

  } catch {

    return [];

  }
}

function v9SaveLocal() {

  const key =
    v9UserCacheKey();

  if (key) {

    localStorage.setItem(
      key,
      JSON.stringify(devices)
    );

  }
}

save = v9SaveLocal;

function v9CloudToLocal(row) {

  return {

    model:
      row.model || MODEL,

    serial:
      normalize(row.serial),

    status:
      row.status === "delivered"
        ? "delivered"
        : "stock",

    receivedAt:
      row.received_at
        ? new Date(
            row.received_at
          ).getTime()
        : Date.now(),

    deliveredAt:
      row.delivered_at
        ? new Date(
            row.delivered_at
          ).getTime()
        : null

  };
}

function v9LocalToCloud(d) {

  return {

    user_id:
      v9User.id,

    serial:
      normalize(d.serial),

    model:
      d.model || MODEL,

    status:
      d.status === "delivered"
        ? "delivered"
        : "stock",

    received_at:
      new Date(
        Number(d.receivedAt) ||
        Date.now()
      ).toISOString(),

    delivered_at:
      d.deliveredAt
        ? new Date(
            Number(
              d.deliveredAt
            )
          ).toISOString()
        : null

  };
}

async function v9EnsureProfile() {

  let {
    data,
    error
  } =
    await v9sb
      .from("profiles")
      .select(
        "id,full_name,avatar_url"
      )
      .eq(
        "id",
        v9User.id
      )
      .maybeSingle();

  if (error) {
    console.warn(
      "Profile read:",
      error
    );
  }

  if (!data) {

    const name =
      v9User.user_metadata
        ?.full_name ||
      v9User.user_metadata
        ?.name ||
      v9User.email
        ?.split("@")[0] ||
      "مستخدم";

    const avatar =
      v9User.user_metadata
        ?.avatar_url ||
      v9User.user_metadata
        ?.picture ||
      null;

    const r =
      await v9sb
        .from("profiles")
        .upsert({
          id: v9User.id,
          full_name: name,
          avatar_url: avatar
        });

    if (r.error) {
      console.warn(
        "Profile create:",
        r.error
      );
    }

    data = {
      id: v9User.id,
      full_name: name,
      avatar_url: avatar
    };
  }

  v9Profile = data;
}

function v9UpdateProfileUI() {

  const name =
    v9Profile?.full_name ||
    v9User?.user_metadata
      ?.full_name ||
    v9User?.user_metadata
      ?.name ||
    v9User?.email
      ?.split("@")[0] ||
    "مستخدم";

  const avatar =
    v9Profile?.avatar_url ||
    v9User?.user_metadata
      ?.avatar_url ||
    v9User?.user_metadata
      ?.picture ||
    "";

  const first =
    v9FirstName(name) ||
    "مستخدم";

  if (v9El("v9Name")) {

    v9El("v9Name")
      .textContent = name;

  }

  if (v9El("v9Email")) {

    v9El("v9Email")
      .textContent =
        v9User?.email || "";

  }

  if (
    v9El("v9WelcomeTitle")
  ) {

    v9El(
      "v9WelcomeTitle"
    ).textContent =
      `مرحبًا ${first} 👋`;

  }

  const av =
    v9El("v9Avatar");

  if (av) {

    if (avatar) {

      av.innerHTML =
        `<img src="${v9Escape(avatar)}" alt="">`;

    } else {

      av.textContent =
        first
          .charAt(0)
          .toUpperCase();

    }
  }
}

async function v9FetchCloudDevices() {

  if (!v9User) return;

  v9SetSync("syncing");

  const {
    data,
    error
  } =
    await v9sb
      .from("devices")
      .select("*")
      .eq(
        "user_id",
        v9User.id
      )
      .order(
        "received_at",
        {
          ascending:false
        }
      );

  if (error) {
    throw error;
  }

  devices =
    (data || [])
      .map(v9CloudToLocal)
      .filter(
        x =>
          SERIAL_RE.test(
            x.serial
          )
      );

  v9SaveLocal();

  render();

  v9SetSync("ok");
}

async function v9MigrateLegacy() {

  if (
    localStorage.getItem(
      V9_MIGRATION_OWNER_KEY
    )
  ) {
    return;
  }

  const legacy =
    v9LoadArray(
      V9_LEGACY_KEY
    );

  if (!legacy.length) {

    localStorage.setItem(
      V9_MIGRATION_OWNER_KEY,
      v9User.id
    );

    return;
  }

  const ok =
    confirm(
      `وجدنا ${legacy.length} جهاز من النسخة السابقة على هذا الجوال.\n\nهل تريد ربطها بحسابك الحالي حتى لا تفقد مخزونك السابق؟`
    );

  if (!ok) return;

  v9SetSync("syncing");

  const rows =
    legacy.map(
      v9LocalToCloud
    );

  const {
    error
  } =
    await v9sb
      .from("devices")
      .upsert(
        rows,
        {
          onConflict:
            "user_id,serial"
        }
      );

  if (error) {

    console.error(error);

    v9SetSync("error");

    toast(
      "تعذر نقل المخزون القديم"
    );

    return;
  }

  localStorage.setItem(
    V9_MIGRATION_OWNER_KEY,
    v9User.id
  );

  localStorage.setItem(
    "n950_inventory_v9_legacy_backup",
    JSON.stringify(legacy)
  );

  await v9FetchCloudDevices();

  toast(
    `تم ربط ${legacy.length} جهاز بحسابك`
  );

  successFeedback();
}

async function v9BootSignedIn(
  session
) {

  if (!session?.user) {
    return;
  }

  const same =
    v9BootedUserId ===
    session.user.id;

  v9User =
    session.user;

  v9BootedUserId =
    session.user.id;

  v9El("v9Boot")
    .style.display =
      "none";

  v9El("v9Auth")
    .style.display =
      "none";

  const app =
    v9El("v9MainApp");

  const nav =
    v9El("v9BottomNav");

  if (app) {
    app.style.display = "";
  }

  if (nav) {
    nav.style.display =
      "grid";
  }

  try {

    await v9EnsureProfile();

    v9UpdateProfileUI();

    if (!same) {

      const cached =
        v9LoadArray(
          v9UserCacheKey()
        );

      devices = cached;

      render();
    }

    await v9FetchCloudDevices();

    await v9MigrateLegacy();

  } catch (e) {

    console.error(e);

    v9SetSync("error");

    devices =
      v9LoadArray(
        v9UserCacheKey()
      );

    render();

    toast(
      "تعذر الاتصال بالسحابة، تم عرض آخر نسخة محفوظة"
    );
  }
}

function v9ShowLoggedOut() {

  try {
    stopCamera();
  } catch {}

  v9User = null;

  v9Profile = null;

  v9BootedUserId = null;

  devices = [];

  const app =
    v9El("v9MainApp");

  const nav =
    v9El("v9BottomNav");

  if (app) {
    app.style.display =
      "none";
  }

  if (nav) {
    nav.style.display =
      "none";
  }

  v9El("v9Boot")
    .style.display =
      "none";

  v9El("v9Auth")
    .style.display =
      "flex";

  v9SetAuthMode("login");
}

async function v9GoogleAuth() {

  v9SetMessage(
    "جاري فتح Google...",
    "warn"
  );

  const {
    error
  } =
    await v9sb.auth
      .signInWithOAuth({
        provider:"google",

        options:{
          redirectTo:
            V9_APP_URL
        }
      });

  if (error) {

    v9SetMessage(
      "تعذر تسجيل الدخول باستخدام Google: " +
      error.message,
      "bad"
    );

  }
}

processSerial =
async function(raw) {

  const serial =
    normalize(raw);

  if (!v9User) {

    setStatus(
      "❌ سجّل الدخول أولًا",
      "bad"
    );

    errorFeedback();

    return false;
  }

  if (v9Busy) {

    setStatus(
      "⏳ انتظر اكتمال العملية السابقة",
      "warn"
    );

    return false;
  }

  if (
    !SERIAL_RE.test(serial)
  ) {

    setStatus(
      "❌ السيريال غير صحيح. المطلوب مثل NCD700280982",
      "bad"
    );

    errorFeedback();

    return false;
  }

  const found =
    devices.find(
      x =>
        x.serial === serial
    );

  v9Busy = true;

  v9SetSync("syncing");

  try {

    if (mode === "receive") {

      if (found) {

        setStatus(
          found.status === "stock"
            ? `⚠️ ${serial} موجود أصلًا في المخزون`
            : `⚠️ ${serial} مسجل سابقًا وتم تسليمه`,
          "warn"
        );

        errorFeedback();

        return false;
      }

      const now =
        Date.now();

      const {
        error
      } =
        await v9sb
          .from("devices")
          .insert({
            user_id:
              v9User.id,

            serial,

            model:
              MODEL,

            status:
              "stock",

            received_at:
              new Date(now)
                .toISOString(),

            delivered_at:
              null
          });

      if (error) {

        console.error(error);

        setStatus(
          String(error.code) ===
          "23505"
            ? `⚠️ ${serial} موجود أصلًا في حسابك`
            : "❌ تعذر حفظ الجهاز. تأكد من الإنترنت.",
          String(error.code) ===
          "23505"
            ? "warn"
            : "bad"
        );

        v9SetSync("error");

        errorFeedback();

        return false;
      }

      devices.unshift({
        model:MODEL,
        serial,
        status:"stock",
        receivedAt:now,
        deliveredAt:null
      });

      v9SaveLocal();

      render();

      setStatus(
        `✅ تم استلام ${serial}`,
        "ok"
      );

      v9SetSync("ok");

      successFeedback();

      return true;
    }

    if (!found) {

      setStatus(
        `❌ ${serial} غير موجود في مخزونك`,
        "bad"
      );

      errorFeedback();

      return false;
    }

    if (
      found.status ===
      "delivered"
    ) {

      setStatus(
        `❌ ${serial} تم تسليمه سابقًا`,
        "bad"
      );

      errorFeedback();

      return false;
    }

    const now =
      Date.now();

    const {
      error
    } =
      await v9sb
        .from("devices")
        .update({
          status:
            "delivered",

          delivered_at:
            new Date(now)
              .toISOString()
        })
        .eq(
          "user_id",
          v9User.id
        )
        .eq(
          "serial",
          serial
        );

    if (error) {

      console.error(error);

      setStatus(
        "❌ تعذر تسجيل التسليم. تأكد من الإنترنت.",
        "bad"
      );

      v9SetSync("error");

      errorFeedback();

      return false;
    }

    found.status =
      "delivered";

    found.deliveredAt =
      now;

    v9SaveLocal();

    render();

    setStatus(
      `✅ تم تسليم ${serial}`,
      "ok"
    );

    v9SetSync("ok");

    successFeedback();

    return true;

  } finally {

    v9Busy = false;

  }
};

if (v9El("manualBtn")) {

  v9El("manualBtn")
    .onclick =
      async () => {

        unlockAudio();

        const input =
          v9El(
            "manualInput"
          );

        const ok =
          await processSerial(
            input.value
          );

        if (ok) {
          input.value = "";
        }

      };
}

if (v9El("manualInput")) {

  v9El("manualInput")
    .onkeydown =
      async e => {

        if (
          e.key !== "Enter"
        ) {
          return;
        }

        e.preventDefault();

        const ok =
          await processSerial(
            e.target.value
          );

        if (ok) {
          e.target.value =
            "";
        }

      };
}

window.deleteDevice =
async function(serial) {

  const d =
    devices.find(
      x =>
        x.serial === serial
    );

  if (
    !d ||
    !v9User
  ) {
    return;
  }

  if (
    !confirm(
      `حذف ${serial} نهائيًا من بيانات حسابك؟`
    )
  ) {
    return;
  }

  v9SetSync("syncing");

  const {
    error
  } =
    await v9sb
      .from("devices")
      .delete()
      .eq(
        "user_id",
        v9User.id
      )
      .eq(
        "serial",
        serial
      );

  if (error) {

    console.error(error);

    v9SetSync("error");

    toast(
      "تعذر الحذف من الحساب"
    );

    errorFeedback();

    return;
  }

  devices =
    devices.filter(
      x =>
        x.serial !== serial
    );

  v9SaveLocal();

  render();

  v9SetSync("ok");

  toast(
    "تم حذف الجهاز"
  );
};

restore =
async function(file) {

  if (
    !file ||
    !v9User
  ) {
    return;
  }

  try {

    const data =
      JSON.parse(
        await file.text()
      );

    if (
      data.app !==
        "n950-inventory" ||
      !Array.isArray(
        data.devices
      )
    ) {
      throw new Error(
        "ملف غير صالح"
      );
    }

    const clean = [];

    const seen =
      new Set();

    for (
      const x of
      data.devices
    ) {

      const serial =
        normalize(
          x.serial
        );

      if (
        !SERIAL_RE.test(
          serial
        ) ||
        seen.has(serial)
      ) {

        throw new Error(
          "يوجد سيريال غير صالح أو مكرر"
        );
      }

      seen.add(serial);

      if (
        ![
          "stock",
          "delivered"
        ].includes(
          x.status
        )
      ) {

        throw new Error(
          "حالة جهاز غير صالحة"
        );
      }

      clean.push({

        model:
          MODEL,

        serial,

        status:
          x.status,

        receivedAt:
          x.receivedAt ||
          Date.now(),

        deliveredAt:
          x.status ===
          "delivered"
            ? (
                x.deliveredAt ||
                Date.now()
              )
            : null

      });
    }

    if (
      !confirm(
        `استعادة ${clean.length} جهاز إلى حسابك؟\nسيتم جعل هذه القائمة هي مخزون الحساب الحالي.`
      )
    ) {
      return;
    }

    v9SetSync("syncing");

    const rows =
      clean.map(
        v9LocalToCloud
      );

    if (rows.length) {

      const r =
        await v9sb
          .from("devices")
          .upsert(
            rows,
            {
              onConflict:
                "user_id,serial"
            }
          );

      if (r.error) {
        throw r.error;
      }
    }

    const q =
      await v9sb
        .from("devices")
        .select("serial")
        .eq(
          "user_id",
          v9User.id
        );

    if (q.error) {
      throw q.error;
    }

    const wanted =
      new Set(
        clean.map(
          x => x.serial
        )
      );

    const extras =
      (q.data || [])
        .map(
          x => x.serial
        )
        .filter(
          s =>
            !wanted.has(s)
        );

    if (extras.length) {

      const d =
        await v9sb
          .from("devices")
          .delete()
          .eq(
            "user_id",
            v9User.id
          )
          .in(
            "serial",
            extras
          );

      if (d.error) {
        throw d.error;
      }
    }

    devices = clean;

    v9SaveLocal();

    render();

    v9SetSync("ok");

    toast(
      "تمت الاستعادة والمزامنة بنجاح"
    );

    successFeedback();

  } catch (e) {

    console.error(e);

    v9SetSync("error");

    alert(
      "تعذر الاستعادة: " +
      (
        e.message ||
        "خطأ غير معروف"
      )
    );

    errorFeedback();

  } finally {

    if (
      document.getElementById(
        "restoreFile"
      )
    ) {

      document
        .getElementById(
          "restoreFile"
        )
        .value = "";

    }
  }
};

v9El("v9LoginTab")
  .onclick =
    () =>
      v9SetAuthMode(
        "login"
      );

v9El("v9SignupTab")
  .onclick =
    () =>
      v9SetAuthMode(
        "signup"
      );

v9El("v9LoginPane")
  .onsubmit =
    async e => {

      e.preventDefault();

      v9AuthBusy(true);

      v9SetMessage(
        "جاري تسجيل الدخول...",
        "warn"
      );

      const email =
        v9El(
          "v9LoginEmail"
        ).value.trim();

      const password =
        v9El(
          "v9LoginPassword"
        ).value;

      const {
        error
      } =
        await v9sb.auth
          .signInWithPassword({
            email,
            password
          });

      v9AuthBusy(false);

      if (error) {

        v9SetMessage(
          error.message ===
          "Email not confirmed"
            ? "أكد بريدك الإلكتروني أولًا ثم حاول مرة أخرى."
            : "بيانات الدخول غير صحيحة أو تعذر تسجيل الدخول.",
          "bad"
        );

      }
    };

v9El("v9SignupPane")
  .onsubmit =
    async e => {

      e.preventDefault();

      const name =
        v9El(
          "v9SignupName"
        ).value.trim();

      const email =
        v9El(
          "v9SignupEmail"
        ).value.trim();

      const p1 =
        v9El(
          "v9SignupPassword"
        ).value;

      const p2 =
        v9El(
          "v9SignupPassword2"
        ).value;

      if (
        name.length < 2
      ) {

        v9SetMessage(
          "اكتب اسمك أولًا.",
          "bad"
        );

        return;
      }

      if (
        p1.length < 6
      ) {

        v9SetMessage(
          "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
          "bad"
        );

        return;
      }

      if (
        p1 !== p2
      ) {

        v9SetMessage(
          "كلمتا المرور غير متطابقتين.",
          "bad"
        );

        return;
      }

      v9AuthBusy(true);

      v9SetMessage(
        "جاري إنشاء الحساب...",
        "warn"
      );

      const {
        data,
        error
      } =
        await v9sb.auth
          .signUp({

            email,

            password:p1,

            options:{
              data:{
                full_name:name
              },

              emailRedirectTo:
                V9_APP_URL
            }

          });

      v9AuthBusy(false);

      if (error) {

        v9SetMessage(
          "تعذر إنشاء الحساب: " +
          error.message,
          "bad"
        );

        return;
      }

      if (data.session) {

        v9SetMessage(
          "تم إنشاء الحساب وتسجيل الدخول ✅",
          "ok"
        );

      } else {

        v9SetAuthMode(
          "login"
        );

        v9El(
          "v9LoginEmail"
        ).value =
          email;

        v9SetMessage(
          "تم إنشاء الحساب ✅ افتح بريدك واضغط رابط تأكيد البريد، ثم ارجع وسجّل الدخول.",
          "ok"
        );

      }
    };

v9El(
  "v9GoogleLogin"
).onclick =
  v9GoogleAuth;

v9El(
  "v9GoogleSignup"
).onclick =
  v9GoogleAuth;

v9El("v9Forgot")
  .onclick =
    async () => {

      const email =
        v9El(
          "v9LoginEmail"
        ).value.trim();

      if (!email) {

        v9SetMessage(
          "اكتب بريدك الإلكتروني أولًا ثم اضغط نسيت كلمة المرور.",
          "warn"
        );

        return;
      }

      v9AuthBusy(true);

      const {
        error
      } =
        await v9sb.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                V9_APP_URL
            }
          );

      v9AuthBusy(false);

      v9SetMessage(
        error
          ? "تعذر إرسال رابط الاستعادة."
          : "تم إرسال رابط استعادة كلمة المرور إلى بريدك ✅",
        error
          ? "bad"
          : "ok"
      );
    };

if (
  v9El("v9Logout")
) {

  v9El("v9Logout")
    .onclick =
      async () => {

        if (
          confirm(
            "تسجيل الخروج من حسابك؟"
          )
        ) {

          await v9sb.auth
            .signOut();

        }
      };
}

if (
  v9El("v9SyncBtn")
) {

  v9El("v9SyncBtn")
    .onclick =
      async () => {

        try {

          await v9FetchCloudDevices();

          toast(
            "تمت المزامنة"
          );

          successFeedback();

        } catch (e) {

          console.error(e);

          v9SetSync("error");

          toast(
            "تعذرت المزامنة"
          );

          errorFeedback();

        }
      };
}

async function v9InitAuth() {

  try {

    const {
      data:{
        session
      }
    } =
      await v9sb.auth
        .getSession();

    if (session) {

      await v9BootSignedIn(
        session
      );

    } else {

      v9ShowLoggedOut();

    }

  } catch (e) {

    console.error(e);

    v9El("v9Boot")
      .style.display =
        "none";

    v9El("v9Auth")
      .style.display =
        "flex";

    v9SetMessage(
      "تعذر الاتصال بخدمة الحسابات. تحقق من الإنترنت وحاول مرة أخرى.",
      "bad"
    );
  }

  v9sb.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {

        if (
          event ===
          "SIGNED_OUT"
        ) {

          v9ShowLoggedOut();

        }

        if (
          event ===
            "SIGNED_IN" &&
          session &&
          v9BootedUserId !==
            session.user.id
        ) {

          setTimeout(
            () =>
              v9BootSignedIn(
                session
              ),
            0
          );
        }

        if (
          event ===
          "PASSWORD_RECOVERY"
        ) {

          setTimeout(
            async () => {

              const pw =
                prompt(
                  "اكتب كلمة المرور الجديدة (6 أحرف على الأقل):"
                );

              if (!pw) return;

              if (
                pw.length < 6
              ) {

                alert(
                  "كلمة المرور قصيرة"
                );

                return;
              }

              const {
                error
              } =
                await v9sb.auth
                  .updateUser({
                    password:pw
                  });

              alert(
                error
                  ? "تعذر تغيير كلمة المرور"
                  : "تم تغيير كلمة المرور بنجاح"
              );

            },
            300
          );
        }

      }
    );
}

v9InitAuth();
