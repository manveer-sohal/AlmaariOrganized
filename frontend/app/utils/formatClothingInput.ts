export function formatClothingInput(value: string) {
  const spaceValue = value.indexOf(" ");
  if (spaceValue > 0) {
    return (
      value.substring(0, 1).toUpperCase() +
      value.substring(1, spaceValue).toLowerCase() +
      value.substring(spaceValue, spaceValue + 2).toUpperCase() +
      value.substring(spaceValue + 2).toLowerCase()
    );
  }
  return value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
}
