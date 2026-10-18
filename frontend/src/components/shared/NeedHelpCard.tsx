import { useId } from 'react'
import { Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

export function NeedHelpCard({ className }: { className?: string }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className={cn('rounded-xl bg-accent/50 p-4', className)}>
      <div className="relative mb-3 w-fit">
        <img src="/images/icons/robot-assistant.png" alt="" className="size-14 rounded-full border border-primary bg-accent/40 p-1 object-contain" />
        <Sparkles aria-hidden="true" className="absolute -right-5 top-1 size-3.5 text-primary/60" />
      </div>
      <h2 id={headingId} className="text-sm font-semibold">Need Help?</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Our AI assistant is here to help you.</p>
      <Button nativeButton={false} render={<Link to="/assistant" />} variant="outline" className="mt-4 h-auto min-h-11 max-w-full whitespace-normal rounded-full border-primary px-3 py-2 text-xs text-brand-foreground hover:bg-accent hover:text-brand-foreground">Contact Assistant</Button>
    </section>
  )
}

