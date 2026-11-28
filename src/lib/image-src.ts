// Photos uploaded through the admin live in Supabase Storage's public bucket and are already
// resized on upload, so they are served straight from Supabase instead of through Next's image
// optimiser. That removes the server-side download (7 s timeout) that can fail on its own and
// leave a broken image even though the file is fine. Files in /public still use the optimiser.
export function servedDirectly(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:") || /^https:\/\/[^/]+\/storage\/v1\/object\/public\//.test(src);
}
