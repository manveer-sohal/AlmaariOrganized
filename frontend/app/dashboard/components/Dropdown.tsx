import { MessageCircle, User } from "lucide-react";
import LoginButton from "../../components/loginButton";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCredits } from "../../hooks/useCredits";
import CreditsBalanceButton from "../../components/CreditsBalanceButton";

type DropdownProps = {
  onBuyCredits?: () => void;
  onClose?: () => void;
};

export default function Dropdown({ onBuyCredits, onClose }: DropdownProps) {
  const { user, isLoading } = useUser();
  const { credits, isLoadingCredits } = useCredits();

  return (
    <div className="bg-indigo-300/70 backdrop-blur flex flex-col gap-2 rounded-xl p-2 shadow-md min-w-[12rem]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 ">
        {isLoading ? (
          <span>Loading...</span>
        ) : user ? (
          <div className="relative inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-default border border-indigo-300 bg-indigo-100/70 text-indigo-900">
            <User className="w-4 h-4" />
            <span className="truncate max-w-[14rem]">{user.email}</span>
          </div>
        ) : (
          <span>Logged out</span>
        )}
      </div>

      {onBuyCredits ? (
        <CreditsBalanceButton
          credits={credits}
          isLoading={isLoadingCredits}
          onBuyCredits={() => {
            onClose?.();
            onBuyCredits();
          }}
          compact
        />
      ) : null}

      <Options
        icon={<MessageCircle className="w-4 h-4" />}
        name="Feedback"
        onClick={() => {
          onClose?.();
          window.location.href = "/feedback";
        }}
      />
      <LoginButton onNavigate={onClose} />
    </div>
  );
}

function Options({
  name,
  onClick,
  icon,
}: {
  name: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
      onClick={onClick}
    >
      {icon}
      <span>{name}</span>
    </div>
  );
}
