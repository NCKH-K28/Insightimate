export const storageApi = {
  uploadFile: async (file: File, params: { projectId: string; requestId: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/v2/storage/upload?${query}`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
