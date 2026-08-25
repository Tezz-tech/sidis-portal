import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      duration={4000}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'bg-ink text-paper rounded-card border border-ink px-4 py-3 text-body flex items-center gap-3 shadow-float min-w-[280px]',
          success: 'bg-ink text-paper',
          error: 'bg-fail text-paper border-fail',
          title: 'text-body font-medium',
        },
      }}
    />
  );
}
