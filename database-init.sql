-- ==========================================
-- 1. CLEANUP (DELETE EXISTING TABLES)
-- ==========================================
DROP TABLE IF EXISTS public.pending_whatsapp_broadcast CASCADE;
DROP TABLE IF EXISTS public.bounty_matches CASCADE;
DROP TABLE IF EXISTS public.bounty_queue CASCADE;
DROP TABLE IF EXISTS public.forum_answers CASCADE;
DROP TABLE IF EXISTS public.forum_questions CASCADE;
DROP TABLE IF EXISTS public.predictive_ranks CASCADE;
DROP TABLE IF EXISTS public.rank_updates CASCADE;
DROP TABLE IF EXISTS public.app_config CASCADE;
DROP TABLE IF EXISTS public.study_plan CASCADE;
DROP TABLE IF EXISTS public.chapter_performance CASCADE;
DROP TABLE IF EXISTS public.study_sessions CASCADE;
DROP TABLE IF EXISTS public.doubts CASCADE;
DROP TABLE IF EXISTS public.mock_tests CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==========================================
-- 2. CREATE NEW TABLES
-- ==========================================

-- PROFILES (Sync with ProfileContext.tsx)
CREATE TABLE public.profiles (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  target_exams text[] DEFAULT ARRAY['JEE_ADV'],
  target_year integer,
  
  -- Gamification & Economy
  streak_days integer DEFAULT 0,
  streak_count integer DEFAULT 0,
  streak_freeze_count integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  coins integer DEFAULT 0,
  credits_cr integer DEFAULT 0,
  inventory jsonb DEFAULT '[]',
  
  -- Auth & Meta
  role text DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  plan text DEFAULT 'eklavya' CHECK (plan IN ('eklavya', 'arjuna', 'dronacharya', 'brahmastra')),
  last_study_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Referral System
  referral_code text UNIQUE,
  referred_by text,
  referral_count integer DEFAULT 0,
  referral_source text,
  subscription_expires_at timestamptz,
  
  -- Parent Features
  parent_phone text,
  parent_telemetry_enabled boolean DEFAULT false
);
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- EXAMS MASTER TABLE
CREATE TABLE public.exams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  category text NOT NULL,
  conducting_body text,
  typical_month text,
  subjects text[] NOT NULL,
  has_negative_marking boolean DEFAULT true,
  icon text
);

INSERT INTO public.exams (code, full_name, category, conducting_body, typical_month, subjects, has_negative_marking, icon) VALUES
('JEE_MAIN','JEE Main','Engineering','NTA','January/April',ARRAY['Physics','Chemistry','Mathematics'],true,'⚙️'),
('JEE_ADV','JEE Advanced','Engineering','IITs','May',ARRAY['Physics','Chemistry','Mathematics'],true,'🏆'),
('WBJEE','WBJEE','Engineering','WBJEEB','April',ARRAY['Physics','Chemistry','Mathematics','Biology'],true,'🔬'),
('MHTCET','MHT CET','Engineering','State CET','April/May',ARRAY['Physics','Chemistry','Mathematics','Biology'],false,'🎓'),
('BITSAT','BITSAT','Engineering','BITS Pilani','May/June',ARRAY['Physics','Chemistry','Mathematics','English','Logical Reasoning'],false,'⚡'),
('VITEEE','VITEEE','Engineering','VIT','April',ARRAY['Physics','Chemistry','Mathematics','Aptitude'],false,'🔧'),
('GATE','GATE','PG Engineering','IISc/IITs','February',ARRAY['Engineering Mathematics','General Aptitude','Core Subject'],true,'🔩'),
('NEST','NEST','Science Research','NISER/UM-DAE','June',ARRAY['Biology','Chemistry','Mathematics','Physics'],false,'🧬'),
('NEET','NEET UG','Medical','NTA','May',ARRAY['Physics','Chemistry','Biology'],true,'🩺'),
('AIIMS_PG','AIIMS PG','Medical PG','AIIMS','November',ARRAY['Medicine','Surgery','Preclinical'],false,'🏥'),
('UPSC_CSE','UPSC CSE','Civil Services','UPSC','June',ARRAY['General Studies','CSAT','Optional Subject','Essay'],false,'🏛️'),
('UPSC_CDS','UPSC CDS','Defence','UPSC','February/November',ARRAY['English','General Knowledge','Elementary Mathematics'],true,'⚔️'),
('NDA','NDA','Defence','UPSC','April/September',ARRAY['Mathematics','General Ability Test'],true,'🎖️'),
('SBI_PO','SBI PO','Banking','SBI','March',ARRAY['Reasoning','Quantitative Aptitude','English','General Awareness'],true,'🏦'),
('IBPS_PO','IBPS PO','Banking','IBPS','October',ARRAY['Reasoning','Quantitative Aptitude','English','General Awareness'],true,'💳'),
('RBI_GRADE_B','RBI Grade B','Banking','RBI','June',ARRAY['General Awareness','Quantitative Aptitude','English','Reasoning'],true,'💰'),
('CA_FINAL','CA Final','Finance','ICAI','May/November',ARRAY['Financial Reporting','SFM','Audit','Law','Costing','Direct Tax','Indirect Tax'],false,'📊'),
('CA_INTER','CA Inter','Finance','ICAI','May/November',ARRAY['Accounting','Corporate Laws','Cost Accounting','Taxation','Advanced Accounting','Auditing'],false,'📈'),
('CAT','CAT','Management','IIMs','November',ARRAY['VARC','DILR','Quantitative Aptitude'],true,'📚'),
('XAT','XAT','Management','XLRI','January',ARRAY['VALR','Decision Making','Quantitative Aptitude','General Knowledge'],true,'🎯'),
('MAT','MAT','Management','AIMA','Feb/May/Sep/Dec',ARRAY['Language Comprehension','Mathematical Skills','Data Analysis','Intelligence','Indian & Global Environment'],false,'📋'),
('CLAT','CLAT','Law','Consortium','December',ARRAY['English Language','Current Affairs','Legal Reasoning','Logical Reasoning','Quantitative Techniques'],false,'⚖️'),
('AILET','AILET','Law','NLU Delhi','December',ARRAY['English','General Knowledge','Legal Aptitude','Reasoning','Mathematics'],false,'🔨'),
('SSC_CGL','SSC CGL','Government Jobs','SSC','March',ARRAY['General Intelligence','General Awareness','Quantitative Aptitude','English Language'],true,'🏢'),
('SSC_CHSL','SSC CHSL','Government Jobs','SSC','March',ARRAY['General Intelligence','English Language','Quantitative Aptitude','General Awareness'],true,'📝'),
('SSC_MTS','SSC MTS','Government Jobs','SSC','June',ARRAY['General Intelligence','English Language','Numerical Aptitude','General Awareness'],false,'📌');

