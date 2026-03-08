export default function DynamicGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div className="dynamic-glow-blob blob-green-1" />
      <div className="dynamic-glow-blob blob-green-2" />
      <div className="dynamic-glow-blob blob-blue" />
      <div className="dynamic-glow-blob blob-orange" />
    </div>
  );
}
