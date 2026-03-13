type DownloadAssetParams = {
  url: string;
  filename?: string;
};

type ShareAssetParams = {
  url: string;
  title: string;
  filename?: string;
};

function createTemporaryLink(url: string, filename?: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (filename) link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function fetchBlob(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to fetch media (${response.status})`);
  return response.blob();
}

export async function downloadAsset({ url, filename }: DownloadAssetParams) {
  try {
    const blob = await fetchBlob(url);
    const objectUrl = URL.createObjectURL(blob);
    createTemporaryLink(objectUrl, filename);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  } catch {
    createTemporaryLink(url, filename);
  }
}

export async function shareAsset({ url, title, filename }: ShareAssetParams): Promise<"shared" | "copied" | "unsupported"> {
  if (typeof navigator === "undefined") return "unsupported";

  try {
    if (navigator.share) {
      try {
        const blob = await fetchBlob(url);
        const extension = blob.type.includes("pdf") ? "pdf" : "jpg";
        const file = new File([blob], filename ?? `${title.toLowerCase().replace(/\s+/g, "-")}.${extension}`, { type: blob.type || "application/octet-stream" });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title });
          return "shared";
        }
      } catch {
        await navigator.share({ url, title });
        return "shared";
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {
    return "unsupported";
  }

  return "unsupported";
}
