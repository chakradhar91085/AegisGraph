'use client'
import Link from 'next/link'

interface LineHoverLinkProps {
  href?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  active?: boolean
}

export default function LineHoverLink({ href = '#', children, className = '', onClick, active }: LineHoverLinkProps) {
  const cls = `
    relative inline-block text-sm font-medium cursor-pointer transition-colors duration-200
    text-indigo-300 hover:text-white
    after:content-[''] after:absolute after:bottom-0 after:left-0
    after:h-[1.5px] after:bg-indigo-400
    after:transition-all after:duration-300 after:ease-out
    ${active ? 'text-white after:w-full' : 'after:w-0 hover:after:w-full'}
    ${className}
  `

  if (onClick) {
    return <span className={cls} onClick={onClick}>{children}</span>
  }

  return <Link href={href} className={cls}>{children}</Link>
}
