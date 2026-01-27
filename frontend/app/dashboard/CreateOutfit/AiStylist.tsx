import Image from "next/image";
import almaariMascot from "../../almaari-mascot.png";
import almaariMascotThinking from "../../almaari-mascot-thinking.png";

const AiStylist = ({
  aiMessages,
  mascotState,
}: {
  aiMessages: string[];
  mascotState: string;
}) => {
  return (
    <div
      id="ai-stylist"
      className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="leading-tight">
            <h3 className="font-medium text-indigo-900">AI Stylist</h3>
            <div className="text-[10px] text-indigo-700/70">
              Almaari Assistant
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => console.log("refreshing thoughts")}
          className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 h-8 rounded-lg cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white"
        >
          Refresh
        </button>
      </div>
      <div className="h-[260px] overflow-auto space-y-2 pr-1">
        {aiMessages.map((m, idx) => (
          <div
            key={`ai-${idx}`}
            className=" flex md:flex-row flex-col items-start"
          >
            <Image
              src={
                mascotState === "thinking"
                  ? almaariMascotThinking.src
                  : almaariMascot.src
              }
              alt="AI"
              width={60}
              height={16}
              className="mt-0.5"
            />
            <div className="relative bg-indigo-50 border border-indigo-100 text-indigo-900 text-sm p-2 rounded-lg max-w-[90%]">
              {m}
              <span
                className="absolute -left-1 top-3 h-0 w-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-indigo-100"
                aria-hidden="true"
              ></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiStylist;
