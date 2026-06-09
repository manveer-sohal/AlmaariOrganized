"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <Link
      className="inline-flex items-center font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
      href={user ? "/api/auth/logout" : "/api/auth/login"}
      onClick={() => {
        if (user) {
          setIsLoggingOut(true);
          console.log("Logging out...");
        } else {
          console.log("Redirecting to login...");
        }
      }}
    >
      {isLoggingOut ? (
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
      ) : (
        <span className="flex items-center gap-2">
          {user ? (
            <LogOut className="w-4 h-4" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {user ? "Logout" : "Login"}
        </span>
      )}
    </Link>
  );
}

export default LoginButton;
