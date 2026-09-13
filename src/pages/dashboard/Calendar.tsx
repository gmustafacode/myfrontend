import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CalEvent {
  _id: string
  date: string
  title: string
  status: string
  platforms: string[]
}

const statusColors: Record<string, string> = {
  published: 'bg-green-500',
  scheduled: 'bg-yellow-500',
  queued: 'bg-purple-500',
  draft: 'bg-gray-400',
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    api.get(`/calendar?start=${start}&end=${end}`)
      .then((res) => setEvents(res.data.events || res.data || []))
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false))
  }, [currentMonth])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const firstDayOfWeek = startOfMonth(currentMonth).getDay()
  const paddingDays = Array(firstDayOfWeek).fill(null)

  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), day))

  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">View and manage your scheduled content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {paddingDays.map((_, i) => (
                  <div key={`pad-${i}`} className="bg-background min-h-[80px]" />
                ))}
                {days.map((day) => {
                  const dayEvents = eventsOnDay(day)
                  const isSelected = selectedDay && isSameDay(day, selectedDay)
                  const isToday = isSameDay(day, new Date())
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'bg-background min-h-[80px] p-1.5 text-left hover:bg-accent transition-colors',
                        isSelected && 'ring-2 ring-primary ring-inset',
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium inline-flex h-6 w-6 items-center justify-center rounded-full',
                        isToday && 'bg-primary text-primary-foreground',
                        !isSameMonth(day, currentMonth) && 'text-muted-foreground'
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e._id}
                            className={cn(
                              'text-xs px-1 py-0.5 rounded text-white truncate',
                              statusColors[e.status] || 'bg-gray-400'
                            )}
                          >
                            {e.title || e.platforms?.join(', ')}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day detail panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalIcon className="h-4 w-4" />
              {selectedDay ? format(selectedDay, 'EEEE, MMM d') : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDay ? (
              <p className="text-sm text-muted-foreground">Click a day to see scheduled posts.</p>
            ) : selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((e) => (
                  <div key={e._id} className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">{e.title}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs capitalize">{e.status}</Badge>
                      {e.platforms?.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
