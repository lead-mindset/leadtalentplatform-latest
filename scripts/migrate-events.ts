import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createAdminClient } from '@/lib/supabase/admin';

// Map Instagram event types to Supabase enum
const eventTypeMap: Record<string, 'in_person' | 'online' | 'hybrid'> = {
  'PANEL': 'in_person',
  'WORKSHOP': 'in_person',
  'NETWORKING': 'in_person',
  'MEETUP': 'in_person',
  'ONLINE': 'online',
  'HYBRID': 'hybrid',
};

// Map Instagram chapter handles to database chapter IDs
const chapterMap: Record<string, string> = {
  'lead_pucp': 'leadpucp',
  'lead.upc': 'leadupc',
  'lead_uni': 'leaduni',
  'lead_utp': 'leadutp',
  'lead_unmsm': 'leadunmsm',
  'lead_upn': 'leadupn',
  'leadupn_trujillo': 'leadupntrujillo',
  'lead.villarreal': 'leadvillareal',
};

async function migrateEvents() {
  const adminClient = createAdminClient();
  
  // Get admin user ID for created_by_id
  const { data: adminUser } = await adminClient
    .from('user')
    .select('id')
    .eq('email', 'abigailbrionesaranda@gmail.com')
    .single();
  
  if (!adminUser) {
    console.error('Admin user not found');
    process.exit(1);
  }
  
  // Read events from JSON file
  const eventsData = require('../lead_events_complete.json');
  const events = eventsData.events || [];
  
  console.log(`🚀 Migrating ${events.length} events...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const event of events) {
    const chapterId = chapterMap[event.chapter_id];
    if (!chapterId) {
      console.warn(`⚠️  Unknown chapter: ${event.chapter_id}, skipping event: ${event.title}`);
      continue;
    }
    
    // Parse dates
    const startAt = new Date(event.start_date).toISOString();
    const endAt = event.end_date 
      ? new Date(event.end_date).toISOString()
      : new Date(new Date(event.start_date).getTime() + 2 * 60 * 60 * 1000).toISOString(); // +2 hours default
    
    const eventData = {
      title: event.title,
      description: event.description || null,
      event_type: eventTypeMap[event.event_type] || 'in_person',
      access_model: 'open', // must be 'open' or 'application' per DB constraint
      start_at: startAt,
      end_at: endAt,
      chapter_id: chapterId,
      created_by_id: adminUser.id,
      location: event.location_name || null,
      location_name: event.location_name || null,
      location_address: event.location_address || null,
      location_city: event.location_city || null,
      location_region: event.location_region || null,
      location_latitude: event.location_latitude || null,
      location_longitude: event.location_longitude || null,
      location_point: event.location_point || null,
      is_published: true,
      cover_image: event.instagram_permalink || null,
    };
    
    const { error } = await adminClient
      .from('event')
      .insert(eventData);
    
    if (error) {
      console.error(`❌ Failed: ${event.title}:`, error.message);
      failCount++;
    } else {
      console.log(`✅ Migrated: ${event.title}`);
      successCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} success, ${failCount} failed`);
}

migrateEvents().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
