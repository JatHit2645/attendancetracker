const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ieimaotamtsywkvflknb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaW1hb3RhbXRzeXdrdmZsa25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTc3NzEsImV4cCI6MjEwMDEzMzc3MX0.l2cwbexUtleArDHdRhO-v0B-GC3RAcDgue-JRYRURBQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing Supabase Auth...');
  
  // Try to register a fake test user
  const email = 'testuser_' + Date.now() + '@example.com';
  const password = 'TestPassword123!';
  
  console.log('Attempting signup for:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) {
    console.error('Signup Error:', error.message);
  } else {
    console.log('Signup Success! User ID:', data.user?.id);
    
    // Test login
    console.log('Attempting login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (loginError) {
      console.error('Login Error:', loginError.message);
    } else {
      console.log('Login Success! Session token length:', loginData.session?.access_token.length);
    }
  }
}

testAuth();
