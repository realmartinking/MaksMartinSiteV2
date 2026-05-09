/**
 * Brand tagline. Three lines, intentionally line-broken.
 * Sized in design units (`--u`) so it scales with the responsive --design-w.
 */
export function Tagline({ className = "" }: { className?: string }) {
  return (
    <p
      className={`m-0 select-none text-fg/85 leading-tight ${className}`}
      style={{
        fontSize: "calc(15 * var(--u))",
        marginTop: "calc(63 * var(--u))",
        letterSpacing: "0.01em",
      }}
    >
      Timeless design,
      <br />
      like classical music,
      <br />
      love and money
    </p>
  )
}
