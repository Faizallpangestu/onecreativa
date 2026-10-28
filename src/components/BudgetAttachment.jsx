import { ExternalLink, Image } from "lucide-react";
import { budgetImageUrl } from "../utils/budgetApi";

export default function BudgetAttachment({ request, requestId = request.id }) {
  const imageUrl = request.attachment_key ? budgetImageUrl(requestId, request.attachment_key) : null;
  const link = /^https?:\/\//i.test(request.attachment_link || "") ? request.attachment_link : null;
  if (!imageUrl && !link) return null;
  return <div className="rab-attachment">
    <h3>Lampiran Pengajuan</h3>
    {imageUrl && <a className="rab-attachment-image" href={imageUrl} target="_blank" rel="noopener noreferrer">
      <img src={imageUrl} alt={request.attachment_name || "Gambar referensi RAB"} loading="lazy" />
      <span><Image size={16} />{request.attachment_name || "Gambar referensi"}<ExternalLink size={14} /></span>
    </a>}
    {link && <a className="rab-attachment-link" href={link} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /><span>{link}</span></a>}
  </div>;
}
