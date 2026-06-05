export function Spinner({ size = 20, className = '' }) {
  return (
    <div
      className={`inline-block rounded-full border-2 border-t-cyan border-white/10 animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export default Spinner
