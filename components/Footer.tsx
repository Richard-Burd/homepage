import { getTranslations } from 'next-intl/server'

export default async function Footer() {
  const t = await getTranslations('Footer')

  return (
    <footer>
      <p
        dir="ltr"
        className="mx-auto max-w-3xl px-4 py-8 text-center text-[1.4rem] text-zinc-700 dark:text-zinc-50"
      >
        {t.rich('copyright', {
          name: (chunks) => <span dir="ltr">{chunks}</span>,
        })}
      </p>
    </footer>
  )
}
