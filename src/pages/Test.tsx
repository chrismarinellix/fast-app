import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export default function Test() {
  const [status, setStatus] = useState<string[]>(['Starting tests...']);

  const addStatus = (msg: string) => {
    setStatus(prev => [...prev, msg]);
    console.log(msg);
  };

  useEffect(() => {
    const runTests = async () => {
      const supabaseUrl = 'https://mlimixgmnkhjgjutoncr.supabase.co';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saW1peGdtbmtoamdqdXRvbmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Mjc4MTUsImV4cCI6MjA4MzEwMzgxNX0.TBA1t7832cxQ19_Xob0-dfj2gMrcTVj54M5K05A3Lm4';

      // Create a minimal client with NO auth config
      const minimalClient = createClient(supabaseUrl, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      });

      // Test 1: Basic connectivity
      addStatus('Test 1: Checking Supabase URL...');
      addStatus(`URL: ${supabaseUrl}`);

      // Test 2: Direct fetch to Supabase REST API
      addStatus('Test 2: Direct fetch to Supabase...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const start = Date.now();
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const elapsed = Date.now() - start;

        if (response.ok) {
          addStatus(`✅ Direct fetch OK (${elapsed}ms) - Status: ${response.status}`);
        } else {
          const text = await response.text();
          addStatus(`❌ Direct fetch failed: ${response.status} - ${text}`);
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          addStatus(`❌ Direct fetch TIMEOUT after 5s`);
        } else {
          addStatus(`❌ Direct fetch error: ${e.message}`);
        }
      }

      // Test 3: MINIMAL client query (no auth features)
      addStatus('Test 3: Minimal client query (no auth)...');
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        );
        const queryPromise = minimalClient.from('profiles').select('count').limit(1);

        const start = Date.now();
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        const elapsed = Date.now() - start;

        if (result.error) {
          addStatus(`❌ Minimal query error: ${result.error.message}`);
        } else {
          addStatus(`✅ Minimal query OK (${elapsed}ms)`);
        }
      } catch (e: any) {
        addStatus(`❌ Minimal query failed: ${e.message}`);
      }

      // Test 4: Original client query
      addStatus('Test 4: Original client query...');
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        );
        const queryPromise = supabase.from('profiles').select('count').limit(1);

        const start = Date.now();
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        const elapsed = Date.now() - start;

        if (result.error) {
          addStatus(`❌ Original query error: ${result.error.message}`);
        } else {
          addStatus(`✅ Original query OK (${elapsed}ms)`);
        }
      } catch (e: any) {
        addStatus(`❌ Original query failed: ${e.message}`);
      }

      // Test 5: Auth session with timeout
      addStatus('Test 5: Auth session check...');
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        );
        const authPromise = supabase.auth.getSession();

        const start = Date.now();
        const result = await Promise.race([authPromise, timeoutPromise]) as any;
        const elapsed = Date.now() - start;

        if (result.error) {
          addStatus(`❌ Auth error: ${result.error.message}`);
        } else if (result.data?.session) {
          addStatus(`✅ Session found (${elapsed}ms): ${result.data.session.user.email}`);
        } else {
          addStatus(`⚠️ No session (${elapsed}ms)`);
        }
      } catch (e: any) {
        addStatus(`❌ Auth failed: ${e.message}`);
      }

      addStatus('---');
      addStatus('Tests complete!');
    };

    runTests();
  }, []);

  return (
    <div style={{
      padding: 24,
      fontFamily: 'monospace',
      background: '#1a1a1a',
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1>Fast! Debug Console</h1>
      <div style={{ marginTop: 16 }}>
        {status.map((line, i) => (
          <div key={i} style={{ marginBottom: 4 }}>{line}</div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <a href="/" style={{ color: '#00aaff' }}>← Back to Home</a>
      </div>
    </div>
  );
}
