import LoginButton from "./loginButton";
import temp from "../pants2.jpeg";
import Image from "next/image";
import Link from "next/link";

function NavBar() {
  return (
    <>
      <ul id="nav-bar">
        <li id="icon">
          <Image src={temp.src} width={50} height={30} alt="logo"></Image>
        </li>
        <li>
          <Link href="/addClothes" className="nav-bar-li">
            +
          </Link>
        </li>
        <li>
          <LoginButton></LoginButton>
        </li>
      </ul>
    </>
  );
}

export default NavBar;
