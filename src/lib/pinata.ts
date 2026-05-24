// Pinata IPFS upload helper.
// Requires VITE_PINATA_JWT (Build Secret) and optionally VITE_PINATA_GATEWAY
// (e.g. "your-subdomain.mypinata.cloud"). Falls back to the public gateway.

// 👇 PASTE YOUR PINATA JWT HERE (between the quotes)
// Get one at: https://app.pinata.cloud/developers/api-keys
const PINATA_JWT = "";

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
      'Pinata is not configured. Add VITE_PINATA_JWT in Workspace Settings → Build Secrets.',
    );
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.');
  }

  // 10 MB cap to keep things snappy
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be smaller than 10 MB.');
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
