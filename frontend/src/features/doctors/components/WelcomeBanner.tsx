export function WelcomeBanner() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative isolate flex min-h-48 items-center overflow-hidden rounded-xl sm:min-h-44 lg:min-h-[170px]"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full sm:block"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="100 80 700 556"
          preserveAspectRatio="none"
        >
          <image
            href={`${import.meta.env.BASE_URL}images/banners/docvia-welcome-doctor.png`}
            width="2206"
            height="713"
          />
        </svg>
        <svg
          width="100%"
          height="100%"
          viewBox="24 70 2158 566"
          preserveAspectRatio="xMaxYMid meet"
        >
          <image
            href={`${import.meta.env.BASE_URL}images/banners/docvia-welcome-doctor.png`}
            width="2206"
            height="713"
            style={{
              maskImage: "linear-gradient(to right, transparent 5%, black 55%)",
            }}
          />
        </svg>
      </svg>
      {/* Mobile keeps the portrait at a readable size below the text, without
          fitting the entire wide source into a letterboxed horizontal strip. */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="100 90 700 540"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full sm:hidden"
      >
        <image
          href={`${import.meta.env.BASE_URL}images/banners/docvia-welcome-doctor.png`}
          width="2206"
          height="713"
        />
      </svg>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="1220 80 920 550"
        preserveAspectRatio="xMaxYMax meet"
        className="pointer-events-none absolute right-0 bottom-0 -z-10 h-32 w-full sm:hidden"
      >
        <image
          href={`${import.meta.env.BASE_URL}images/banners/docvia-welcome-doctor.png`}
          width="2206"
          height="713"
          style={{
            maskImage: "linear-gradient(to right, transparent 55%, black 65%)",
          }}
        />
      </svg>
      <div className="w-full px-5 pt-5 pb-32 sm:w-[65%] sm:py-7 sm:pr-2 sm:pl-8 xl:pl-11">
        <h1
          id="welcome-heading"
          className="text-xl leading-tight font-semibold tracking-tight text-foreground min-[380px]:text-2xl sm:text-3xl"
        >
          Find the right doctor
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base xl:text-lg">
          Book appointments with trusted specialists near you
        </p>
      </div>
    </section>
  );
}