-- MOCK TESTS
CREATE TABLE public.mock_tests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  test_name text NOT NULL,
  exam_code text NOT NULL,
  subject text,
  topic text,
  questions jsonb NOT NULL DEFAULT '[]',
  answers jsonb DEFAULT '{}',
  score numeric,
  total_marks integer,
  accuracy numeric,
  time_taken_seconds integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  taken_at timestamptz DEFAULT now() NOT NULL,
  submission_hour integer
);
CREATE INDEX idx_mock_tests_user ON public.mock_tests(user_id);
CREATE INDEX idx_mock_tests_date ON public.mock_tests(taken_at DESC);

-- DOUBTS
CREATE TABLE public.doubts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exam_code text,
  subject text NOT NULL,
  chapter text,
  question_text text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- STUDY SESSIONS
CREATE TABLE public.study_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  chapter text,
  duration_minutes integer NOT NULL,
  mood text CHECK (mood IN ('focused','okay','distracted')),
  session_date date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- CHAPTER PERFORMANCE
CREATE TABLE public.chapter_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exam_code text NOT NULL,
  subject text NOT NULL,
  chapter text NOT NULL,
  attempts integer DEFAULT 0,
  correct integer DEFAULT 0,
  accuracy numeric GENERATED ALWAYS AS (
    CASE WHEN attempts > 0 THEN (correct::numeric/attempts)*100 ELSE 0 END
  ) STORED,
  srs_level integer DEFAULT 0,
  next_revision_at timestamptz DEFAULT now(),
  last_attempted timestamptz DEFAULT now(),
  UNIQUE(user_id, exam_code, subject, chapter)
);


-- STUDY PLAN
CREATE TABLE public.study_plan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_date date NOT NULL,
  subject text NOT NULL,
  chapter text,
  duration_minutes integer NOT NULL,
  start_time time,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- FORUM
CREATE TABLE public.forum_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  exam_code text,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.forum_answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid REFERENCES public.forum_questions(id) ON DELETE CASCADE NOT NULL,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  is_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- PREDICTIVE RANKS (used in Edge Function)
CREATE TABLE public.predictive_ranks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  predicted_rank integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- BOUNTY ARENA
CREATE TABLE public.bounty_queue (
  user_id text PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  wager_amount integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.bounty_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_1_id text REFERENCES public.profiles(id),
  player_2_id text REFERENCES public.profiles(id),
  wager_amount integer NOT NULL,
  questions jsonb NOT NULL,
  p1_answers jsonb DEFAULT '[]',
  p2_answers jsonb DEFAULT '[]',
  match_status text DEFAULT 'active' CHECK (match_status IN ('active', 'completed')),
  winner_id text REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- WHATSAPP BROADCASTS
CREATE TABLE public.pending_whatsapp_broadcast (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES public.profiles(id),
  parent_phone text,
  message text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- APP CONFIG (admin controlled)
CREATE TABLE public.app_config (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  is_maintenance_mode boolean DEFAULT false,
  is_development_mode boolean DEFAULT false,
  maintenance_message text DEFAULT 'System undergoing maintenance. Back shortly.',
  last_updated_by text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.app_config (is_maintenance_mode, is_development_mode, maintenance_message, last_updated_by)
VALUES (false, false, 'System undergoing maintenance. Back shortly.', 'system_init');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounty_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounty_queue;

