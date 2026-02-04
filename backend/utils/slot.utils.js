export const mapTypeToSlot = (type) => {
  const t = type.toLowerCase();
  if (
    t.includes("hat") ||
    t.includes("cap") ||
    t.includes("beanie") ||
    t.includes("scarf")
  ) {
    return "head";
  }
  if (
    t.includes("shirt") ||
    t.includes("t-shirt") ||
    t.includes("tee") ||
    t.includes("hoodie") ||
    t.includes("jacket") ||
    t.includes("coat") ||
    t.includes("sweater") ||
    t.includes("jumper") ||
    t.includes("blouse") ||
    t.includes("dress") ||
    t.includes("top") ||
    t.includes("cardigan") ||
    t.includes("vest")
  ) {
    return "body";
  }
  if (
    t.includes("jeans") ||
    t.includes("pants") ||
    t.includes("trousers") ||
    t.includes("leggings") ||
    t.includes("shorts") ||
    t.includes("skirt") ||
    t.includes("cargos") ||
    t.includes("capri") ||
    t.includes("pajamas")
  ) {
    return "legs";
  }
  if (
    t.includes("shoes") ||
    t.includes("boots") ||
    t.includes("sneakers") ||
    t.includes("sandals") ||
    t.includes("heels") ||
    t.includes("socks")
  ) {
    return "feet";
  }
  return "body";
};
