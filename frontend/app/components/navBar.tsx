import LoginButton from "./loginButton";
import temp from "../Logo.png";
import Image from "next/image";
import Link from "next/link";
import React, { Dispatch, SetStateAction, useState } from "react";

type NavBarProps = {
  onSearchTermChange?: Dispatch<SetStateAction<string>>;
};

function NavBar({ onSearchTermChange }: NavBarProps) {
  const [search, setSearch] = useState("");

  const handleChange = (value: string) => {
    setSearch(value);
    onSearchTermChange?.(value);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSearchTermChange?.(search);
  };
  return (
    <nav className=" border-indigo-300  border-solid border-s-4 w-full bg-indigo-400 h-16 p-2 sticky top-0 min-w-[600px] overflow-hidden">
      <ul className="flex items-center justify-between gap-2 h-full">
        <li id="icon" className="shrink-0">
          <Image src={temp.src} width={50} height={30} alt="logo"></Image>
        </li>
        <li className="flex-1 max-w-2xl mx-2">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search clothes by type or colour..."
                className="w-full rounded-xl border border-indigo-300 bg-indigo-100/70 placeholder-indigo-700/70 text-indigo-900 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition"
              />
              <span className="absolute inset-y-0 left-3 flex items-center text-indigo-700/80">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4.3-4.3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => handleChange("")}
                  className="absolute inset-y-0 right-3 flex items-center text-indigo-700/80 hover:text-indigo-900"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </li>
        <li className="shrink-0">
          <Link
            href="/addClothes"
            className="block font-semibold text-lg px-5 py-2 rounded-3xl m-1 cursor-pointer hover:bg-indigo-500 active:bg-purple-600 hover:text-white transition-colors duration-300"
          >
            +
          </Link>
        </li>
        <li className="shrink-0">
          <LoginButton></LoginButton>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
