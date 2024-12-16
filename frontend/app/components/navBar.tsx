import { UserProvider, useUser } from "@auth0/nextjs-auth0/client";
import LoginButton from "./loginButton";
import AddClothes from "../../../deleteModule/addClothes";
import temp from "../pants2.jpeg";

type NavBarProps = {
  toggleForm: () => void; // Function with no arguments that returns void
};

function NavBar({ toggleForm }: NavBarProps) {
  return (
    <>
      <ul id="nav-bar">
        <li id="icon">
          <img src={temp.src} width={50} height={30}></img>
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
