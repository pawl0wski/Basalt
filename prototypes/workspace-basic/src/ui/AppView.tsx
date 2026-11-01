import { ToastProvider } from "@basalt/ui";
import { useStore } from "../model/store";
import { Welcome } from "./Welcome";
import { WorkspaceWindow } from "./WorkspaceWindow";

export function AppView() {
    const { state } = useStore();
    return (
        <ToastProvider>
            {state.workspace ? <WorkspaceWindow /> : <Welcome />}
        </ToastProvider>
    );
}
