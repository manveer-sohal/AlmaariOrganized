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

  const handleBackendSync = async () => {
    if (!user) {
      console.error("User is not authenticated. Cannot sync login.");
      return;
    }

    const auth0Id = user.sub;
    const email = user.email || "default@example.com"; // Fallback if email is missing

    try {
      const response = await fetch("/api/Users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id, email }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error syncing with backend:", error);
        return;
      }

      const data = await response.json();
      console.log("Successfully synced login with backend:", data);
    } catch (error) {
      console.error("Failed to sync login with backend:", error);
    }
  };

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
      {user && (
        <button onClick={handleBackendSync} className="nav-bar-li">
          Sync Login
        </button>
      )}
    </div>
  );
}

export default LoginButton;
