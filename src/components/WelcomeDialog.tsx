"use client"

import { useState, useEffect } from "react"
import { X, Github, Star } from "lucide-react"
import { GiSoulVessel } from "react-icons/gi"
import { signUpInitialSouls } from '../../Limits';

interface WelcomeDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setVisible(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setVisible(false)
    onClose()
  }

  if (!mounted || !visible) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl border border-red-500/50 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.85)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/60 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-7 text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-black/60">
              <iframe
                src="https://tenor.com/embed/11397231996208728070"
                width="100%"
                height="100%"
                className="h-full w-full pointer-events-none"
                frameBorder="0"
                allowFullScreen
                title="Welcome cat GIF"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-red-300 via-red-500 to-red-600 bg-clip-text text-transparent">
                  DevilDev
                </span>
              </h2>
              <p className="text-sm text-zinc-300">
                As a welcome reward, we&apos;ve added{" "}
                <span className="font-semibold text-red-300">{signUpInitialSouls} souls</span> to your
                account. Go build something fun.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/50 px-3 py-1.5 text-sm text-red-100">
              <GiSoulVessel className="h-4 w-4" />
              <span>+{signUpInitialSouls} souls added</span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center justify-center gap-1 text-sm text-zinc-200">
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <span>DevilDev is open source</span>
              </div>
              <p className="text-xs text-zinc-400">
                If you like this, a quick star on GitHub really helps.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  window.open("https://github.com/lak7/devildev", "_blank")
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black py-2.5 transition hover:bg-zinc-100"
              >
                <Github className="h-4 w-4" />
                <span>Star on GitHub</span>
              </button>
              <button
                onClick={handleClose}
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/5"
              >
                Start building
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
