import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://howvgvrrxcpdiqjbnhzn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvd3ZndnJyeGNwZGlxamJuaHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODEwMTYsImV4cCI6MjA5NDI1NzAxNn0.a98sfMQATyOiud76uetu8D--1VSsw0tWftEdVDA_HUs'

export const supabase = createClient(supabaseUrl, supabaseKey)