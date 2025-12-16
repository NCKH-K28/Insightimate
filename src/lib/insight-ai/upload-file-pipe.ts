'use client';

export const getUploadURL = async (file: File) => {
  const response = await fetch('/api/ai/file/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, mediaType: file.type, size: file.size }),
  });
  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg);
  }

  const data = await response.json();
  return data as {
    url: string;
    key: string;
    expiresAt: number;
    maxSize: number;
    metadata: { filename: string; mediaType: string };
  };
};

export const uploadFilePipe = async (file: File) => {
  const uploadURLData = await getUploadURL(file).catch((error) => {
    alert('Error getting upload URL: ' + error.message);
    return null;
  });
  if (!uploadURLData) return null;

  const { url } = uploadURLData;
  const uploadRes = await fetch(url, { method: 'PUT', body: file });
  if (!uploadRes.ok) {
    console.error('File upload failed:', await uploadRes.text());
    return null;
  }

  const filepath = url.split('?')[0]; // Remove query params
  return { key: uploadURLData.key, filename: file.name, filepath };
};
