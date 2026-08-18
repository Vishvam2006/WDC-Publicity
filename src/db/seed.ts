import { db } from './db';

export async function seedDatabase() {
  const usersCount = await db.users.count();
  if (usersCount === 0) {
    await db.users.add({
      name: 'My Profile',
      email: 'user@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const timeSlotsCount = await db.time_slots.count();
  if (timeSlotsCount === 0) {
    await db.time_slots.bulkAdd([
      { name: 'Period 1', day_of_week: 'All', start_time: '08:00', end_time: '09:00', slot_type: 'class_period', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { name: 'Period 2', day_of_week: 'All', start_time: '09:00', end_time: '10:00', slot_type: 'class_period', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { name: 'Period 3', day_of_week: 'All', start_time: '10:00', end_time: '11:00', slot_type: 'class_period', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { name: 'Lunch', day_of_week: 'All', start_time: '11:00', end_time: '12:00', slot_type: 'break', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { name: 'Period 4', day_of_week: 'All', start_time: '12:00', end_time: '13:00', slot_type: 'class_period', sort_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]);
  }
}
