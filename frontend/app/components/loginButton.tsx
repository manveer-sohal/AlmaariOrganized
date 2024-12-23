"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";

/*
this is a login button component, we leep it seprate as interactable compoents should have the
"use client" on top, and to keeo the nav bar on the server side, having the buttons seprate 
lets it work

if the user is autheniticated, which comes from the "@auth0/nextjs-auth0/client" import which gives
us the state of "user"
load in the according button needed

the buttons have refrences to certain endpoints which comes from auth0 
predifined endpoints which lets it load the auth0 authenticaiton page

this is loaded into the nav bar, keeping it seperate due to "use cliet"
*/
function LoginButton() {
  const { user } = useUser();

  return (
    <div>
      {user ? (
        <Link
          className="nav-bar-li"
          href="/api/auth/logout"
          onClick={() => console.log("Logging out...")}
        >
          Logout
        </Link>
      ) : (
        <Link
          className="nav-bar-li"
          href="/api/auth/login"
          onClick={() => console.log("Redirecting to login...")}
        >
          Login
        </Link>
      )}
    </div>
  );
}

export default LoginButton;
