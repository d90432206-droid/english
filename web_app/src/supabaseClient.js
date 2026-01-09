
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wcgdapjjzpzvjprzudyq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZ2RhcGpqenB6dmpwcnp1ZHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTc4ODEsImV4cCI6MjA4MzUzMzg4MX0._Nn91KgZjMCZfvr6189RY-GIy_l-PwZSAIrQ06SYJNY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
