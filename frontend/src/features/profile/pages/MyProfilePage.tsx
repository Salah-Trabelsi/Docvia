import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/api/profile'
import { Button } from '@/components/ui/button'
import { ProfileDetails } from '../components/ProfileDetails'

export function MyProfilePage() {
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: ({ signal }) => getProfile(signal), retry: false })

  return (
    <div className="min-w-0 space-y-5">
      <section aria-labelledby="my-profile-heading" className="relative isolate flex min-h-36 items-center overflow-hidden rounded-xl bg-accent/50 px-5 pt-5 pb-28 sm:px-7 sm:py-6 lg:px-9">
        <svg aria-hidden="true" focusable="false" viewBox="18 22 3304 414" preserveAspectRatio="xMaxYMid meet" className="pointer-events-none absolute inset-0 -z-20 hidden h-full w-full lg:block">
          <image href={`${import.meta.env.BASE_URL}images/banners/docvia-myprofile-banner.png`} width="3340" height="471" style={{ maskImage: 'linear-gradient(to right, transparent, black 35%)' }} />
        </svg>
        {/* Tablet fills the banner with the artwork rather than letterboxing it. */}
        <svg aria-hidden="true" focusable="false" viewBox="22 25 3290 410" preserveAspectRatio="xMaxYMid slice" className="pointer-events-none absolute inset-0 -z-20 hidden h-full w-full sm:block lg:hidden">
          <image href={`${import.meta.env.BASE_URL}images/banners/docvia-myprofile-banner.png`} width="3340" height="471" />
        </svg>
        {/* On phones, keep the portrait below the text and extend only empty background. */}
        <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 -z-20 h-full w-full sm:hidden">
          <svg width="100%" height="100%" viewBox="400 35 900 390" preserveAspectRatio="none">
            <image href={`${import.meta.env.BASE_URL}images/banners/docvia-myprofile-banner.png`} width="3340" height="471" />
          </svg>
        </svg>
        <svg aria-hidden="true" focusable="false" viewBox="1900 25 1412 410" preserveAspectRatio="xMaxYMax meet" className="pointer-events-none absolute right-0 bottom-0 -z-10 h-28 w-full sm:hidden">
          <image href={`${import.meta.env.BASE_URL}images/banners/docvia-myprofile-banner.png`} width="3340" height="471" style={{ maskImage: 'linear-gradient(to right, transparent 56%, black 65%)' }} />
        </svg>
        <div className="max-w-full sm:max-w-[48%] lg:max-w-[60%]">
          <h1 id="my-profile-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">My Profile</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">Manage your personal information and keep your account up to date</p>
        </div>
      </section>
      {profile.isPending ? <p role="status" className="rounded-xl bg-card p-5">Loading your profile...</p>
        : profile.isError ? <div role="alert" className="space-y-3 rounded-xl bg-card p-5"><p>Unable to load your profile. Please try again.</p><Button onClick={() => { void profile.refetch() }}>Try again</Button></div>
        : <ProfileDetails profile={profile.data} />}
    </div>
  )
}
