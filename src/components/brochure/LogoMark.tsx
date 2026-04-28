import type { BrochureTheme, SanityImage } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'

type Props = {
  /** Per-brochure logo override. Falls back to the GPGT default when blank. */
  logo?: SanityImage
  /** Reserved for future variant selection. Currently unused — there is one default logo. */
  theme?: BrochureTheme
  className?: string
}

const DEFAULT_LOGO = '/textures/Grand_Prix_Logo_Vector_Editable 5.png'

export function LogoMark({ logo, className }: Props) {
  const overrideUrl = urlForSection(logo, 600)
  const src = overrideUrl ?? DEFAULT_LOGO

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} />
}
