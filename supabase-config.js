// Supabase 프로젝트 설정값을 여기에 붙여넣으세요.
//
// 구하는 방법:
// 1. https://supabase.com 에서 무료로 프로젝트를 만듭니다. (신용카드 불필요)
// 2. 프로젝트 좌측 메뉴 Project Settings > API 에서 "Project URL"과 "anon public" 키를 복사합니다.
// 3. 아래 두 값을 그대로 채워 넣으세요.
// 4. README의 안내대로 SQL 에디터에서 테이블 + 보안 정책(RLS)을 만들어야 동기화가 정상 동작합니다.
//
// 이 값들은 비밀키가 아니라 "이 앱이 어떤 Supabase 프로젝트를 쓰는지" 알려주는 공개 식별자입니다.
// 실제 데이터 보호는 Row Level Security(행 단위 보안) 정책 + 로그인으로 이루어집니다.

export const supabaseUrl = "https://arxuhdehydbbmvptbklp.supabase.co";
export const supabaseAnonKey = "sb_publishable_jnFrL1ePzRNrm3HctFHZmA_D_iIUval";

export const isSupabaseConfigured =
  supabaseUrl !== "https://YOUR_PROJECT_REF.supabase.co" && supabaseAnonKey !== "YOUR_ANON_PUBLIC_KEY";
