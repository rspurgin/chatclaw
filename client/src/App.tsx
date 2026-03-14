import { ChatWindow } from "./components/chat/ChatWindow";
import { LogViewer } from "./components/log/LogViewer";
import { socket } from "./lib/socket";

export function App() {
  const handleShareSystemInfo = () => {
    const systemInfo = `Agent connected at ${new Date().toLocaleTimeString()}! Ready to share data.`;
    socket.emit("share_data", systemInfo);
  };

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-blue-500 bg-clip-text text-transparent">
            ChatClaw
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time local communication and telemetry for Open Claw
          </p>
        </div>

        <button
          onClick={handleShareSystemInfo}
          className="bg-dark-800 hover:bg-dark-700 text-primary-400 border border-primary-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
        >
          Share System Data
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)] min-h-[500px]">
        <section className="h-full">
          <ChatWindow />
        </section>
        <section className="h-full">
          <LogViewer />
        </section>
      </main>
    </div>
  );
}
