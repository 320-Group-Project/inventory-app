"use client"

import Link from "next/link"

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <Link
        className="btn btn-ghost text-3xl"
        style={{ fontFamily: "var(--font-lora), serif", fontWeight: 400 }}
        href="/dashboard"
      >
        <span style={{ color: "#881c1c" }}>U</span>
        <span style={{ color: "#212721" }}>Inventory</span>
      </Link>
    </div>
  )
}

export default Navbar