export default function MapEmbed({ lat, lng, name }: { lat: string; lng: string; name: string }) {
  if (!lat || !lng) return null
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video w-full">
      <iframe
        title={`Map for ${name}`}
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
