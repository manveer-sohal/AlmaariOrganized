import ChooseColour from "./chooseColour";
import ValidateType from "./validateType";
import React, { Dispatch, SetStateAction, useState } from "react";
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
  const [displayFilterType, setDisplayFilterType] = useState<string>("none");
  const [colour, setColour] = useState<string[] | null | undefined>([]);
  const [type, setType] = useState<string[] | null | undefined>([]);

  const onClickFilter = () => {
    if (displayFilterType == "none") {
      setDisplayFilterType("block");
    } else {
      setDisplayFilterType("none");
    }
  };

  const handleSubmit = () => {
    console.log("apply");

    onQuery({ colour, type });

    onClickFilter();
  };
  return (
    <>
      <ul id="side-bar">
        <li>
          <button className="side-bar-li" onClick={onClickFilter}>
            filter
          </button>

          <div className="dropdwn" style={{ display: displayFilterType }}>
            <div className="dropdwn-content">
              <ChooseColour colour={setColour}></ChooseColour>
              <ValidateType type={setType}></ValidateType>
            </div>
            <button
              className="side-bar-li"
              style={{ width: "50%", height: "40px" }}
              onClick={handleSubmit}
            >
              Apply
            </button>
          </div>
        </li>

        <li>
          <button className="side-bar-li">random</button>
        </li>
      </ul>
    </>
  );
}

export default SideBar;
