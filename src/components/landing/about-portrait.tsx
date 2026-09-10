import { AppImage } from "@/components/media/app-image"
import { cn } from "@/lib/utils"

type AboutPortraitProps = {
  src: string
  alt: string
  name: string
  role: string
  priority?: boolean
  /** featured = grand cadre central ; inline = intégré à côté du texte */
  variant?: "featured" | "inline"
  className?: string
}

export function AboutPortrait({
  src,
  alt,
  name,
  role,
  priority = false,
  variant = "featured",
  className,
}: AboutPortraitProps) {
  const isFeatured = variant === "featured"

  return (
    <figure
      className={cn(
        "ak-portrait ak-reveal",
        isFeatured ? "ak-portrait--featured" : "ak-portrait--inline",
        className
      )}
    >
      <div className="ak-portrait__glow" aria-hidden />
      <div className="ak-portrait__frame">
        <div className="ak-portrait__mat">
          <div className="ak-portrait__media">
            <AppImage
              src={src}
              alt={alt}
              fill
              sizes={
                isFeatured
                  ? "(max-width: 768px) 80vw, 320px"
                  : "(max-width: 768px) 45vw, 220px"
              }
              className="object-cover object-top"
              priority={priority}
            />
            <div className="ak-portrait__vignette" aria-hidden />
          </div>
        </div>
      </div>
      <figcaption className="ak-portrait__caption">
        <span className="ak-portrait__ornament" aria-hidden>
          ◆
        </span>
        <span className="ak-portrait__name">{name}</span>
        <span className="ak-portrait__role">{role}</span>
        <span className="ak-portrait__ornament" aria-hidden>
          ◆
        </span>
      </figcaption>
    </figure>
  )
}
