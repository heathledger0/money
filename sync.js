// 기기 간 실시간 동기화 (Supabase Auth + Postgres + Realtime).
// supabase-config.js에 실제 프로젝트 값이 채워져 있을 때만 동작합니다.
// 이 파일이 로드되지 않거나 실패해도(file://로 직접 열었을 때 등) index.html의 나머지 기능은 그대로 동작합니다.

import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from './supabase-config.js';

const TABLE = 'user_data';

function $(id) { return document.getElementById(id); }

if (isSupabaseConfigured) {
  init().catch(err => {
    console.error('동기화 초기화 실패:', err);
    const hint = document.querySelector('.auth-box .hint');
    if (hint) hint.textContent = '동기화 초기화에 실패했어요 (콘솔 확인).';
  });
}

async function init() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const hint = document.querySelector('.auth-box .hint');
  if (hint) hint.style.display = 'none';

  let channel = null;
  let pushTimer = null;

  function setStatus(text) {
    const el = $('syncStatus');
    if (el) el.textContent = text;
  }

  $('signInForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('signInEmail').value.trim();
    if (!email) return;
    const btn = $('signInBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '전송 중…';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    btn.disabled = false;
    if (error) {
      btn.textContent = originalText;
      alert('로그인 링크 전송에 실패했어요: ' + error.message);
    } else {
      btn.textContent = '메일함을 확인하세요';
    }
  });

  $('signOutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
  });

  window.addEventListener('moneygrow:datachanged', () => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session && data.session.user;
      if (!user) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => pushToCloud(user.id), 500);
    });
  });

  async function pushToCloud(uid) {
    try {
      setStatus('동기화 중…');
      const { error } = await supabase
        .from(TABLE)
        .upsert({ user_id: uid, data: window.MoneyGrow.getAllData(), updated_at: new Date().toISOString() });
      setStatus(error ? '동기화 실패' : '동기화됨');
      if (error) console.error('클라우드 저장 실패:', error);
    } catch (e) {
      console.error('클라우드 저장 실패:', e);
      setStatus('동기화 실패');
    }
  }

  async function handleSignedIn(user) {
    $('signInForm').style.display = 'none';
    $('userBox').style.display = 'flex';
    $('userEmail').textContent = user.email || '';
    setStatus('연결 중…');

    const { data: existing, error: readErr } = await supabase
      .from(TABLE)
      .select('data')
      .eq('user_id', user.id)
      .maybeSingle();

    if (readErr) {
      console.error('클라우드 조회 실패:', readErr);
      setStatus('동기화 실패');
      return;
    }

    if (!existing) {
      // 이 기기에서 처음 로그인: 로컬에 있던 기록을 클라우드에 업로드해 시작점으로 삼음
      await supabase
        .from(TABLE)
        .upsert({ user_id: user.id, data: window.MoneyGrow.getAllData(), updated_at: new Date().toISOString() });
    } else {
      window.MoneyGrow.setAllData(existing.data || {});
    }
    setStatus('동기화됨');

    if (channel) supabase.removeChannel(channel);
    channel = supabase
      .channel(`user_data_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new && payload.new.data) {
            window.MoneyGrow.setAllData(payload.new.data);
            setStatus('동기화됨');
          }
        }
      )
      .subscribe();
  }

  function handleSignedOut() {
    $('signInForm').style.display = 'flex';
    $('userBox').style.display = 'none';
    if (channel) { supabase.removeChannel(channel); channel = null; }
  }

  const { data: initial } = await supabase.auth.getSession();
  if (initial.session) await handleSignedIn(initial.session.user);
  else handleSignedOut();

  supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) handleSignedIn(session.user);
    else handleSignedOut();
  });
}
