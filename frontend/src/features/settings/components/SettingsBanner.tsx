const imageUrl = `${import.meta.env.BASE_URL}images/banners/docvia-settings-doctor.png`

export function SettingsBanner() {
  return (
    <section aria-labelledby="settings-heading" className="relative isolate flex min-h-36 items-center overflow-hidden rounded-xl bg-accent/50 px-5 pt-5 pb-28 sm:px-7 sm:py-6 lg:px-9">
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 -z-20 h-full w-full">
        <svg width="100%" height="100%" viewBox="0 100 1000 550" preserveAspectRatio="none"><image href={imageUrl} width="2172" height="724" /></svg>
      </svg>
      <svg aria-hidden="true" focusable="false" viewBox="0 120 2172 550" preserveAspectRatio="xMaxYMid meet" className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full sm:block">
        <image href={imageUrl} width="2172" height="724" style={{ maskImage: 'linear-gradient(to right, transparent 20%, black 60%)' }} />
      </svg>
      <svg aria-hidden="true" focusable="false" viewBox="1250 150 922 520" preserveAspectRatio="xMaxYMax meet" className="pointer-events-none absolute right-0 bottom-0 -z-10 h-28 w-full sm:hidden">
        <image href={imageUrl} width="2172" height="724" style={{ maskImage: 'linear-gradient(to right, transparent 55%, black 65%)' }} />
      </svg>
      <div className="max-w-full sm:max-w-[48%] lg:max-w-[60%]">
        <h1 id="settings-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">Manage your account settings and preferences</p>
      </div>
    </section>
  )
}

