import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cyksocbxzxkxhpxkdfab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a3NvY2J4enhreGhweGtkZmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODgwMzgsImV4cCI6MjA5MDg2NDAzOH0.4f3jrM3c4YpA9134bSiEVD6kBYs6covnYffFPm00B5g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
