import LoginButton from "./loginButton";
import temp from "../pants2.jpeg";
import Image from "next/image";
import Link from "next/link";

function NavBar() {
  return (
    <nav className=" border-indigo-300  border-solid border-s-4 w-full bg-indigo-400 h-16 p-2 sticky top-0 min-w-[600px] overflow-hidden">
      <ul className=" justify-between">
        <li id="icon">
          <Image src={temp.src} width={50} height={30} alt="logo"></Image>
        </li>
        <li>
          <Link
            href="/addClothes"
            className="block font-semibold text-lg px-5 py-2 rounded-3xl m-1 cursor-pointer hover:bg-indigo-500 active:bg-purple-600 hover:text-white transition-colors duration-300"
          >
            +
          </Link>
        </li>
        <li>
          <LoginButton></LoginButton>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
