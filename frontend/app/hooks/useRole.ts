export const useRole = async (auth0Id: string) => {
  if (!auth0Id) return null;
  const response = await fetch(`/api/users/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth0Id }),
  });
  if (!response.ok) throw new Error("Failed to fetch role");
  const data = await response.json();
  localStorage.setItem("role", JSON.stringify(data.role));
  console.log("role", data.role);
};
