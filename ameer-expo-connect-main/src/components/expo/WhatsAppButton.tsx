// TODO: confirm this number with the client — parsed from a voice note and not
// fully certain. Kenyan mobile numbers are 10 digits (07XX XXX XXX / 01XX XXX XXX).
// Update WHATSAPP_NUMBER below (digits only, with country code, no leading 0 or +).
const WHATSAPP_NUMBER = "254799888403";
const WHATSAPP_MESSAGE = "Hi, I'd like to know more about Ameer Expo 2026.";

export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] shadow-elegant transition-transform hover:scale-110 hover:shadow-glow"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="white" aria-hidden="true">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.386.703 4.61 1.912 6.478L4 29l7.72-1.876A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75a9.7 9.7 0 0 1-4.95-1.356l-.355-.21-4.584 1.114 1.132-4.47-.232-.365A9.7 9.7 0 0 1 5.75 15c0-5.658 4.598-10.25 10.254-10.25S26.25 9.342 26.25 15 21.66 24.75 16.004 24.75Zm5.61-7.678c-.307-.154-1.816-.897-2.098-1-.281-.103-.486-.154-.69.154-.204.307-.792 1-.972 1.205-.179.204-.358.23-.665.077-.307-.154-1.296-.478-2.469-1.523-.913-.814-1.53-1.82-1.709-2.127-.179-.307-.019-.473.135-.626.138-.138.307-.358.46-.537.154-.18.205-.307.307-.512.103-.204.051-.384-.026-.537-.077-.154-.69-1.664-.946-2.28-.249-.6-.502-.518-.69-.528l-.588-.01c-.204 0-.537.077-.818.384-.281.307-1.073 1.05-1.073 2.56s1.098 2.97 1.251 3.175c.154.204 2.16 3.298 5.234 4.625.731.316 1.301.505 1.745.646.733.233 1.4.2 1.927.121.588-.088 1.816-.742 2.072-1.459.256-.716.256-1.33.179-1.459-.077-.128-.281-.204-.588-.358Z" />
      </svg>
    </a>
  );
}
