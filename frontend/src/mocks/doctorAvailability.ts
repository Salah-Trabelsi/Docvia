export interface DemoTimeSlot {
  time: string
  available: boolean
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type WeeklySchedule = Partial<Record<Weekday, DemoTimeSlot[]>>

function slots(available: string[], unavailable: string[] = []): DemoTimeSlot[] {
  return [
    ...available.map(time => ({ time, available: true })),
    ...unavailable.map(time => ({ time, available: false })),
  ].sort((a, b) => a.time.localeCompare(b.time))
}

// Fictional recurring practice schedules in Europe/Berlin (0 = Sunday).
// Missing weekdays are closed. These schedules, not legacy badge hints, drive booking.
export const doctorWeeklySchedules: Record<string, WeeklySchedule> = {
  'ethan-roberts': {
    1: slots(['09:00', '10:00', '14:00'], ['09:30']),
    3: slots(['10:00', '10:30', '15:00'], ['11:00']),
    5: slots(['14:00', '16:00', '18:00'], ['14:30']),
    6: slots(['09:00', '10:30', '12:00'], ['11:00']),
  },
  'olivia-martinez': {
    2: slots(['09:30', '11:30', '14:30'], ['10:00']),
    4: slots(['10:00', '13:00', '16:00'], ['14:00']),
    6: slots(['10:00', '11:30'], ['10:30']),
  },
  'daniel-wilson': {
    1: slots(['10:30', '14:00', '15:30'], ['11:00']),
    2: slots(['09:00', '12:00'], ['09:30']),
    5: slots(['09:00', '11:00', '15:00'], ['10:00']),
  },
  'sarah-ahmed': {
    1: slots(['08:30', '10:30', '14:00'], ['09:00']),
    4: slots(['09:00', '11:00', '16:00'], ['10:00']),
    5: slots(['10:00', '14:00', '17:30'], ['11:30']),
    0: slots(['09:30', '11:00'], ['10:00']),
  },
  'michael-braun': {
    2: slots(['08:30', '10:00', '13:30'], ['09:00']),
    3: slots(['09:00', '11:00', '15:00'], ['10:00']),
    4: slots(['10:30', '14:30'], ['11:00']),
  },
  'laura-schmidt': {
    1: slots(['09:30', '11:30'], ['10:00']),
    3: slots(['10:00', '14:00'], ['10:30']),
    5: slots(['09:00', '13:00', '16:30'], ['14:00']),
    6: slots(['13:00', '14:00', '15:00'], ['13:30']),
  },
}

