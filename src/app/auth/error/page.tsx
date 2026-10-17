import { Suspense } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Page({ searchParams }: PageProps<'/auth/error'>) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-medium text-lg tracking-normal">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorMessage searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function ErrorMessage({ searchParams }: Pick<PageProps<'/auth/error'>, 'searchParams'>) {
  const { error } = await searchParams

  return error ? (
    <p className="text-sm text-muted-foreground">Code error: {error}</p>
  ) : (
    <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
  )
}
