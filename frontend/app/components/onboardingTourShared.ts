import type { Config } from "driver.js";

/** Shared Almaari look for driver.js tours */
export const almaariDriverDefaults: Pick<
  Config,
  | "popoverClass"
  | "nextBtnText"
  | "prevBtnText"
  | "doneBtnText"
  | "progressText"
  | "animate"
  | "allowClose"
  | "overlayOpacity"
  | "stagePadding"
  | "stageRadius"
  | "showProgress"
> = {
  popoverClass: "almaari-driver-popover",
  nextBtnText: "Next",
  prevBtnText: "Back",
  doneBtnText: "Got it",
  progressText: "{{current}} / {{total}}",
  animate: true,
  allowClose: true,
  overlayOpacity: 0.55,
  stagePadding: 8,
  stageRadius: 12,
  showProgress: true,
};
