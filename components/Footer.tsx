import { getTranslations } from 'next-intl/server'

import FooterSocialBand from '@/components/FooterSocialBand'
import SocialNav from '@/components/SocialNav'

export default async function Footer() {
  const t = await getTranslations('Footer')

  return (
    <footer className="bg-[#e4e4e7] dark:bg-[#27272a]">
      <FooterSocialBand>
        <SocialNav />
      </FooterSocialBand>
      <p
        dir="ltr"
        className="mx-auto max-w-3xl px-4 py-8 text-center text-[0.98rem] text-zinc-700 min-[800px]:text-[1.4rem] dark:text-zinc-50"
      >
        {t.rich('copyright', {
          year: new Date().getFullYear(),
          name: (chunks) => <span dir="ltr">{chunks}</span>,
        })}
      </p>
    </footer>
  )
}
