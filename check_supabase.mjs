import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://sbvjydgcumxgiqnkfvjz.supabase.co',
  'sb_publishable_9zLQuasToiPiyvAUUzwFuw_6O1_H9S2'
);

async function check() {
  console.log('=== Checking tables ===');
  const tables = ['libraries', 'questions', 'attempts', 'wrong_questions', 'favorites', 'study_sessions', 'ai_settings', 'user_question_status', 'user_stats', 'categories', 'tags', 'question_tags'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    console.log(t + ': ' + (error ? 'NOT FOUND - ' + error.message : 'OK'));
  }

  console.log('\n=== Checking auth ===');
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();
  console.log('admin list users:', usersErr ? 'Error - ' + usersErr.message : 'OK, count: ' + (users?.length || 0));

  // Try sign in with test credentials to see if email/password auth is enabled
  console.log('\n=== Checking sign-in capability ===');
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'wrong-password'
  });
  if (signInErr) {
    if (signInErr.message.includes('Invalid login credentials')) {
      console.log('Email/password auth: ENABLED (got expected "invalid credentials" error)');
    } else if (signInErr.message.includes('Email not confirmed')) {
      console.log('Email/password auth: ENABLED (got "email not confirmed" -- email confirmation is ON)');
    } else {
      console.log('Sign-in result:', signInErr.message);
    }
  } else {
    console.log('Unexpected success -- credentials worked?');
  }
}

check().catch(console.error);
