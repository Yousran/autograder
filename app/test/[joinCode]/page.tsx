export default function TestJoinPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Join Test</h1>
      <p className="mb-4">Enter the code to join the test.</p>
      <input
        type="text"
        placeholder="Enter code"
        className="border border-gray-300 p-2 rounded mb-4"
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded">Join</button>
    </div>
  );
}
