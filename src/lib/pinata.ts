// Pinata IPFS upload helper.
// Requires VITE_PINATA_JWT (Build Secret) and optionally VITE_PINATA_GATEWAY
// (e.g. "your-subdomain.mypinata.cloud"). Falls back to the public gateway.

// 👇 PASTE YOUR PINATA JWT HERE (between the quotes)
// Get one at: https://app.pinata.cloud/developers/api-keys
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjMjQ1MTRlMi1mMjcxLTQwYjktOGFjNy1mOTYwYTQyZDMxNmYiLCJlbWFpbCI6ImJvb25uZXR3b3JraW5nQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiMmRkZjBmMzYxMTBjNmI2ZWEwNyIsInNjb3BlZEtleVNlY3JldCI6IjgyOWQ0NjY1YTk3ZTY1NDYwZDFlMWFjMDllODhkOWQ4NmQ1NDRkZDg5MTA5YWZkZWI1MDQzNTBmMDE0NDYwOGUiLCJleHAiOjE4MTExNjE5NDN9.XKNIWbOFrgRkvcYXovrK18XilEA886bMbGiGY63Gmr4";

// 👇 (Optional) Paste your dedicated gateway domain here, e.g. "your-name.mypinata.cloud"
// Leave as-is to use the public gateway.
const PINATA_GATEWAY = "gateway.pinata.cloud";

export const isPinataConfigured = (): boolean => Boolean(PINATA_JWT);

export const ipfsToHttp = (cid: string, filename?: string): string => {
  const base = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
  return filename ? `${base}/${encodeURIComponent(filename)}` : base;
};

export interface PinataUploadResult {
  cid: string;
  url: string;
}

export const uploadToPinata = async (
  file: File,
  onProgress?: (pct: number) => void,
): Promise<PinataUploadResult> => {
  if (!PINATA_JWT) {
    throw new Error(
      'Pinata is not configured. Open src/lib/pinata.ts and paste your JWT into PINATA_JWT.',
    );
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    throw new Error('Only image or video files are allowed.');
  }

  // 100 MB cap (videos can be large)
  const MAX_BYTES = 100 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('File must be smaller than 100 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append(
    'pinataMetadata',
    JSON.stringify({ name: file.name || 'campaign-image' }),
  );
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  // Use XHR so we can report progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
    xhr.setRequestHeader('Authorization', `Bearer ${PINATA_JWT}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const cid: string = data.IpfsHash;
          resolve({ cid, url: ipfsToHttp(cid, file.name) });
        } catch (err) {
          reject(new Error('Invalid response from Pinata.'));
        }
      } else {
        reject(
          new Error(
            `Pinata upload failed (${xhr.status}): ${xhr.responseText || 'unknown error'}`,
          ),
        );
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Pinata upload.'));
    xhr.send(formData);
  });
};
