import { UserProvider, useUser } from "@auth0/nextjs-auth0/client";
import LoginButton from "./loginButton";

function SideBar() {
  return (
    <>
      <ul id="side-bar">
        <li>
          <button className="side-bar-li">filter</button>
        </li>
        <li>
          <button className="side-bar-li">random</button>
        </li>
      </ul>
    </>
  );
}

export default SideBar;
