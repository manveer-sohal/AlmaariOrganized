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
      <ul className="border-indigo-300  border-solid border-x-4	p-2 h-screen text-center bg-indigo-400 py-[2.1vh] flex flex-col min-w-[140px]">
        <li>
          <button
            className={`w-full block font-semibold text-lg px-5 py-2 rounded-3xl m-1 cursor-pointer ${
              active === true ? "bg-indigo-300" : "bg-indigo-400"
            } hover:bg-indigo-500 hover:text-white transition-colors duration-300`}
            onClick={onClickFilter}
          >
            filter
          </button>

          <div
            className={`dropdwn ${
              displayFilterType === "block" ? "flex" : "hidden"
            } rounded-lg flex-col`}
          >
            <div className="relative bg-indigo-100 shadow-lg p-2 rounded-lg">
              <ChooseColour colour={setColour}></ChooseColour>
              <ValidateType type={setType}></ValidateType>
            </div>
            <button
              className="w-1/2 block font-semibold  px-5 py-2 rounded-3xl m-1 cursor-pointer  hover:bg-indigo-500 hover:text-white transition-colors duration-300"
              onClick={handleSubmit}
            >
              Apply
            </button>
          </div>
        </li>
        <button className="w-full block font-semibold text-lg px-5 py-2 rounded-3xl m-1 cursor-pointer hover:bg-indigo-500 active:bg-purple-600 hover:text-white transition-colors duration-300">
          random
        </button>
        <WeatherCheck></WeatherCheck>
      </ul>
    </>
  );
}

export default SideBar;
