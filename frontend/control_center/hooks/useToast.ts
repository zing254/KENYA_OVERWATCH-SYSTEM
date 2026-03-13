'use client'

import toast from 'react-hot-toast'

export function useToast() {
  const success = (message: string) => toast.success(message)
  const error = (message: string) => toast.error(message)
  const info = (message: string) => toast(message, { icon: 'ℹ️' })
  const loading = (message: string) => toast.loading(message)

  return { success, error, info, loading, dismiss: toast.dismiss }
}