import ChooseColour from "./chooseColour";
import ValidateType from "./validateType";
import React, { Dispatch, SetStateAction, useState } from "react";
import WeatherCheck from "./weatherCheck";
//  onQuery: (Dispatch<SetStateAction<{ colour: string[] | undefined; type: string[] | undefined; } | undefined>>) => void;

type SideBarProp = {
  onQuery: Dispatch<
    SetStateAction<
      | {
          colour: string[] | null | undefined;
          type: string[] | null | undefined;
        }
      | undefined
    >
  >;
};
function SideBar({ onQuery }: SideBarProp) {
  const [active, setActive] = useState<boolean>(false);
  const [displayFilterType, setDisplayFilterType] = useState<string>("none");
  const [colour, setColour] = useState<string[] | null | undefined>([]);
  const [type, setType] = useState<string[] | null | undefined>([]);

  const onClickFilter = () => {
    if (displayFilterType == "none") {
      setDisplayFilterType("block");
      setActive(true);
    } else {
      setDisplayFilterType("none");
      setActive(false);
    }
    console.log(active);
  };

  const handleSubmit = () => {
    console.log("apply");

    onQuery({ colour, type });

    onClickFilter();
  };
  return (
    <>
      <ul className=" border-indigo-300 border-l-4 p-3 h-screen text-center bg-indigo-400/90 backdrop-blur-sm py-[2.1vh] flex flex-col min-w-[180px] shadow-md">
        <li>
          <button
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2.5 rounded-xl m-1 cursor-pointer border ${
              active === true
                ? "bg-white text-indigo-900 border-indigo-300"
                : "bg-indigo-100/70 text-indigo-900 border-indigo-200"
            } hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors duration-200`}
            onClick={onClickFilter}
            aria-pressed={active}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 5h16l-6 7v5l-4 2v-7L4 5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Filter</span>
          </button>

          <div
            className={`dropdwn ${
              displayFilterType === "block" ? "flex" : "hidden"
            } rounded-lg flex-col`}
          >
            <div className="relative bg-white/80 backdrop-blur border border-indigo-200 shadow-md p-3 rounded-lg">
              <ChooseColour colour={setColour}></ChooseColour>
              <ValidateType type={setType}></ValidateType>
            </div>
            <button
              className="w-1/2 inline-flex items-center justify-center gap-2 font-medium px-4 py-2 rounded-xl m-1 cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
              onClick={handleSubmit}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Apply</span>
            </button>
          </div>
        </li>
        <button className="w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border bg-indigo-100/70 text-indigo-900 border-indigo-200 hover:bg-indigo-500 active:bg-purple-600 hover:text-white hover:border-indigo-500 transition-colors duration-200">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4h4v4H4zM16 4h4v4h-4zM10 10h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>Random</span>
        </button>
        <WeatherCheck></WeatherCheck>
      </ul>
    </>
  );
}

export default SideBar;
