import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const mapFromDb = (row) => ({
  id: row.id,
  company: row.company,
  contact: row.contact || '',
  email: row.email || '',
  phone: row.phone || '',
  ffc: row.ffc || '',
  data: row.data || {},
  submitted: row.submitted || false,
  submittedDate: row.submitted_date || null,
  helpRequests: row.help_requests || {},
  created: row.created_at,
  lastModified: row.last_modified,
});

export const mapToDb = (client) => ({
  ...(client.id ? { id: client.id } : {}),
  company: client.company,
  contact: client.contact || '',
  email: client.email || '',
  phone: client.phone || '',
  ffc: client.ffc || '',
  data: client.data || {},
  submitted: client.submitted || false,
  submitted_date: client.submittedDate || null,
  help_requests: client.helpRequests || {},
  last_modified: new Date().toISOString(),
});
