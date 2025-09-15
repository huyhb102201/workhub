import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    ChevronDown,
    Menu,
    X,
    Globe,
    LogIn,
    UserPlus,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider"; // <-- lấy user + logout

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth(); // { name, email, photo, provider } | null

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navItems = [
        {
            label: "Find Talent",
            sub: ["Post a Job", "Talent Marketplace", "Project Catalog", "Consultations"],
        },
        {
            label: "Find Work",
            sub: ["Ways to earn", "Find Jobs", "Projects", "Profile tips"],
        },
        { label: "Why Us", sub: ["Success stories", "How it works", "Trust & Safety"] },
        { label: "Enterprise", sub: ["For enterprises", "Compliance", "Hire at scale"] },
    ];

    return (
        <header
            className={`sticky top-0 z-50 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/75 ${scrolled ? "shadow-sm border-b" : "border-b border-transparent"
                }`}
        >
            {/* Row 1: logo + menus + auth */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                <div className="flex h-14 items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-xl font-semibold">
                        <span className="h-7 w-7 bg-emerald-600 rounded-full inline-block" />
                        Work<span className="text-emerald-600">Hub</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative group">
                                <button className="h-10 inline-flex items-center gap-1 px-3 rounded-xl text-sm font-medium text-neutral-700 hover:text-emerald-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200">
                                    {item.label}
                                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                                </button>
                                {/* Dropdown */}
                                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition absolute left-0 mt-2 w-60 rounded-2xl border border-neutral-200 bg-white shadow-lg p-2">
                                    {item.sub.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-emerald-50"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Right side (desktop) */}
                    <div className="hidden md:flex items-center gap-2">
                        <button className="h-10 inline-flex items-center gap-2 px-3 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 border border-neutral-200">
                            <Globe className="h-4 w-4" /> EN
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                {/* Avatar + name */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white">
                                    <img
                                        src={user.photo || ""}
                                        alt=""
                                        className="h-7 w-7 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-medium truncate max-w-[120px]">
                                        {user.name || "User"}
                                    </span>
                                </div>

                                {/* Nút Log out kế bên */}
                                <button
                                    onClick={logout}
                                    className="px-3 py-1.5 rounded-xl text-sm font-medium border border-neutral-200 hover:bg-neutral-50"
                                >
                                    Log out
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 rounded-xl hover:bg-neutral-100 text-sm font-medium"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}

                    </div>

                    {/* Mobile burger */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Row 2: search (desktop) */}
            <div className="hidden md:block">
                <div className="max-w-5xl mx-auto px-4 lg:px-6 pb-3">
                    <div className="flex h-11 items-stretch rounded-2xl border border-neutral-300 overflow-hidden bg-white">
                        <input
                            type="text"
                            placeholder="Search services, jobs, talent..."
                            className="flex-1 px-4 text-sm outline-none"
                        />
                        <button className="px-4 bg-emerald-600 text-white hover:bg-emerald-700 text-sm inline-flex items-center gap-2">
                            <Search className="h-4 w-4" /> Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-black/35"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl p-4 flex flex-col">
                        {/* Header in drawer */}
                        <div className="flex items-center justify-between">
                            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-lg font-semibold">
                                <span className="h-7 w-7 bg-emerald-600 rounded-full inline-block" />
                                Work<span className="text-emerald-600">Hub</span>
                            </Link>
                            <button
                                className="p-2 rounded-lg hover:bg-neutral-100"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close menu"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Menus */}
                        <div className="mt-4 flex-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <details key={item.label} className="group border-b py-2">
                                    <summary className="flex items-center justify-between cursor-pointer text-sm font-medium py-2">
                                        {item.label}
                                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="pl-2 pb-2 flex flex-col gap-1">
                                        {item.sub.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                className="text-left rounded-lg px-2 py-1 text-sm hover:bg-neutral-50"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>

                        {/* Auth area */}
                        <div className="mt-3 flex flex-col gap-2">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 p-2 rounded-xl border">
                                        <img
                                            src={user.photo || ""}
                                            alt=""
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {user.name || "User"}
                                            </div>
                                            <div className="text-xs text-neutral-500 truncate">
                                                {user.email || ""}
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 py-2 rounded-lg border hover:bg-neutral-50 text-center"
                                    >
                                        My profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            logout();
                                        }}
                                        className="px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200"
                                    >
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 py-2 rounded-lg border hover:bg-neutral-50 text-center"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-center hover:bg-emerald-700"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </header>
    );
}
