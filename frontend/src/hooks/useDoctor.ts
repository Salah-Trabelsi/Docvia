import { useQuery } from '@tanstack/react-query'
import { getDoctorBySlug } from '../api/doctors'

export const useDoctor = (slug?: string) => {
  return useQuery({
    queryKey: ['doctor', slug],
    queryFn: () => getDoctorBySlug(slug!),
    enabled: Boolean(slug),
  })
}