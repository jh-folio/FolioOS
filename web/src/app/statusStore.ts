import { useEffect, useState } from "react";

export type ShellStatus = {
  statusText: string;
  docCount: string;
  activeJobId: string | null;
};

const DEFAULT_STATUS: ShellStatus = {
  statusText: "",
  docCount: "",
  activeJobId: null,
};

function readShellStatus(): ShellStatus {
  return DEFAULT_STATUS;
}

export function useShellStatus(): ShellStatus {
  const [status, setStatus] = useState<ShellStatus>(() => readShellStatus());

  useEffect(() => {
    const refresh = () => setStatus(readShellStatus());
    refresh();
    const intervalId = window.setInterval(refresh, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return status;
}
