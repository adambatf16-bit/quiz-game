import type { Metadata } from 'next'
import { HostApp } from '@/components/host/host-app'

export const metadata: Metadata = {
  title: 'شاشة المضيف | اكتشف الخطأ',
}

export default function HostPage() {
  return <HostApp />
}
