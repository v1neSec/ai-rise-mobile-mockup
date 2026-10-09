export function appendLocalImage(form: FormData, field: string, uri: string | null | undefined) {
  if (!uri) return;
  const fileName = uri.split(/[\\/]/).pop() || `${field}.jpg`;
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mime = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  form.append(field, { uri, name: fileName, type: mime } as unknown as Blob);
}
