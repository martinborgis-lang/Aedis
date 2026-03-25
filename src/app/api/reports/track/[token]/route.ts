import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Update the opened_at timestamp for this tracking token
  await supabase
    .from('report_recipients')
    .update({ opened_at: new Date().toISOString() })
    .eq('tracking_token', params.token)
    .is('opened_at', null) // Only update if not already opened

  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )
  return new Response(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}