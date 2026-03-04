import LoginButton from "../../components/loginButton";
import { useUser } from "@auth0/nextjs-auth0/client";
export default function Dropdown() {
  const { user, isLoading } = useUser();
  return (
    <div className="bg-indigo-300/70 backdrop-blur flex flex-col gap-2 rounded-b-xl p-2 shadow-md ">
      <div className="flex items-center gap-2 ">
        {isLoading ? (
          <span>Loading...</span>
        ) : user ? (
          <div className="relative inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300">
            <span>{user.email}</span>
          </div>
        ) : (
          <span>Logged out</span>
        )}
      </div>

      <Options
        name="Feedback"
        onClick={() => {
          window.location.href = "/feedback";
        }}
      />
      <LoginButton />
    </div>
  );
}

function Options({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <div
      className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
      onClick={onClick}
    >
      <span>{name}</span>
    </div>
  );
}
