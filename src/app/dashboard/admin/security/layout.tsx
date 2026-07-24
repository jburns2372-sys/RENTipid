export default async function SecurityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200">
      <div className="flex-1 w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
