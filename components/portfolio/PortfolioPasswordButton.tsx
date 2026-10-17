'use client'

import { useRef, useState, type FormEvent } from 'react'
import { LuEye, LuEyeOff } from 'react-icons/lu'

import { useRouter } from '@/i18n/navigation'

export default function PortfolioPasswordButton() {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  function openDialog() {
    setError('')
    dialogRef.current?.showModal()
    passwordRef.current?.focus()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function clearSecret() {
    setPassword('')
    setRevealed(false)
    setError('')
    setPending(false)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')

    let response: Response
    try {
      response = await fetch('/api/portfolio/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ password }),
      })
    } catch {
      setPending(false)
      setError('Could not check the password. Try again.')
      passwordRef.current?.focus()
      return
    }

    if (!response.ok) {
      setPending(false)
      setError('Incorrect password.')
      passwordRef.current?.focus()
      passwordRef.current?.select()
      return
    }

    setPassword('')
    closeDialog()
    router.push('/schematic-visualization/portfolio')
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="cursor-pointer rounded border border-zinc-800 bg-zinc-900 px-8 py-3 text-sm font-semibold tracking-wide text-white outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-zinc-100"
      >
        portfolio
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="portfolio-password-title"
        onClose={clearSecret}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog()
        }}
        className="fixed inset-0 m-auto h-fit w-[min(100%-2rem,22rem)] rounded-lg border border-zinc-300 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/60 dark:border-zinc-700 dark:bg-black dark:text-white dark:backdrop:bg-black/70"
      >
        <form autoComplete="off" onSubmit={onSubmit}>
          <h2 id="portfolio-password-title" className="text-lg font-semibold">
            Portfolio Area
          </h2>
          <label htmlFor="portfolio-password" className="mt-4 block text-sm">
            Please enter the secret sause
          </label>
          <div className="mt-2 flex gap-2">
            <input
              ref={passwordRef}
              id="portfolio-password"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              value={password}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'portfolio-password-error' : undefined}
              onChange={(event) => setPassword(event.target.value)}
              className={`min-w-0 flex-1 rounded border border-zinc-400 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white dark:focus-visible:ring-white ${
                revealed ? '' : '[-webkit-text-security:disc]'
              }`}
            />
            <button
              type="button"
              aria-pressed={revealed}
              aria-label={revealed ? 'Hide password' : 'Show password'}
              onClick={() => {
                setRevealed((current) => !current)
                passwordRef.current?.focus()
              }}
              className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded border border-zinc-400 text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-600 dark:text-zinc-100 dark:focus-visible:ring-white"
            >
              {revealed ? (
                <LuEyeOff aria-hidden className="size-5" />
              ) : (
                <LuEye aria-hidden className="size-5" />
              )}
            </button>
          </div>
          {error ? (
            <p
              id="portfolio-password-error"
              role="alert"
              className="mt-3 text-sm text-red-700 dark:text-red-400"
            >
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="cursor-pointer rounded px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-black dark:focus-visible:ring-white"
            >
              Continue
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
