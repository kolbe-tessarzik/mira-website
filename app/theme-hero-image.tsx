import Image from "next/image";

export function ThemeHeroImage() {
  return (
    <div className="theme-hero-image">
      <div className="hero-image-slot hero-image-light">
        <Image
          src="/assets/mira_app_light.png"
          alt="Screenshot of the Mira browser in light mode"
          width={3808}
          height={2078}
          quality={100}
          sizes="(max-width: 520px) 100vw, 980px"
          unoptimized
          className="hero-app-image"
        />
      </div>
      <div className="hero-image-slot hero-image-dark">
        <Image
          src="/assets/mira_app.png"
          alt="Screenshot of the Mira browser in dark mode"
          width={7680}
          height={4220}
          quality={100}
          sizes="(max-width: 520px) 100vw, 980px"
          unoptimized
          className="hero-app-image"
        />
      </div>
    </div>
  );
}
