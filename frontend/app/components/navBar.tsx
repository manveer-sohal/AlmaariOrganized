import LoginButton from "./loginButton";
import temp from "../pants2.jpeg";
import Image from "next/image";

type NavBarProps = {
  toggleForm: () => void; // Function with no arguments that returns void
};

function NavBar({ toggleForm }: NavBarProps) {
  return (
    <>
      <ul id="nav-bar">
        <li id="icon">
          <Image src={temp.src} width={50} height={30} alt="logo"></Image>
        </li>
        <li>
          <button onClick={toggleForm} className="nav-bar-li">
            +
          </button>
        </li>
        <li>
          <LoginButton></LoginButton>
        </li>
      </ul>
    </>
  );
}

export default NavBar;
