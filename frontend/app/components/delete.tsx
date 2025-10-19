function Delete({ uniqueId }: { uniqueId: string }) {
  const handleDelete = (uniqueId: string) => {
    console.log("deleting outfit", uniqueId);
  };
  return (
    <div>
      <h1>Are you sure you want to delete this outfit? {uniqueId}</h1>
      <div className="flex gap-2">
        <button
          className="bg-indigo-500 text-white px-4 py-2 rounded-md"
          onClick={() => handleDelete(uniqueId)}
        >
          Delete
        </button>
        <button
          className="bg-indigo-500 text-white px-4 py-2 rounded-md"
          onClick={() => handleDelete(uniqueId)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Delete;
