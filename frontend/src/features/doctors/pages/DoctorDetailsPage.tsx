import { Link, useParams } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useDoctor } from '@/hooks/useDoctor'
import { getDoctors } from '@/api/doctors'
import { mapApiDoctor } from '../utils/mapDoctor'
import { DoctorProfileCard } from '../components/DoctorProfileCard'
import { BookingCalendar } from '../components/BookingCalendar'
import { DoctorDetailsSidebar } from '../components/DoctorDetailsSidebar'

export function DoctorDetailsPage() {
  const { doctorId } = useParams<{ doctorId: string }>()
  const { data, isLoading, isError } = useDoctor(doctorId)
  const { data: allDoctors } = useQuery({ queryKey: ['doctors'], queryFn: getDoctors })

  if (isLoading) return <div className="space-y-3"><h1 className="text-2xl font-semibold">Loading...</h1></div>
  if (isError || !data) return (
    <div className="space-y-3"><h1 className="text-2xl font-semibold">Doctor not found</h1><p className="text-muted-foreground">This doctor profile is unavailable.</p><Link to="/" className="inline-block py-2 text-brand-foreground underline underline-offset-4">Back to Overview</Link></div>
  )

  const doctor = mapApiDoctor(data)

  return (
    <div className="@container min-w-0 lg:-mt-15">
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <li><Link to="/" className="inline-block py-2 hover:text-brand-foreground">Overview</Link></li>
          <li aria-hidden="true"><ChevronRight className="size-4" /></li>
          <li aria-current="page" className="text-foreground">Dr. {doctor.firstName} {doctor.lastName}</li>
        </ol>
      </nav>
      <div className="grid min-w-0 grid-cols-1 gap-6 @min-[70rem]:grid-cols-[minmax(0,7fr)_minmax(20rem,3fr)]">
        <div className="@container min-w-0 space-y-5">
          <DoctorProfileCard doctor={doctor} />
          <BookingCalendar key={doctor._id} doctor={doctor} />
        </div>
        <DoctorDetailsSidebar doctor={doctor} allDoctors={allDoctors?.map(mapApiDoctor)} />
      </div>
    </div>
  )
}
