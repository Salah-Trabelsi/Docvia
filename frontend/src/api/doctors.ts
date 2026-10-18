import { api } from '../lib/axios'

export const getDoctorBySlug = async (slug: string) => {
  const { data } = await api.get(`/doctors/${slug}`)
  return data
}

export const getDoctors = async () => {
  const { data } = await api.get('/doctors')
  return data
}